import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertMemory, getUserMemory, deleteMemory } from "@/lib/db";

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
    /(?:enakku|enkku)\s+(.+?)\s+(?:romba |bayangara )?(?:pudikkum|pidikkum|ishtam|avorite)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:romba |bayangara )?(?:enjoy|pandren|seiyven)/gi,
    /(?:en (?:favorite|fav))\s+(.+?)\s+(?:\.|!|$)/gi,
  ],
  hobby: [
    /(?:naan|naa)\s+(.+?)\s+(?:pandren|seiyven|vilayaduven|padikken)/gi,
    /(?:en (?:hobby|hobbies|interest))\s+(?:.+?)?\s+(?:romba |bayangara )?(?:pudikkum|ishtam)/gi,
  ],
  date: [
    /(?:en (?:birthday|pirainal|piranthanaal))\s+(?:.+?)?\s+(.+?)(?:\.|!|$)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:piranthen|poranthen)/gi,
  ],
  goal: [
    /(?:naan|naa)\s+(.+?)\s+(?:pannanum|seiyaven|plan|want)/gi,
    /(?:en (?:goal|dream|目标))\s+(?:.+?)?\s+(.+?)(?:\.|!|$)/gi,
  ],
  fact: [
    /(?:en (?:per|name))\s+(?:.+?)?\s+(.+?)(?:\.|!|$)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:la irukken|la work|la study)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:la irukken|la irukku)/gi,
    /(?:naan|naa)\s+(.+?)\s+(?:student|engineer|doctor|teacher)/gi,
  ],
  personality: [
    /(?:naan|naa)\s+(?:.+?)?\s+(shy|introvert|extrovert|ambivert|outgoing|quiet|funny|serious)/gi,
  ],
  topic: [
    /(?:ippo|ini) (.+?)\s+(?:pathi|patti) (?:pesalaam|pesuvom|chat)/gi,
    /(?:.+?)\s+(?:pathi|patti) (?:pesanum|pesalaam|solunga)/gi,
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

function extractMemoriesFromText(
  text: string
): Array<{ category: string; key: string; value: string; importance: number }> {
  const memories: Array<{ category: string; key: string; value: string; importance: number }> = [];
  const seen = new Set<string>();

  // Extract from English patterns
  for (const [category, patterns] of Object.entries(ENGLISH_PATTERNS)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
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
      while ((match = regex.exec(text)) !== null) {
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

  return memories;
}

// GET /api/memory - Get user memory
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memories = await getUserMemory(user.id);
  return Response.json({ memories });
}

// POST /api/memory/extract - Extract and save memories from conversation
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if memory is enabled
  const { data: settings } = await supabase
    .from("user_settings")
    .select("memory_enabled")
    .eq("user_id", user.id)
    .single();

  if (settings && !settings.memory_enabled) {
    return Response.json({ saved: 0, total: 0, reason: "memory_disabled" });
  }

  const { messages } = await req.json();

  // Extract memories from recent messages
  const allText = messages
    .filter((m: { role: string }) => m.role === "user")
    .map((m: { content: string }) => m.content)
    .join("\n");

  const extractedMemories = extractMemoriesFromText(allText);

  // Save each extracted memory
  let saved = 0;
  for (const memory of extractedMemories) {
    try {
      await upsertMemory(
        user.id,
        memory.category as
          | "preference"
          | "hobby"
          | "date"
          | "goal"
          | "fact"
          | "personality"
          | "topic"
          | "milestone",
        memory.key,
        memory.value,
        memory.importance
      );
      saved++;
    } catch (e) {
      console.error("Failed to save memory:", e);
    }
  }

  // Also check if user explicitly shared memory-like info
  for (const pattern of EXPLICIT_PATTERNS) {
    let match;
    while ((match = pattern.exec(allText)) !== null) {
      const value = match[1]?.trim();
      if (value && value.length > 2) {
        try {
          await upsertMemory(
            user.id,
            "fact",
            `explicit_${value.slice(0, 50)}`,
            value,
            9
          );
          saved++;
        } catch (e) {
          console.error("Failed to save explicit memory:", e);
        }
      }
    }
  }

  return Response.json({ saved, total: extractedMemories.length });
}

// DELETE /api/memory - Delete memory (with optional id parameter)
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (id) {
    // Delete specific memory
    await deleteMemory(id);
    return Response.json({ ok: true });
  }

  // Delete all user memory
  const { error } = await supabase
    .from("user_memory")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return Response.json({ error: "Failed to clear memory" }, { status: 500 });
  }

  return Response.json({ ok: true, cleared: true });
}
