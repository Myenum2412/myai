import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cognitiveContextManager } from "@/lib/engines/cognitive-context";
import { memoryEngine } from "@/lib/engines/memory";
import { relationshipEngine } from "@/lib/engines/relationship";
import { reflectionEngine } from "@/lib/engines/reflection";
import { goalEngine } from "@/lib/engines/goals";
import { analyticsEngine } from "@/lib/engines/analytics";
import { addMessage, getConversationStyle } from "@/lib/db";

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

    // Add goal context
    const goals = await goalEngine.getGoals(user.id);
    const goalContext = goalEngine.buildGoalContext(goals.active, []);

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
