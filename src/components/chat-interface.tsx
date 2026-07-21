"use client";

import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
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
  SmileIcon,
  PlusIcon,
  TrashIcon,
  PinIcon,
  PinOffIcon,
  StarIcon,
  SettingsIcon,
  XIcon,
  MenuIcon,
  ChevronDownIcon,
  EditIcon,
  CheckIcon,
  PhoneIcon,
  PhoneOffIcon,
  ShieldIcon,
  EyeIcon,
  EyeOffIcon,
  MessageSquareIcon,
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
  isRead?: boolean;
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
  voice_profile?: string;
}

const STYLES = [
  { id: "caring", label: "Caring", emoji: "🤗", color: "bg-pink-100 text-pink-700" },
  { id: "romantic", label: "Romantic", emoji: "💕", color: "bg-rose-100 text-rose-700" },
  { id: "friendly", label: "Friendly", emoji: "😊", color: "bg-yellow-100 text-yellow-700" },
  { id: "motivational", label: "Motivational", emoji: "🔥", color: "bg-orange-100 text-orange-700" },
  { id: "cheerful", label: "Cheerful", emoji: "😄", color: "bg-green-100 text-green-700" },
  { id: "calm", label: "Calm", emoji: "🧘", color: "bg-blue-100 text-blue-700" },
  { id: "humorous", label: "Humorous", emoji: "😄", color: "bg-purple-100 text-purple-700" },
];

const REACTIONS = [
  { id: "love", emoji: "❤️" },
  { id: "laugh", emoji: "😂" },
  { id: "fire", emoji: "🔥" },
  { id: "sad", emoji: "😢" },
  { id: "wow", emoji: "😮" },
];

const VOICE_PROFILES = [
  { id: "default", label: "Default", speed: 1, pitch: 1 },
  { id: "sweet", label: "Sweet & Gentle", speed: 0.9, pitch: 1.2 },
  { id: "energetic", label: "Energetic", speed: 1.1, pitch: 1.1 },
  { id: "calm", label: "Calm & Soothing", speed: 0.85, pitch: 0.95 },
  { id: "playful", label: "Playful", speed: 1.05, pitch: 1.15 },
];

// ─── Enhanced TTS Hook ───
function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentVoiceProfile, setCurrentVoiceProfile] = useState("default");
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const interruptRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback(
    (text: string, speed = 1, pitch = 1, volume = 1) => {
      if (!synthRef.current || !voiceEnabled) return;
      synthRef.current.cancel();
      interruptRef.current = false;

      const utterance = new SpeechSynthesisUtterance(text);

      // Apply voice profile
      const profile = VOICE_PROFILES.find(p => p.id === currentVoiceProfile);
      utterance.rate = speed * (profile?.speed || 1);
      utterance.pitch = pitch * (profile?.pitch || 1);
      utterance.volume = volume;

      // Try to find a female voice (Tamil first, then English)
      const voices = synthRef.current.getVoices();
      const tamilVoice = voices.find(v => v.lang.startsWith("ta"));
      const englishFemaleVoice = voices.find(
        v => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")
      );
      const englishVoice = voices.find(v => v.lang.startsWith("en"));

      utterance.voice = tamilVoice || englishFemaleVoice || englishVoice || null;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        interruptRef.current = false;
      };
      utterance.onerror = () => {
        setSpeaking(false);
        interruptRef.current = false;
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    },
    [voiceEnabled, currentVoiceProfile]
  );

  const interrupt = useCallback(() => {
    if (synthRef.current && speaking) {
      interruptRef.current = true;
      synthRef.current.cancel();
      setSpeaking(false);
    }
  }, [speaking]);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    setSpeaking(false);
    interruptRef.current = false;
  }, []);

  const toggleVoice = useCallback(() => {
    if (speaking) stop();
    setVoiceEnabled(prev => !prev);
  }, [speaking, stop]);

  return {
    speaking,
    voiceEnabled,
    currentVoiceProfile,
    setCurrentVoiceProfile,
    speak,
    stop,
    interrupt,
    toggleVoice,
  };
}

