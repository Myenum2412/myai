// ═══════════════════════════════════════════════════════════════
// Cognitive Context Manager
// Central orchestration hub — every engine feeds into and reads from here
// ═══════════════════════════════════════════════════════════════

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { emotionEngine } from "./emotion";
import { memoryEngine } from "./memory";
import { relationshipEngine } from "./relationship";
import { personalityEngine } from "./personality";
import { voiceEngine } from "./voice";
import { proactiveEngine } from "./proactive";
import type {
  ConversationContext,
  EmotionState,
  MemoryContext,
  RelationshipState,
  PersonalityConfig,
  TimeContext,
  LanguageContext,
  Emotion,
  MemoryEntry,
} from "@/lib/types";

// ─── Context Update Event ───
export interface ContextUpdateEvent {
  source: "emotion" | "memory" | "relationship" | "personality" | "voice" | "proactive" | "user_input";
  type: string;
  data: unknown;
  timestamp: string;
}

// ─── Cognitive Snapshot ───
export interface CognitiveSnapshot {
  emotion: EmotionState;
  memory: MemoryContext;
  relationship: RelationshipState;
  personality: PersonalityConfig;
  time: TimeContext;
  language: LanguageContext;
  goals: GoalContext;
  multimodal: MultimodalContext;
  conversation_summary: string;
  response_strategy: ResponseStrategy;
  safety_flags: SafetyFlag[];
  timestamp: string;
}

export interface GoalContext {
  active_goals: Goal[];
  completed_goals: Goal[];
  habits: Habit[];
  streaks: Record<string, number>;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  target_date?: string;
  progress: number; // 0-100
  status: "active" | "completed" | "paused" | "abandoned";
  milestones: string[];
  last_checked: string;
}

export interface Habit {
  id: string;
  name: string;
  frequency: string;
  current_streak: number;
  best_streak: number;
  last_completed: string;
}

export interface MultimodalContext {
  has_images: boolean;
  has_documents: boolean;
  has_voice_notes: boolean;
  recent_attachments: Attachment[];
}

export interface Attachment {
  id: string;
  type: "image" | "document" | "voice_note" | "video" | "pdf";
  filename: string;
  summary?: string;
  created_at: string;
}

export interface ResponseStrategy {
  primary_goal: string;
  emotional_approach: string;
  length_hint: "short" | "medium" | "long" | "adaptive";
  tone: string;
  language_mix: number; // 0-1 tamil ratio
  include_emoji: boolean;
  proactive_opportunity?: string;
}

export interface SafetyFlag {
  type: "distress" | "crisis" | "boundary" | "privacy";
  severity: "low" | "medium" | "high";
  message: string;
}

// ─── Main Cognitive Context Manager ───
export class CognitiveContextManager {
  private eventLog: ContextUpdateEvent[] = [];
  private snapshotCache: Map<string, CognitiveSnapshot> = new Map();

  /**
   * Build complete cognitive snapshot for a conversation turn
   * OPTIMIZED: Uses instant rule-based emotion analysis, defers LLM to background
   */
  async buildSnapshot(
    userId: string,
    conversationId: string,
    messages: { role: string; content: string }[],
    isVoice: boolean = false
  ): Promise<CognitiveSnapshot> {
    // Parallel context gathering from all engines
    const lastUserMessage = messages.filter((m) => m.role === "user").slice(-1)[0];
    const userText = lastUserMessage?.content || "";

    const [
      memories,
      relationship,
      personality,
    ] = await Promise.all([
      memoryEngine.getMemoryContext(userId),
      relationshipEngine.getRelationshipState(userId),
      personalityEngine.getPersonality(userId),
    ]);

    // OPTIMIZED: Use instant rule-based emotion analysis (no LLM call)
    // The LLM analysis is now deferred to background for next turn
    const emotion = emotionEngine.analyzeEmotion(userText);

    // Build context dimensions (all synchronous, no DB calls)
    const time = this.buildTimeContext();
    const language = this.buildLanguageContext(messages);
    const goals = await this.getGoalContext(userId);
    const multimodal = this.getMultimodalContext(messages);
    const conversation_summary = this.summarizeConversation(messages);
    const safety_flags = this.detectSafetyFlags(userText, emotion, relationship);

    // Determine response strategy
    const response_strategy = this.determineStrategy(
      emotion,
      relationship,
      personality,
      time,
      language,
      goals,
      safety_flags
    );

    const snapshot: CognitiveSnapshot = {
      emotion,
      memory: memories,
      relationship,
      personality,
      time,
      language,
      goals,
      multimodal,
      conversation_summary,
      response_strategy,
      safety_flags,
      timestamp: new Date().toISOString(),
    };

    // Cache snapshot
    this.snapshotCache.set(`${userId}:${conversationId}`, snapshot);

    // Log context update
    this.logEvent({
      source: "user_input",
      type: "snapshot_built",
      data: { emotion: emotion.primary, relationship: relationship.level },
      timestamp: new Date().toISOString(),
    });

    // OPTIMIZED: Fire-and-forget LLM emotion analysis for future use
    // This improves accuracy for NEXT turn without blocking current response
    this.analyzeEmotionInBackground(userId, userText, messages, memories);

    return snapshot;
  }

