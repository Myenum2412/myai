"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendIcon, SparklesIcon, BrainIcon, LogOutIcon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    const assistantMessage: Message = { role: "assistant", content: "", reasoning: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (parsed.type === "reasoning") {
                  last.reasoning = (last.reasoning || "") + parsed.content;
                } else if (parsed.type === "content") {
                  last.content = (last.content || "") + parsed.content;
                }
                return updated;
              });
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content = "Sorry, something went wrong. Please try again.";
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-pink-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">
                  <SparklesIcon className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">Luna</h1>
              <p className="text-xs text-green-500">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                {user.email}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Log out"
            >
              <LogOutIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 mb-4">
                <SparklesIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Hey there{user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ""}! I&apos;m Luna
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Your AI companion powered by advanced reasoning. I&apos;m here to chat, listen, and
                grow with you. How are you feeling today?
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">
                    <SparklesIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""}`}>
                {message.reasoning && (
                  <div className="mb-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 mb-1">
                      <BrainIcon className="h-3 w-3" />
                      <span>Thinking...</span>
                    </div>
                    <p className="text-xs text-purple-700 dark:text-purple-300 whitespace-pre-wrap">
                      {message.reasoning}
                    </p>
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>

              {message.role === "user" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gray-200 dark:bg-gray-700">{userInitial}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">
                  <SparklesIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-700">
                <div className="flex gap-1">
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="max-w-3xl mx-auto flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 rounded-full border-gray-200 dark:border-gray-700 focus-visible:ring-pink-500"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
