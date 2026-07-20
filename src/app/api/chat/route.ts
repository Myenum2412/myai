import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { getMessages, addMessage, getUserMemory, getUserSettings, getConversationStyle } from "@/lib/db";

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

  const { messages, conversationId } = await req.json();

  // Load user settings, memory, and conversation style
  const [settings, memories, convStyle] = await Promise.all([
    getUserSettings(user.id),
    getUserMemory(user.id),
    conversationId ? getConversationStyle(conversationId) : Promise.resolve(null),
  ]);

  const style = convStyle || "caring";
  const companionName = settings?.companion_name || "Luna";

  // Build the system prompt with personality, memory, and context
  const systemPrompt = buildSystemPrompt(
    style as "caring",
    memories,
    user.user_metadata?.display_name,
    companionName
  );

  // Build conversation history for the API
  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  try {
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
                  // Save the completed assistant message to database
                  if (conversationId && fullContent) {
                    try {
                      await addMessage(conversationId, "assistant", fullContent);
                    } catch (e) {
                      console.error("Failed to save assistant message:", e);
                    }
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
                        encoder.encode(
                          `data: ${JSON.stringify({ type: "reasoning", content: reasoning })}\n\n`
                        )
                      );
                    }
                    if (content) {
                      fullContent += content;
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({ type: "content", content })}\n\n`
                        )
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