  /**
   * Background LLM emotion analysis - runs after response starts streaming
   * Updates the emotion patterns cache for next turn
   */
  private async analyzeEmotionInBackground(
    userId: string,
    text: string,
    messages: { role: string; content: string }[],
    memories: MemoryContext
  ): Promise<void> {
    try {
      // Get recent emotion patterns for context
      const supabase = await createClient();
      const { data } = await supabase
        .from("emotion_history")
        .select("primary_emotion")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      const patterns: { emotion: Emotion; frequency: number }[] = [];
      if (data) {
        const counts: Record<string, number> = {};
        for (const row of data) {
          counts[row.primary_emotion] = (counts[row.primary_emotion] || 0) + 1;
        }
        patterns.push(...Object.entries(counts)
          .map(([emotion, frequency]) => ({ emotion: emotion as Emotion, frequency }))
          .sort((a, b) => b.frequency - a.frequency));
      }

      const llmEmotion = await this.analyzeEmotionDeep(text, messages, memories, patterns);

      // Store the LLM-analyzed emotion for next turn's context
      await supabase.from("emotion_history").insert({
        user_id: userId,
        primary_emotion: llmEmotion.primary,
        intensity: llmEmotion.intensity,
        valence: llmEmotion.valence,
        arousal: llmEmotion.arousal,
      });
    } catch (e) {
      // Silent failure - rule-based emotion is already used
      console.error("Background emotion analysis failed:", e);
    }
  }

