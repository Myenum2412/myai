"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SendIcon,
  SparklesIcon,
  BrainIcon,
  LogOutIcon,
  MicIcon,
  MicOffIcon,
  Volume2Icon,
  VolumeXIcon,
  HeartIcon,
  SmileIcon,
  MessageSquareIcon,
  PlusIcon,
  TrashIcon,
  PinIcon,
  PinOffIcon,
  StarIcon,
  SettingsIcon,
  XIcon,
  MenuIcon,
  ChevronDownIcon,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  reaction?: string | null;
  favorite?: boolean;
  created_at?: string;
  timestamp?: Date;
}

interface Conversation {
  id: string;
  title: string;
  style: string;
  pinned: boolean;
  updated_at: string;
}

interface UserSettings {
  preferred_language: string;
  voice_enabled: boolean;
  voice_speed: number;
  voice_pitch: number;
  voice_volume: number;
  memory_enabled: boolean;
  companion_name: string;
}

const STYLES = [
  { id: "caring", label: "Caring", emoji: "🤗" },
  { id: "romantic", label: "Romantic", emoji: "💕" },
  { id: "friendly", label: "Friendly", emoji: "😊" },
  { id: "motivational", label: "Motivational", emoji: "🔥" },
  { id: "cheerful", label: "Cheerful", emoji: "😄" },
  { id: "calm", label: "Calm", emoji: "🧘" },
  { id: "humorous", label: "Humorous", emoji: "😄" },
];

const REACTIONS = [
  { id: "love", emoji: "❤️" },
  { id: "laugh", emoji: "😂" },
  { id: "fire", emoji: "🔥" },
  { id: "sad", emoji: "😢" },
  { id: "wow", emoji: "😮" },
];

function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback(
    (text: string, speed = 1, pitch = 1, volume = 1) => {
      if (!synthRef.current || !voiceEnabled) return;
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Try to find a female voice
      const voices = synthRef.current.getVoices();
      const femaleVoice =
        voices.find(
          (v) =>
            v.lang.startsWith("ta") ||
            v.lang.startsWith("en") && v.name.toLowerCase().includes("female")
        ) || voices.find((v) => v.lang.startsWith("en"));

      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    },
    [voiceEnabled]
  );

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    setSpeaking(false);
  }, []);

  const toggleVoice = useCallback(() => {
    if (speaking) stop();
    setVoiceEnabled((prev) => !prev);
  }, [speaking, stop]);

  return { speaking, voiceEnabled, speak, stop, toggleVoice };
}