// ─── Speech Recognition Hook ───
function useSpeechRecognition(onResult: (text: string) => void, onInterim?: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "ta-IN";

        recognition.onresult = (event) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (interimTranscript && onInterim) {
            onInterim(interimTranscript);
          }

          if (finalTranscript) {
            onResult(finalTranscript);
          }
        };

        recognition.onerror = () => setListening(false);
        recognition.onend = () => setListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, [onResult, onInterim]);

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

// ─── Typing Indicator Component (Memoized) ───
const TypingIndicator = memo(function TypingIndicator({ companionName }: { companionName: string }) {
  return (
    <div className="flex gap-3 justify-start">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-[#03045E] text-white">
          <SparklesIcon className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-white dark:bg-gray-800 px-4 py-3 border border-border rounded-2xl rounded-bl-sm">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="h-2 w-2 bg-[#0077B6] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 bg-[#0077B6] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 bg-[#0077B6] rounded-full animate-bounce" />
          </div>
          <span className="text-xs text-muted-foreground ml-1">{companionName} is typing...</span>
        </div>
      </div>
    </div>
  );
});

// ─── Read Receipt Component (Memoized) ───
const ReadReceipt = memo(function ReadReceipt({ isRead }: { isRead?: boolean }) {
  return (
    <span className="text-[10px] text-muted-foreground/60 ml-1">
      {isRead ? "✓✓" : "✓"}
    </span>
  );
});

// ─── Message Bubble Component (Memoized) ───
interface MessageBubbleProps {
  message: Message;
  index: number;
  isEditing: boolean;
  editContent: string;
  onEditContentChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onAddReaction: (reaction: string) => void;
  onToggleFavorite: () => void;
  onSpeak: () => void;
  userInitial: string;
}

const MessageBubble = memo(function MessageBubble({
  message,
  index,
  isEditing,
  editContent,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onAddReaction,
  onToggleFavorite,
  onSpeak,
  userInitial,
}: MessageBubbleProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSaveEdit();
    if (e.key === "Escape") onCancelEdit();
  }, [onSaveEdit, onCancelEdit]);

  return (
    <div
      className={`flex gap-3 group ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {message.role === "assistant" && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-[#0077B6] to-[#03045E] text-white">
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
          <div className="mb-2 p-3 bg-[#CAF0F8]/30 dark:bg-[#03045E]/20 border border-[#90E0EF]/30 rounded-lg">
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
          className={`px-4 py-2.5 ${
            message.role === "user"
              ? "bg-[#0077B6] text-white rounded-2xl rounded-br-sm"
              : "bg-white dark:bg-gray-800 text-foreground border border-border/50 rounded-2xl rounded-bl-sm shadow-sm"
          }`}
        >
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editContent}
                onChange={e => onEditContentChange(e.target.value)}
                className="flex-1 h-8 text-sm"
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <Button
                size="icon"
                className="h-7 w-7"
                onClick={onSaveEdit}
              >
                <CheckIcon className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={onCancelEdit}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm md:text-base">{message.content}</p>
          )}
        </div>

        {/* Message Actions */}
        {message.role === "assistant" && message.content && !isEditing && (
          <div className="flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Reactions */}
            {REACTIONS.map(r => (
              <Button
                key={r.id}
                variant="ghost"
                size="icon"
                className={`h-6 w-6 transition-transform hover:scale-125 ${message.reaction === r.id ? "bg-[#0077B6]/10 scale-110" : ""}`}
                onClick={() => onAddReaction(r.id)}
              >
                <span className="text-xs">{r.emoji}</span>
              </Button>
            ))}

            <div className="w-px h-4 bg-border mx-1" />

            {/* Favorite */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 transition-colors ${message.favorite ? "text-yellow-500" : ""}`}
              onClick={onToggleFavorite}
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
              onClick={onSpeak}
            >
              <Volume2Icon className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* User message actions */}
        {message.role === "user" && message.content && !isEditing && (
          <div className="flex items-center gap-1 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onStartEdit}
            >
              <EditIcon className="h-3 w-3" />
            </Button>
            <ReadReceipt isRead={message.isRead} />
          </div>
        )}

        {/* Reaction Display */}
        {message.reaction && (
          <div className="mt-1">
            <span className="text-sm bg-white dark:bg-gray-800 border border-border/50 px-1.5 py-0.5 rounded-full shadow-sm">
              {REACTIONS.find(r => r.id === message.reaction)?.emoji}
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
  );
});

// ─── Conversation Item Component (Memoized) ───
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

const ConversationItem = memo(function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onTogglePin,
  onDelete,
}: ConversationItemProps) {
  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all duration-200 rounded-lg ${
        isActive
          ? "bg-[#0077B6]/10 text-[#0077B6] shadow-sm"
          : "hover:bg-muted/80 text-muted-foreground"
      }`}
      onClick={onSelect}
    >
      {conversation.pinned && (
        <PinIcon className="h-3 w-3 shrink-0 text-[#0077B6]" />
      )}
      <MessageSquareIcon className="h-3.5 w-3.5 shrink-0 opacity-50" />
      <span className="flex-1 truncate text-sm">{conversation.title}</span>
      <div className="hidden group-hover:flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={e => {
            e.stopPropagation();
            onTogglePin();
          }}
        >
          {conversation.pinned ? (
            <PinOffIcon className="h-3 w-3" />
          ) : (
            <PinIcon className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive"
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <TrashIcon className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
});

// ─── Main Chat Interface ───
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
    voice_profile: "default",
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("caring");
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [voiceChatMode, setVoiceChatMode] = useState(false);
  const [showReactions, setShowReactions] = useState<number | null>(null);
  const [interimText, setInterimText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrollingRef = useRef(false);
  const router = useRouter();
  const { user, signOut } = useAuth();
  const tts = useTTS();

  // Memoized user initial
  const userInitial = useMemo(() => user?.email?.charAt(0).toUpperCase() || "U", [user?.email]);
  const currentStyle = useMemo(() => STYLES.find(s => s.id === selectedStyle), [selectedStyle]);

  const handleVoiceResult = useCallback((text: string) => {
    setInput(prev => prev + " " + text);
    setInterimText("");
  }, []);

  const handleInterim = useCallback((text: string) => {
    setInterimText(text);
  }, []);

  const speech = useSpeechRecognition(handleVoiceResult, handleInterim);

  // Optimized auto-scroll with requestAnimationFrame
  const scrollToBottom = useCallback(() => {
    if (isAutoScrollingRef.current) return;
    
    isAutoScrollingRef.current = true;
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') || scrollRef.current;
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
      isAutoScrollingRef.current = false;
    });
  }, []);

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

  // Auto-scroll on messages change (debounced during streaming)
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Load speech voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const createNewConversation = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: selectedStyle }),
      });
      const data = await res.json();
      if (data.conversation) {
        setConversations(prev => [data.conversation, ...prev]);
        setActiveConversation(data.conversation.id);
        setMessages([]);
      }
    } catch (e) {
      console.error("Failed to create conversation:", e);
    }
  }, [selectedStyle]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await fetch(`/api/conversations?id=${id}`, { method: "DELETE" });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversation === id) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (e) {
      console.error("Failed to delete conversation:", e);
    }
  }, [activeConversation]);

  const togglePin = useCallback(async (id: string, pinned: boolean) => {
    try {
      await fetch("/api/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pinned: !pinned }),
      });
      setConversations(prev =>
        prev.map(c => (c.id === id ? { ...c, pinned: !pinned } : c))
      );
    } catch (e) {
      console.error("Failed to toggle pin:", e);
    }
  }, []);

  const updateStyle = useCallback(async (style: string) => {
    setSelectedStyle(style);
    if (activeConversation) {
      try {
        await fetch("/api/conversations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: activeConversation, style }),
        });
        setConversations(prev =>
          prev.map(c =>
            c.id === activeConversation ? { ...c, style } : c
          )
        );
      } catch (e) {
        console.error("Failed to update style:", e);
      }
    }
  }, [activeConversation]);

  const addReaction = useCallback(async (messageIndex: number, reaction: string) => {
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
      setMessages(prev =>
        prev.map((m, i) =>
          i === messageIndex ? { ...m, reaction } : m
        )
      );
      setShowReactions(null);
    } catch (e) {
      console.error("Failed to add reaction:", e);
    }
  }, [messages, activeConversation]);

  const toggleFavorite = useCallback(async (messageIndex: number) => {
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
      setMessages(prev =>
        prev.map((m, i) =>
          i === messageIndex ? { ...m, favorite: !m.favorite } : m
        )
      );
    } catch (e) {
      console.error("Failed to toggle favorite:", e);
    }
  }, [messages, activeConversation]);

  const startEditingMessage = useCallback((index: number) => {
    setEditingMessageIndex(index);
    setEditContent(messages[index].content);
  }, [messages]);

  const cancelEditing = useCallback(() => {
    setEditingMessageIndex(null);
    setEditContent("");
  }, []);

  const saveEditedMessage = useCallback(async (index: number) => {
    const msg = messages[index];
    if (!msg.id || !editContent.trim()) return;

    try {
      await fetch("/api/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeConversation,
          messageId: msg.id,
          content: editContent.trim(),
        }),
      });
      setMessages(prev =>
        prev.map((m, i) =>
          i === index ? { ...m, content: editContent.trim() } : m
        )
      );
      setEditingMessageIndex(null);
      setEditContent("");
    } catch (e) {
      console.error("Failed to edit message:", e);
    }
  }, [messages, editContent, activeConversation]);

  const toggleVoiceChatMode = useCallback(() => {
    if (voiceChatMode) {
      speech.stopListening();
      tts.stop();
      setVoiceChatMode(false);
    } else {
      setVoiceChatMode(true);
    }
  }, [voiceChatMode, speech, tts]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    // Interrupt TTS if speaking
    if (tts.speaking) {
      tts.interrupt();
    }

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Create conversation if needed
    if (!activeConversation) {
      await createNewConversation();
    }

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage, timestamp: new Date(), isRead: false },
      { role: "assistant", content: "", reasoning: "" },
    ];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages
            .filter(m => m.content || m.reasoning)
            .map(m => ({
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
              // Mark user message as read
              setMessages(prev => {
                const updated = [...prev];
                const lastUserIdx = updated.length - 2;
                if (lastUserIdx >= 0 && updated[lastUserIdx].role === "user") {
                  updated[lastUserIdx] = { ...updated[lastUserIdx], isRead: true };
                }
                // Speak the last assistant message with TTS
                const lastAssistant = [...updated]
                  .reverse()
                  .find(m => m.role === "assistant" && m.content);
                if (lastAssistant && settings.voice_enabled) {
                  tts.speak(
                    lastAssistant.content,
                    settings.voice_speed,
                    settings.voice_pitch,
                    settings.voice_volume
                  );
                }
                return updated;
              });
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              setMessages(prev => {
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
      setMessages(prev => {
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
  }, [input, isLoading, tts, activeConversation, messages]);

  // Auto-send in voice chat mode when user stops speaking
  useEffect(() => {
    if (voiceChatMode && !speech.listening && input.trim()) {
      const timer = setTimeout(() => {
        sendMessage();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [speech.listening, voiceChatMode, input, sendMessage]);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-[#CAF0F8]/20 via-white to-[#90E0EF]/10 dark:from-[#03045E]/10 dark:via-gray-900 dark:to-[#0077B6]/5">
      {/* ─── Sidebar ─── */}
      <div
        className={`${showSidebar ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-border/50 transition-transform duration-300 md:relative md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-br from-[#0077B6] to-[#03045E] flex items-center justify-center">
                  <SparklesIcon className="h-4 w-4 text-white" />
                </div>
                <h2 className="font-semibold text-sm">{settings.companion_name}</h2>
              </div>
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
              className="w-full bg-gradient-to-r from-[#0077B6] to-[#005a8c] hover:from-[#005a8c] hover:to-[#03045E] text-white shadow-sm"
              size="sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={activeConversation === conv.id}
                  onSelect={() => {
                    setActiveConversation(conv.id);
                    setShowSidebar(false);
                  }}
                  onTogglePin={() => togglePin(conv.id, conv.pinned)}
                  onDelete={() => deleteConversation(conv.id)}
                />
              ))}
              {conversations.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquareIcon className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No conversations yet
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Start chatting with {settings.companion_name}!
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border/50 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              size="sm"
              onClick={() => setShowPrivacy(true)}
            >
              <ShieldIcon className="h-4 w-4 mr-2" />
              Privacy
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              size="sm"
              onClick={handleLogout}
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              Log out
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Main Chat Area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-3 md:p-4">
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
                  <AvatarFallback className="bg-gradient-to-br from-[#0077B6] to-[#03045E] text-white">
                    <SparklesIcon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground text-sm md:text-base">
                  {settings.companion_name}
                </h1>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                  Online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              {/* Voice Chat Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${voiceChatMode ? "text-[#0077B6] bg-[#0077B6]/10" : ""}`}
                onClick={toggleVoiceChatMode}
                title={voiceChatMode ? "Exit voice chat" : "Voice chat mode"}
              >
                {voiceChatMode ? (
                  <PhoneOffIcon className="h-4 w-4" />
                ) : (
                  <PhoneIcon className="h-4 w-4" />
                )}
              </Button>

              {/* Voice Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${!tts.voiceEnabled ? "text-muted-foreground" : ""}`}
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
                <Button variant="ghost" size="sm" className="text-xs gap-1.5">
                  <span>{currentStyle?.emoji}</span>
                  <span className="hidden sm:inline">{currentStyle?.label}</span>
                  <ChevronDownIcon className="h-3 w-3" />
                </Button>
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-border/50 shadow-xl rounded-xl py-1.5 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[160px]">
                  {STYLES.map(style => (
                    <button
                      key={style.id}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/80 flex items-center gap-2 transition-colors ${
                        selectedStyle === style.id ? "text-[#0077B6] font-medium bg-[#0077B6]/5" : ""
                      }`}
                      onClick={() => updateStyle(style.id)}
                    >
                      <span className="text-base">{style.emoji}</span>
                      <span>{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-3 md:p-4" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-16 md:py-20">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-gradient-to-br from-[#0077B6] to-[#03045E] mb-4 rounded-2xl shadow-lg">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Hey there
                  {user?.user_metadata?.display_name
                    ? `, ${user.user_metadata.display_name}`
                    : ""}{" "}
                  ! I&apos;m {settings.companion_name}
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base">
                  Your AI companion with advanced emotional intelligence. I&apos;m here
                  to chat, listen, and grow with you. How are you feeling today?
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {[
                    "How are you?",
                    "Tell me about yourself",
                    "Let's talk",
                    "I'm feeling down",
                    "What's up?",
                  ].map(suggestion => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs md:text-sm"
                      onClick={() => setInput(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <MessageBubble
                key={message.id || `msg-${index}`}
                message={message}
                index={index}
                isEditing={editingMessageIndex === index}
                editContent={editContent}
                onEditContentChange={setEditContent}
                onSaveEdit={() => saveEditedMessage(index)}
                onCancelEdit={cancelEditing}
                onStartEdit={() => startEditingMessage(index)}
                onAddReaction={(reaction) => addReaction(index, reaction)}
                onToggleFavorite={() => toggleFavorite(index)}
                onSpeak={() =>
                  tts.speak(
                    message.content,
                    settings.voice_speed,
                    settings.voice_pitch,
                    settings.voice_volume
                  )
                }
                userInitial={userInitial}
              />
            ))}

            {/* Typing Indicator */}
            {isLoading && messages[messages.length - 1]?.content === "" && (
              <TypingIndicator companionName={settings.companion_name} />
            )}
          </div>
        </ScrollArea>

        {/* Voice Chat Mode Overlay */}
        {voiceChatMode && (
          <div className="border-t bg-gradient-to-r from-[#0077B6]/5 to-[#03045E]/5 p-4">
            <div className="max-w-3xl mx-auto flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                Voice chat active — speak naturally
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleVoiceChatMode}
                className="text-xs"
              >
                <PhoneOffIcon className="h-3 w-3 mr-1" />
                End Voice Chat
              </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-3 md:p-4">
          <form
            onSubmit={e => {
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
              className={`h-10 w-10 shrink-0 transition-colors ${
                speech.listening ? "text-[#0077B6] bg-[#0077B6]/10" : ""
              }`}
              onClick={speech.listening ? speech.stopListening : speech.startListening}
            >
              {speech.listening ? (
                <MicOffIcon className="h-5 w-5 animate-pulse" />
              ) : (
                <MicIcon className="h-5 w-5" />
              )}
            </Button>

            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  speech.listening
                    ? `Listening... ${interimText}`
                    : `Message ${settings.companion_name}...`
                }
                disabled={isLoading}
                className="flex-1 pr-10"
              />
              {interimText && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">
                  <SmileIcon className="h-3 w-3 inline" />
                </div>
              )}
            </div>

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
              className="h-10 w-10 shrink-0 bg-gradient-to-r from-[#0077B6] to-[#005a8c] hover:from-[#005a8c] hover:to-[#03045E] text-white shadow-sm transition-all"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* ─── Settings Modal ─── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-border/50 w-full max-w-md mx-4 p-6 space-y-6 rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
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
                onChange={e =>
                  setSettings(prev => ({
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

              {/* Voice Profile */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Voice Profile</label>
                <div className="grid grid-cols-2 gap-2">
                  {VOICE_PROFILES.map(profile => (
                    <Button
                      key={profile.id}
                      variant={settings.voice_profile === profile.id ? "default" : "outline"}
                      size="sm"
                      className={`text-xs ${settings.voice_profile === profile.id ? "bg-[#0077B6] text-white" : ""}`}
                      onClick={async () => {
                        setSettings(prev => ({
                          ...prev,
                          voice_profile: profile.id,
                        }));
                        await fetch("/api/settings", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ ...settings, voice_profile: profile.id }),
                        });
                      }}
                    >
                      {profile.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Voice Enabled</span>
                  <Button
                    variant={settings.voice_enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setSettings(prev => ({
                        ...prev,
                        voice_enabled: !prev.voice_enabled,
                      }))
                    }
                    className={settings.voice_enabled ? "bg-[#0077B6] text-white" : ""}
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
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        voice_speed: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-[#0077B6]"
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
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        voice_pitch: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-[#0077B6]"
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
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        voice_volume: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-[#0077B6]"
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
                  setSettings(prev => ({
                    ...prev,
                    memory_enabled: !prev.memory_enabled,
                  }))
                }
                className={settings.memory_enabled ? "bg-[#0077B6] text-white" : ""}
              >
                {settings.memory_enabled ? "On" : "Off"}
              </Button>
            </div>

            {/* Save */}
            <Button
              className="w-full bg-gradient-to-r from-[#0077B6] to-[#005a8c] hover:from-[#005a8c] hover:to-[#03045E] text-white"
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

      {/* ─── Privacy Modal ─── */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-border/50 w-full max-w-md mx-4 p-6 space-y-6 rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShieldIcon className="h-5 w-5" />
                Privacy & Safety
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPrivacy(false)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Data Protection</h3>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                    Conversations are encrypted and stored securely
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                    Your data is never used for AI training
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                    You can delete all data at any time
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Memory Controls</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {settings.memory_enabled
                    ? "Memory is ON — I remember things about you across conversations."
                    : "Memory is OFF — I won't remember details between conversations."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={async () => {
                    if (confirm("Are you sure you want to clear all memory? This cannot be undone.")) {
                      await fetch("/api/memory", { method: "DELETE" });
                      setSettings(prev => ({ ...prev, memory_enabled: false }));
                    }
                  }}
                >
                  <TrashIcon className="h-3 w-3 mr-1" />
                  Clear All Memory
                </Button>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Conversation History</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  All conversations are stored in your account. You can delete individual conversations or clear everything.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      if (confirm("Delete ALL conversations? This cannot be undone.")) {
                        conversations.forEach(c => deleteConversation(c.id));
                      }
                    }}
                  >
                    <TrashIcon className="h-3 w-3 mr-1" />
                    Clear All Chats
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Safety Boundaries</h3>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-2">
                    <ShieldIcon className="h-3 w-3 mt-0.5 text-[#0077B6] shrink-0" />
                    I will never pretend to be a real human
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldIcon className="h-3 w-3 mt-0.5 text-[#0077B6] shrink-0" />
                    I maintain healthy emotional boundaries
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldIcon className="h-3 w-3 mt-0.5 text-[#0077B6] shrink-0" />
                    I encourage professional help when needed
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldIcon className="h-3 w-3 mt-0.5 text-[#0077B6] shrink-0" />
                    I refuse harmful or abusive requests
                  </li>
                </ul>
              </div>
            </div>

            <Button
              className="w-full bg-[#0077B6] hover:bg-[#005a8c] text-white"
              onClick={() => setShowPrivacy(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}