  /**
   * LLM-powered deep emotion analysis
   * Goes beyond keyword matching to understand implicit emotions
   */
  private async analyzeEmotionDeep(
    text: string,
    messages: { role: string; content: string }[],
    memories: MemoryContext,
    patterns: { emotion: Emotion; frequency: number }[]
  ): Promise<EmotionState> {
    // Build context for LLM emotion analysis
    const recentConversation = messages.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n");
    const emotionalHistory = patterns.slice(0, 5).map((p) => `${p.emotion} (${p.frequency}x)`).join(", ");
    const recentMemories = memories.emotional.slice(0, 3).map((m) => m.value).join("; ");

    const analysisPrompt = `Analyze the emotional state of this person. Consider:
- Explicit emotions stated
- Implicit emotions from word choice and tone
- Mixed emotions (if multiple feelings present)
- Sarcasm or irony
- Emotional transitions from earlier in conversation
- How their emotional history might influence current state

Recent conversation:
${recentConversation}

Current message: "${text}"

Emotional history: ${emotionalHistory || "No prior patterns"}
Recent emotional memories: ${recentMemories || "None"}

Respond with ONLY a JSON object:
{
  "primary": "<emotion>",
  "secondary": "<emotion or null>",
  "intensity": <0-1>,
  "confidence": <0-1>,
  "valence": <-1 to 1>,
  "arousal": <-1 to 1>,
  "reasoning": "<brief explanation>",
  "implicit": "<any implicit emotion detected>",
  "sarcasm_detected": <boolean>,
  "emotional_trajectory": "<stable|improving|declining|shifting>"
}`;

    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-ultra-550b-a55b",
          messages: [{ role: "user", content: analysisPrompt }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
          return {
            primary: parsed.primary || "neutral",
            secondary: parsed.secondary || undefined,
            intensity: Math.min(1, Math.max(0, parsed.intensity || 0.5)),
            confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
            valence: Math.min(1, Math.max(-1, parsed.valence || 0)),
            arousal: Math.min(1, Math.max(-1, parsed.arousal || 0)),
            detected_at: new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.error("LLM emotion analysis failed, falling back to rule-based:", e);
    }

    // Fallback to rule-based
    return emotionEngine.analyzeEmotion(text);
  }

  /**
   * Determine optimal response strategy
   */
  private determineStrategy(
    emotion: EmotionState,
    relationship: RelationshipState,
    personality: PersonalityConfig,
    time: TimeContext,
    language: LanguageContext,
    goals: GoalContext,
    safety_flags: SafetyFlag[]
  ): ResponseStrategy {
    // Safety overrides
    if (safety_flags.some((f) => f.severity === "high")) {
      return {
        primary_goal: "safety",
        emotional_approach: "calm, supportive, non-judgmental",
        length_hint: "medium",
        tone: "gentle, reassuring",
        language_mix: 0.5,
        include_emoji: false,
      };
    }

    // Emotional response
    const emotionalGoals: Record<Emotion, string> = {
      happy: "celebrate_and_engage",
      sad: "comfort_and_validate",
      excited: "match_energy_and_celebrate",
      stressed: "calm_and_support",
      frustrated: "validate_and_help",
      lonely: "be_present_and_connect",
      confident: "encourage_and_empower",
      sarcastic: "match_wit_and_play",
      humorous: "laugh_and_engage",
      affectionate: "reciprocate_warmth",
      uncertain: "reassure_and_explore",
      calm: "maintain_peace_and_deepen",
      angry: "validate_and_deescalate",
      anxious: "ground_and_reassure",
      nostalgic: "share_reflection",
      grateful: "appreciate_and_reciprocate",
      neutral: "engage_and_discover",
    };

    // Length based on context
    let length_hint: ResponseStrategy["length_hint"] = "medium";
    if (emotion.primary === "stressed" || emotion.primary === "anxious") length_hint = "short";
    if (emotion.primary === "sad" && emotion.intensity > 0.7) length_hint = "long";
    if (time.hour >= 22 || time.hour < 6) length_hint = "short";

    // Language mix
    let language_mix = language.tamil_ratio;
    if (emotion.valence < -0.3) language_mix = Math.min(1, language_mix + 0.2);
    if (emotion.primary === "affectionate") language_mix = Math.min(1, language_mix + 0.3);

    // Emoji based on personality and emotion
    const include_emoji = personality.playfulness > 0.4 &&
      !["sad", "angry", "stressed"].includes(emotion.primary);

    // Proactive opportunities
    let proactive_opportunity: string | undefined;
    if (goals.habits.length > 0) {
      const overdue = goals.habits.find((h) => {
        const last = new Date(h.last_completed);
        const daysSince = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > 2;
      });
      if (overdue) proactive_opportunity = `gentle_check_on_habit:${overdue.name}`;
    }

    return {
      primary_goal: emotionalGoals[emotion.primary] || "engage",
      emotional_approach: `respond_with_${emotion.primary}_awareness`,
      length_hint,
      tone: personality.communication_style,
      language_mix,
      include_emoji,
      proactive_opportunity,
    };
  }

  /**
   * Detect safety concerns
   */
  private detectSafetyFlags(
    text: string,
    emotion: EmotionState,
    relationship: RelationshipState
  ): SafetyFlag[] {
    const flags: SafetyFlag[] = [];
    const lower = text.toLowerCase();

    // Distress detection
    const distressWords = ["suicide", "kill myself", "end it", "no reason to live", "want to die", "hurt myself"];
    if (distressWords.some((w) => lower.includes(w))) {
      flags.push({
        type: "crisis",
        severity: "high",
        message: "User expressed potential self-harm. Provide crisis resources.",
      });
    }

    // Severe emotional distress
    if (emotion.primary === "sad" && emotion.intensity > 0.9) {
      flags.push({
        type: "distress",
        severity: "medium",
        message: "User showing severe emotional distress. Be extra supportive.",
      });
    }

    // Boundary detection
    const boundaryWords = ["explicit", "inappropriate", "nsfw"];
    if (boundaryWords.some((w) => lower.includes(w))) {
      flags.push({
        type: "boundary",
        severity: "medium",
        message: "User approaching conversation boundary.",
      });
    }

    return flags;
  }

  /**
   * Summarize current conversation
   */
  private summarizeConversation(messages: { role: string; content: string }[]): string {
    if (messages.length === 0) return "No conversation yet";

    const userMessages = messages.filter((m) => m.role === "user");
    const topics = new Set<string>();

    for (const msg of userMessages) {
      const words = msg.content.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 4) topics.add(word);
      }
    }