function useSpeechRecognition(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "ta-IN"; // Tamil primary, will also pick up English

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          onResult(transcript);
          setListening(false);
        };

        recognition.onerror = () => setListening(false);
        recognition.onend = () => setListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !listening) {
      recognitionRef.current.start();
      setListening(true);
    }
  }, [listening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }
  }, [listening]);

  return { listening, startListening, stopListening };
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    preferred_language: "auto",
    voice_enabled: true,
    voice_speed: 1,
    voice_pitch: 1,
    voice_volume: 1,
    memory_enabled: true,
    companion_name: "Luna",
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("caring");
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, signOut } = useAuth();
  const tts = useTTS();

  const handleVoiceResult = useCallback((text: string) => {
    setInput(text);
  }, []);

  const speech = useSpeechRecognition(handleVoiceResult);

  // Load conversations and settings
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [convRes, settingsRes] = await Promise.all([
          fetch("/api/conversations"),
          fetch("/api/settings"),
        ]);

        const convData = await convRes.json();
        const settingsData = await settingsRes.json();

        if (convData.conversations) setConversations(convData.conversations);
        if (settingsData.settings) {
          setSettings(settingsData.settings);
          setSelectedStyle(settingsData.settings.style || "caring");
        }
      } catch (e) {
        console.error("Failed to load data:", e);
      }
    };

    loadData();
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/conversations?id=${activeConversation}`);
        const data = await res.json();
        if (data.messages) {
          setMessages(
            data.messages.map((m: Message) => ({
              ...m,
              timestamp: m.created_at ? new Date(m.created_at) : undefined,
            }))
          );
        }
      } catch (e) {
        console.error("Failed to load messages:", e);
      }
    };

    loadMessages();
  }, [activeConversation]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load speech voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const createNewConversation = async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: selectedStyle }),
      });
      const data = await res.json();
      if (data.conversation) {
        setConversations((prev) => [data.conversation, ...prev]);
        setActiveConversation(data.conversation.id);
        setMessages([]);
      }
    } catch (e) {
      console.error("Failed to create conversation:", e);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await fetch(`/api/conversations?id=${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversation === id) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (e) {
      console.error("Failed to delete conversation:", e);
    }
  };

  const togglePin = async (id: string, pinned: boolean) => {
    try {
      await fetch("/api/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pinned: !pinned }),
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, pinned: !pinned } : c))
      );
    } catch (e) {
      console.error("Failed to toggle pin:", e);
    }
  };

  const updateStyle = async (style: string) => {
    setSelectedStyle(style);
    if (activeConversation) {
      try {
        await fetch("/api/conversations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: activeConversation, style }),
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation ? { ...c, style } : c
          )
        );
      } catch (e) {
        console.error("Failed to update style:", e);
      }
    }
  };

  const addReaction = async (messageIndex: number, reaction: string) => {
    const msg = messages[messageIndex];
    if (!msg.id) return;

    try {
      await fetch("/api/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeConversation,
          reaction,
          messageId: msg.id,
        }),
      });
      setMessages((prev) =>
        prev.map((m, i) =>
          i === messageIndex ? { ...m, reaction } : m
        )
      );
    } catch (e) {
      console.error("Failed to add reaction:", e);
    }
  };

  const toggleFavorite = async (messageIndex: number) => {
    const msg = messages[messageIndex];
    if (!msg.id) return;

    try {
      await fetch("/api/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeConversation,
          favorite: !msg.favorite,
          messageId: msg.id,
        }),
      });
      setMessages((prev) =>
        prev.map((m, i) =>
          i === messageIndex ? { ...m, favorite: !m.favorite } : m
        )
      );
    } catch (e) {
      console.error("Failed to toggle favorite:", e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Create conversation if needed
    if (!activeConversation) {
      await createNewConversation();
    }

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage, timestamp: new Date() },
      { role: "assistant", content: "", reasoning: "" },
    ];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages
            .filter((m) => m.content || m.reasoning)
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
          conversationId: activeConversation,
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
            if (data === "[DONE]") {
              // Speak the last message with TTS
              setMessages((prev) => {
                const lastAssistant = [...prev]
                  .reverse()
                  .find((m) => m.role === "assistant" && m.content);
                if (lastAssistant && settings.voice_enabled) {
                  tts.speak(
                    lastAssistant.content,
                    settings.voice_speed,
                    settings.voice_pitch,
                    settings.voice_volume
                  );
                }
                return prev;
              });
              continue;
            }

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
                return [...updated];
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
        const last = updated[updated.length - 1];
        if (last.role === "assistant") {
          last.content = "Sorry thangam, something went wrong. Please try again 💕";
        }
        return [...updated];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex h-full bg-[#CAF0F8]/20 dark:bg-[#03045E]/10">
      {/* Sidebar - Conversations */}
      <div
        className={`${showSidebar ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-900 border-r border-border transition-transform duration-200 md:relative md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Conversations</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:hidden"
                onClick={() => setShowSidebar(false)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={createNewConversation}
              className="w-full bg-[#0077B6] hover:bg-[#005a8c] text-white"
              size="sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                    activeConversation === conv.id
                      ? "bg-[#0077B6]/10 text-[#0077B6]"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                  onClick={() => {
                    setActiveConversation(conv.id);
                    setShowSidebar(false);
                  }}
                >
                  {conv.pinned && (
                    <PinIcon className="h-3 w-3 shrink-0 text-[#0077B6]" />
                  )}
                  <span className="flex-1 truncate text-sm">{conv.title}</span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(conv.id, conv.pinned);
                      }}
                    >
                      {conv.pinned ? (
                        <PinOffIcon className="h-3 w-3" />
                      ) : (
                        <PinIcon className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No conversations yet. Start chatting!
                </p>
              )}
            </div>
          </ScrollArea>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              size="sm"
              onClick={handleLogout}
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              Log out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:hidden"
                onClick={() => setShowSidebar(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#03045E] text-white">
                    <SparklesIcon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-900" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">
                  {settings.companion_name}
                </h1>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Voice Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={tts.toggleVoice}
                title={tts.voiceEnabled ? "Mute voice" : "Enable voice"}
              >
                {tts.voiceEnabled ? (
                  <Volume2Icon className="h-4 w-4" />
                ) : (
                  <VolumeXIcon className="h-4 w-4" />
                )}
              </Button>

              {/* Style Selector */}
              <div className="relative group">
                <Button variant="ghost" size="sm" className="text-xs">
                  {STYLES.find((s) => s.id === selectedStyle)?.emoji}{" "}
                  {STYLES.find((s) => s.id === selectedStyle)?.label}
                  <ChevronDownIcon className="h-3 w-3 ml-1" />
                </Button>
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-border shadow-lg rounded-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[140px]">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      className={`w-full px-3 py-1.5 text-left text-sm hover:bg-muted flex items-center gap-2 ${
                        selectedStyle === style.id ? "text-[#0077B6] font-medium" : ""
                      }`}
                      onClick={() => updateStyle(style.id)}
                    >
                      <span>{style.emoji}</span>
                      <span>{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* User Email */}
              {user && (
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-[#03045E] mb-4">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Hey there
                  {user?.user_metadata?.display_name
                    ? `, ${user.user_metadata.display_name}`
                    : ""}{" "}
                 ! I&apos;m {settings.companion_name}
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your AI companion powered by advanced reasoning. I&apos;m here
                  to chat, listen, and grow with you. How are you feeling today?
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {["How are you?", "Tell me about yourself", "Let's talk"].map(
                    (suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInput(suggestion);
                        }}
                      >
                        {suggestion}
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 group ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-[#03045E] text-white">
                      <SparklesIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[80%] ${
                    message.role === "user" ? "order-first" : ""
                  }`}
                >
                  {/* Reasoning */}
                  {message.reasoning && (
                    <div className="mb-2 p-3 bg-[#CAF0F8]/30 dark:bg-[#03045E]/20 border border-[#90E0EF]/30">
                      <div className="flex items-center gap-2 text-xs text-[#0077B6] mb-1">
                        <BrainIcon className="h-3 w-3" />
                        <span>Thinking...</span>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {message.reasoning}
                      </p>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-2 ${
                      message.role === "user"
                        ? "bg-[#0077B6] text-white"
                        : "bg-white dark:bg-gray-800 text-foreground border border-border"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* Message Actions */}
                  {message.role === "assistant" && message.content && (
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Reactions */}
                      {REACTIONS.map((r) => (
                        <Button
                          key={r.id}
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 ${message.reaction === r.id ? "bg-[#0077B6]/10" : ""}`}
                          onClick={() => addReaction(index, r.id)}
                        >
                          <span className="text-xs">{r.emoji}</span>
                        </Button>
                      ))}

                      {/* Favorite */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 ${message.favorite ? "text-yellow-500" : ""}`}
                        onClick={() => toggleFavorite(index)}
                      >
                        <StarIcon
                          className={`h-3 w-3 ${message.favorite ? "fill-current" : ""}`}
                        />
                      </Button>

                      {/* Speak */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          tts.speak(
                            message.content,
                            settings.voice_speed,
                            settings.voice_pitch,
                            settings.voice_volume
                          )
                        }
                      >
                        <Volume2Icon className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Reaction Display */}
                  {message.reaction && (
                    <div className="mt-1">
                      <span className="text-sm bg-white dark:bg-gray-800 border border-border px-1.5 py-0.5">
                        {REACTIONS.find((r) => r.id === message.reaction)?.emoji}
                      </span>
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading &&
              messages[messages.length - 1]?.content === "" && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-[#03045E] text-white">
                      <SparklesIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 border border-border">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 bg-[#0077B6] animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 bg-[#0077B6] animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 bg-[#0077B6] animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="max-w-3xl mx-auto flex gap-2 items-center"
          >
            {/* Mic Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-10 w-10 shrink-0 ${speech.listening ? "text-[#0077B6]" : ""}`}
              onClick={speech.listening ? speech.stopListening : speech.startListening}
            >
              {speech.listening ? (
                <MicOffIcon className="h-5 w-5 animate-pulse" />
              ) : (
                <MicIcon className="h-5 w-5" />
              )}
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${settings.companion_name}...`}
              disabled={isLoading}
              className="flex-1"
            />

            {/* Stop Speaking */}
            {tts.speaking && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 text-[#0077B6]"
                onClick={tts.stop}
              >
                <VolumeXIcon className="h-5 w-5" />
              </Button>
            )}

            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-10 w-10 shrink-0 bg-[#0077B6] hover:bg-[#005a8c] text-white"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 border border-border w-full max-w-md mx-4 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(false)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Companion Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Companion Name</label>
              <Input
                value={settings.companion_name}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    companion_name: e.target.value,
                  }))
                }
                onBlur={async () => {
                  await fetch("/api/settings", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(settings),
                  });
                }}
              />
            </div>

            {/* Voice Settings */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Voice Settings</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Voice Enabled
                  </span>
                  <Button
                    variant={settings.voice_enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        voice_enabled: !prev.voice_enabled,
                      }))
                    }
                  >
                    {settings.voice_enabled ? "On" : "Off"}
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Speed: {settings.voice_speed.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={settings.voice_speed}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        voice_speed: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Pitch: {settings.voice_pitch.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={settings.voice_pitch}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        voice_pitch: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Volume: {Math.round(settings.voice_volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.voice_volume}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        voice_volume: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Memory Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Memory</span>
                <p className="text-xs text-muted-foreground">
                  Remember details across conversations
                </p>
              </div>
              <Button
                variant={settings.memory_enabled ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    memory_enabled: !prev.memory_enabled,
                  }))
                }
              >
                {settings.memory_enabled ? "On" : "Off"}
              </Button>
            </div>

            {/* Save */}
            <Button
              className="w-full bg-[#0077B6] hover:bg-[#005a8c] text-white"
              onClick={async () => {
                await fetch("/api/settings", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(settings),
                });
                setShowSettings(false);
              }}
            >
              Save Settings
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}
