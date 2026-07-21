import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cognitiveContextManager } from "@/lib/engines/cognitive-context";
import { memoryEngine } from "@/lib/engines/memory";
import { relationshipEngine } from "@/lib/engines/relationship";
import { reflectionEngine } from "@/lib/engines/reflection";
import { analyticsEngine } from "@/lib/engines/analytics";
import { addMessage, getConversationStyle, upsertMemory } from "@/lib/db";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, conversationId, isVoice } = await req.json();
  const startTime = Date.now();

  try {
    // ═══════════════════════════════════════════════════════════
    // PHASE 1: Build Cognitive Snapshot (all engines in parallel)
    // ═══════════════════════════════════════════════════════════
    const snapshot = await cognitiveContextManager.buildSnapshot(
      user.id,
      conversationId || "new",
      messages,
      isVoice
    );

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: Build Unified System Prompt
    // ═══════════════════════════════════════════════════════════
    const basePrompt = cognitiveContextManager.buildUnifiedPrompt(snapshot);

    // Add memory context
    const memoryPrompt = memoryEngine.buildMemoryPrompt(snapshot.memory);

    // OPTIMIZED: Use goals from snapshot (already fetched) instead of duplicate query
    const goalContext = snapshot.goals.active_goals.length > 0
      ? `\n## Goals\n` + snapshot.goals.active_goals.slice(0, 3).map(g => `- ${g.title} (${g.progress}% complete)`).join("\n") + "\n"
      : "";

    // Add relationship context
    const relationshipContext = relationshipEngine.buildRelationshipContext(snapshot.relationship);

    // Add reflection context
    const reflectionContext = ""; // Would load from previous analyses

    const fullSystemPrompt = basePrompt + memoryPrompt + goalContext + relationshipContext + reflectionContext;

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: Call AI with Unified Context
    // ═══════════════════════════════════════════════════════════
    const apiMessages = [
      { role: "system", content: fullSystemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-ultra-550b-a55b",
          messages: apiMessages,
          temperature: 1,
          top_p: 0.95,
          max_tokens: 2048,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("NVIDIA API error:", error);
      return new Response(JSON.stringify({ error: "API request failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 4: Stream Response with Background Tasks
    // ═══════════════════════════════════════════════════════════
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = "";
        let fullContent = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  // ═══ Background Tasks After Response ═══
                  if (conversationId && fullContent) {
                    // Save message
                    try {
                      await addMessage(conversationId, "assistant", fullContent);
                    } catch (e) {
                      console.error("Failed to save assistant message:", e);
                    }

                    // Run background tasks in parallel
                    Promise.all([
                      // Update relationship
                      relationshipEngine.updateAfterConversation(
                        user.id,
                        messages.length,
                        [snapshot.emotion.primary],
                        []
                      ),
                      // Store emotional memory
                      memoryEngine.storeMemory(user.id, "emotion", `emotion_${Date.now()}`, `User felt ${snapshot.emotion.primary} (intensity: ${Math.round(snapshot.emotion.intensity * 100)}%)`, {
                        type: "emotional",
                        importance: 7,
                        emotional_weight: snapshot.emotion.intensity,
                      }),
                      // Extract and store memories from user messages
                      extractMemoriesFromConversation(user.id, messages),
                      // Promote memories
                      memoryEngine.promoteMemories(user.id),
                      // Record analytics
                      analyticsEngine.recordMetric(user.id, "response_time", Date.now() - startTime, {
                        emotion: snapshot.emotion.primary,
                        relationship: snapshot.relationship.level,
                      }),
                      analyticsEngine.recordConversationEvent(user.id, "message_sent", {
                        conversation_id: conversationId,
                        emotion: snapshot.emotion.primary,
                        tokens: fullContent.length,
                      }),
                    ]).catch((e) => console.error("Background task error:", e));
                  }

                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta;
                  if (delta) {
                    const reasoning = delta.reasoning_content;
                    const content = delta.content;

                    if (reasoning) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "reasoning", content: reasoning })}\n\n`)
                      );
                    }
                    if (content) {
                      fullContent += content;
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "content", content })}\n\n`)
                      );
                    }
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ─── Memory Extraction from Conversation ───

// English memory extraction patterns
const ENGLISH_PATTERNS = {
  preference: [
    /(?:i (?:really )?(?:like|love|prefer|enjoy))\s+(.+?)(?:\.|!|$)/gi,
    /(?:my (?:favorite|fav|best))\s+(.+?)\s+(?:is|are)\s+(.+?)(?:\.|!|$)/gi,
    /(?:i (?:hate|don't like|dislike))\s+(.+?)(?:\.|!|$)/gi,
    /(?:i'm (?:into|obsessed with))\s+(.+?)(?:\.|!|$)/gi,
  ],
  hobby: [
    /(?:i (?:like|love|enjoy) (?:to )?(?:playing|reading|watching|listening|cooking|traveling|hiking|running|painting|drawing|writing|coding|gaming))\s+(.+?)(?:\.|!|$)/gi,
    /(?:my (?:hobby|hobbies|interest) (?:is|are))\s+(.+?)(?:\.|!|$)/gi,
  ],
  date: [
    /(?:my (?:birthday|birth date|bday))\s+(?:is\s+)?(.+?)(?:\.|!|$)/gi,
    /(?:our (?:anniversary|date))\s+(?:is\s+)?(.+?)(?:\.|!|$)/gi,
    /(?:i was born on)\s+(.+?)(?:\.|!|$)/gi,
  ],
  goal: [
    /(?:i (?:want to|plan to|will|hope to))\s+(.+?)(?:\.|!|$)/gi,
    /(?:my (?:goal|dream|aspiration|plan))\s+(?:is|are)\s+(.+?)(?:\.|!|$)/gi,
  ],
  fact: [
    /(?:my name is|i'm|i am)\s+(.+?)(?:\.|!|$)/gi,
    /(?:i work (?:at|for|in))\s+(.+?)(?:\.|!|$)/gi,
    /(?:i live (?:in|at))\s+(.+?)(?:\.|!|$)/gi,
    /(?:i'm (?:from|from originally))\s+(.+?)(?:\.|!|$)/gi,
    /(?:i study (?:at|in|under))\s+(.+?)(?:\.|!|$)/gi,
    /(?:i'm (?:a|an) student)\s+(?:at\s+)?(.+?)(?:\.|!|$)/gi,
  ],
  personality: [
    /(?:i am|i'm)\s+(?:a )?(?:really |very )?(?:shy|introvert|extrovert|ambivert|outgoing|quiet|loud|funny|serious|optimistic|pessimistic|romantic|practical)\s*(.+?)(?:\.|!|$)/gi,
  ],
  topic: [
    /(?:let's talk about|talk to me about|i want to discuss)\s+(.+?)(?:\.|!|$)/gi,
    /(?:i (?:want to|need to) talk about)\s+(.+?)(?:\.|!|$)/gi,
  ],
  milestone: [
    /(?:we (?:first|first time|first met))\s+(.+?)(?:\.|!|$)/gi,
    /(?:our (?:first|special))\s+(.+?)(?:\.|!|$)/gi,
  ],
};

// Tamil/Tanglish memory extraction patterns
const TANGLISH_PATTERNS = {
  preference: [
    /(?:enakku|enkku)\s+(.+?)\s+(?:romba|bayangara)?\s*(?:pudikkum|pidikkum|ishtam|favorite)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:romba|bayangara)?\s*(?:enjoy|pandren|seiyven)/gi,
    /(?:en\s+(?:favorite|fav))\s+(.+?)(?:\.|!|$)/gi,
  ],
  hobby: [
    /(?:naan|naa)\s+(.+?)\s+(?:pandren|seiyven|vilayaduven|padikken)/gi,
    /(?:en\s+(?:hobby|hobbies|interest))\s+(?:.+?)?\s*(?:romba|bayangara)?\s*(?:pudikkum|ishtam)/gi,
  ],
  date: [
    /(?:en\s+(?:birthday|pirainal|piranthanaal))\s+(?:.+?)?\s*(.+?)(?:\.|!|$)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:piranthen|poranthen)/gi,
  ],
  goal: [
    /(?:naan|naa)\s+(.+?)\s+(?:pannanum|seiyaven|aaganum)/gi,
    /(?:en\s+(?:goal|dream))\s+(?:.+?)?\s*(.+?)(?:\.|!|$)/gi,
  ],
  fact: [
    /(?:en\s+(?:per|name))\s+(?:.+?)?\s*(.+?)(?:\.|!|$)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:la irukken|la work|la study)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:irukken|irukku)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:student|engineer|doctor|teacher)/gi,
    /(?:naan|naa)\s+(?:irundhu\s+)?vandhen/i,
  ],
  personality: [
    /(?:naan|naa)\s+(?:.+?)?\s*(shy|introvert|extrovert|ambivert|outgoing|quiet|funny|serious)/gi,
  ],
  topic: [
    /(?:ippo|ini)\s+(.+?)\s+(?:pathi|patti)\s+(?:pesalaam|pesuvom|chat)/gi,
    /(?:.+?)\s+(?:pathi|patti)\s+(?:pesanum|pesalaam|solunga)/gi,
  ],
  milestone: [
    /(?:naam|namma)\s+(.+?)\s+(?:first|first time|first met)/gi,
  ],
};

// Explicit memory requests (both languages)
const EXPLICIT_PATTERNS = [
  // English
  /(?:remember|don't forget|i told you|i mentioned)\s+(?:that\s+)?(.+?)(?:\.|!|$)/gi,
  /(?:make a note|note down|save this)\s+(?:that\s+)?(.+?)(?:\.|!|$)/gi,
  // Tamil
  /(?:remember|yaad vechukonga|maathikonga|marantheengaadhaa)\s+(?:.+?)?\s*(.+?)(?:\.|!|$)/gi,
  /(?:enna pathi|en pathi)\s+(?:.+?)?\s*(?:记住|remember|solli irukken)/gi,
];

async function extractMemoriesFromConversation(
  userId: string,
  messages: { role: string; content: string }[]
): Promise<void> {
  // Get user messages
  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");

  if (!userMessages) return;

  const memories: Array<{ category: string; key: string; value: string; importance: number }> = [];
  const seen = new Set<string>();

  // Extract from English patterns
  for (const [category, patterns] of Object.entries(ENGLISH_PATTERNS)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(userMessages)) !== null) {
        const value = match[1]?.trim() || match[2]?.trim();
        if (value && value.length > 2 && value.length < 200) {
          const key = `${category}_${value.toLowerCase().slice(0, 50)}`;
          if (!seen.has(key)) {
            seen.add(key);
            let importance = 5;
            if (category === "date") importance = 8;
            if (category === "goal") importance = 7;
            if (category === "preference") importance = 6;
            if (category === "milestone") importance = 9;
            memories.push({ category, key, value, importance });
          }
        }
      }
    }
  }

  // Extract from Tanglish patterns
  for (const [category, patterns] of Object.entries(TANGLISH_PATTERNS)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(userMessages)) !== null) {
        const value = match[1]?.trim() || match[2]?.trim();
        if (value && value.length > 2 && value.length < 200) {
          const key = `ta_${category}_${value.toLowerCase().slice(0, 50)}`;
          if (!seen.has(key)) {
            seen.add(key);
            let importance = 5;
            if (category === "date") importance = 8;
            if (category === "goal") importance = 7;
            if (category === "preference") importance = 6;
            if (category === "milestone") importance = 9;
            memories.push({ category, key, value, importance });
          }
        }
      }
    }
  }

  // Check for explicit memory requests
  for (const pattern of EXPLICIT_PATTERNS) {
    let match;
    while ((match = pattern.exec(userMessages)) !== null) {
      const value = match[1]?.trim();
      if (value && value.length > 2) {
        const key = `explicit_${value.toLowerCase().slice(0, 50)}`;
        if (!seen.has(key)) {
          seen.add(key);
          memories.push({ category: "fact", key, value, importance: 9 });
        }
      }
    }
  }

  // Save extracted memories
  for (const memory of memories) {
    try {
      await upsertMemory(
        userId,
        memory.category as "preference" | "hobby" | "date" | "goal" | "fact" | "personality" | "topic" | "milestone",
        memory.key,
        memory.value,
        memory.importance
      );
    } catch (e) {
      console.error("Failed to save extracted memory:", e);
    }
  }

  if (memories.length > 0) {
    console.log(`Extracted ${memories.length} memories from conversation`);
  }
}