    return `Conversation with ${userMessages.length} messages. Topics: ${Array.from(topics).slice(0, 5).join(", ") || "general"}`;
  }

  // ─── Helper Methods ───

  private async getEmotionPatterns(userId: string): Promise<{ emotion: Emotion; frequency: number }[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("emotion_history")
      .select("primary_emotion")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data) return [];

    const counts: Record<string, number> = {};
    for (const row of data) {
      counts[row.primary_emotion] = (counts[row.primary_emotion] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([emotion, frequency]) => ({ emotion: emotion as Emotion, frequency }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  private async getGoalContext(userId: string): Promise<GoalContext> {
    const supabase = await createClient();
    const { data: goals } = await supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const active = (goals || []).filter((g) => g.status === "active");
    const completed = (goals || []).filter((g) => g.status === "completed");

    return {
      active_goals: active,
      completed_goals: completed,
      habits: [],
      streaks: {},
    };
  }

  private getMultimodalContext(messages: { role: string; content: string }[]): MultimodalContext {
    const hasImages = messages.some((m) => m.content.includes("[image]") || m.content.includes("data:image"));
    const hasDocs = messages.some((m) => m.content.includes("[document]") || m.content.includes("[pdf]"));
    const hasVoice = messages.some((m) => m.content.includes("[voice]"));

    return {
      has_images: hasImages,
      has_documents: hasDocs,
      has_voice_notes: hasVoice,
      recent_attachments: [],
    };
  }

  private buildTimeContext(): TimeContext {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    let timeOfDay: TimeContext["time_of_day"];
    if (hour >= 5 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 21) timeOfDay = "evening";
    else timeOfDay = "night";

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const tamilDays = ["Nyayiru", "Thingal", "Sevvai", "Budhan", "Vyalan", "Velli", "Sani"];

    const month = now.getMonth() + 1;
    const day = now.getDate();
    const specialOccasions: TimeContext["special_occasions"] = [];

    if (month === 1 && day >= 14 && day <= 17) {
      specialOccasions.push({ name: "Pongal", tamil_name: "பொங்கல்", type: "festival", date: `${month}-${day}`, relevance: 0.9 });
    }
    if (month === 10 && day >= 20 && day <= 30) {
      specialOccasions.push({ name: "Diwali", tamil_name: "தீபாவளி", type: "festival", date: `${month}-${day}`, relevance: 0.85 });
    }
    if (month === 4 && day === 14) {
      specialOccasions.push({ name: "Tamil New Year", tamil_name: "தமிழ் புத்தாண்டு", type: "festival", date: `${month}-${day}`, relevance: 0.95 });
    }

    let season: TimeContext["season"] = "summer";
    if (month >= 6 && month <= 9) season = "monsoon";
    else if (month >= 10 && month <= 11) season = "winter";
    else if (month >= 2 && month <= 4) season = "spring";

    return {
      hour,
      minute,
      day_of_week: days[now.getDay()],
      tamil_day: tamilDays[now.getDay()],
      time_of_day: timeOfDay,
      is_weekend: now.getDay() === 0 || now.getDay() === 6,
      special_occasions: specialOccasions,
      season,
    };
  }

  private buildLanguageContext(messages: { role: string; content: string }[]): LanguageContext {
    const userMessages = messages.filter((m) => m.role === "user").slice(-5);
    const tamilPatterns = ["enna", "epdi", "irukku", "panringa", "thangam", "romba", "illai", "aama", "kadichirukku", "santhosham", "semm"];
    let tamilCount = 0;
    let englishCount = 0;

    for (const msg of userMessages) {
      const content = msg.content.toLowerCase();
      const hasTamil = tamilPatterns.some((p) => content.includes(p));
      if (hasTamil) tamilCount++;
      else englishCount++;
    }

    const total = tamilCount + englishCount || 1;
    const tamilRatio = tamilCount / total;

    let detectedLanguage: LanguageContext["detected_language"];
    if (tamilRatio > 0.6) detectedLanguage = "tamil";
    else if (tamilRatio > 0.3) detectedLanguage = "tanglish";
    else if (tamilCount > 0 && englishCount > 0) detectedLanguage = "mixed";
    else detectedLanguage = "english";

    return {
      primary_language: tamilRatio > 0.5 ? "tamil" : "english",
      detected_language: detectedLanguage,
      tamil_ratio: tamilRatio,
      confidence: Math.min(1, total / 3),
    };
  }

  private logEvent(event: ContextUpdateEvent): void {
    this.eventLog.push(event);
    if (this.eventLog.length > 1000) {
      this.eventLog = this.eventLog.slice(-500);
    }
  }

  /**
   * Build unified system prompt from snapshot
   */
  buildUnifiedPrompt(snapshot: CognitiveSnapshot): string {
    const { personality, relationship, emotion, time, language, goals, response_strategy, safety_flags } = snapshot;

    let prompt = `\n# ${personality.companion_name} — Unified Cognitive Context\n`;

    // Identity
    prompt += `\nYou are ${personality.companion_name}, a caring AI companion. Your persona: ${personality.companion_persona}. Style: ${personality.communication_style}.\n`;

    // Emotional context
    prompt += `\n## User's Emotional State\n`;
    prompt += `Primary: ${emotion.primary} (intensity: ${Math.round(emotion.intensity * 100)}%)\n`;
    if (emotion.secondary) prompt += `Secondary: ${emotion.secondary}\n`;
    prompt += `Valence: ${emotion.valence > 0 ? "positive" : emotion.valence < 0 ? "negative" : "neutral"} | Energy: ${emotion.arousal > 0.3 ? "high" : emotion.arousal < -0.3 ? "low" : "moderate"}\n`;

    // Response strategy
    prompt += `\n## Response Strategy\n`;
    prompt += `Goal: ${response_strategy.primary_goal}\n`;
    prompt += `Tone: ${response_strategy.tone}\n`;
    prompt += `Length: ${response_strategy.length_hint}\n`;
    prompt += `Language mix: ${Math.round(response_strategy.language_mix * 100)}% Tamil\n`;
    prompt += `Emoji: ${response_strategy.include_emoji ? "yes" : "no"}\n`;

    // Relationship
    prompt += `\n## Relationship\n`;
    prompt += `Level: ${relationship.level} | Trust: ${Math.round(relationship.trust_score)}/100 | Intimacy: ${Math.round(relationship.intimacy_score)}/100\n`;
    prompt += `Known for ${relationship.days_known} days | ${relationship.total_conversations} conversations\n`;

    // Time
    prompt += `\n## Context\n`;
    prompt += `Time: ${time.time_of_day} (${time.hour}:${time.minute.toString().padStart(2, "0")}) | ${time.day_of_week}\n`;
    if (time.special_occasions.length > 0) {
      prompt += `Special: ${time.special_occasions.map((o) => o.name).join(", ")}\n`;
    }

    // Goals
    if (goals.active_goals.length > 0) {
      prompt += `\n## Active Goals\n`;
      for (const goal of goals.active_goals.slice(0, 3)) {
        prompt += `- ${goal.title} (${goal.progress}% complete)\n`;
      }
    }

    // Safety
    if (safety_flags.length > 0) {
      prompt += `\n## Safety Flags\n`;
      for (const flag of safety_flags) {
        prompt += `- [${flag.severity.toUpperCase()}] ${flag.message}\n`;
      }
    }

    // Language
    prompt += `\n## Language\n`;
    prompt += `Detected: ${language.detected_language} | Tamil ratio: ${Math.round(language.tamil_ratio * 100)}%\n`;
    prompt += `Mix Tamil and English naturally. Emotional depth in Tamil, technical in English.\n`;

    return prompt;
  }
}

export const cognitiveContextManager = new CognitiveContextManager();
