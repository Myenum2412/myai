// ═══════════════════════════════════════════════════════════════
// Luna AI Companion — Core Type Definitions
// ═══════════════════════════════════════════════════════════════

// ─── Emotion Types ───
export type Emotion =
  | "happy"
  | "sad"
  | "excited"
  | "stressed"
  | "frustrated"
  | "lonely"
  | "confident"
  | "sarcastic"
  | "humorous"
  | "affectionate"
  | "uncertain"
  | "calm"
  | "angry"
  | "anxious"
  | "nostalgic"
  | "grateful"
  | "neutral";

export interface EmotionState {
  primary: Emotion;
  secondary?: Emotion;
  intensity: number; // 0-1
  confidence: number; // 0-1
  arousal: number; // -1 (calm) to 1 (excited)
  valence: number; // -1 (negative) to 1 (positive)
  detected_at: string;
}

export interface EmotionPattern {
  user_id: string;
  emotion: Emotion;
  frequency: number;
  last_seen: string;
  triggers: string[];
  avg_intensity: number;
}

// ─── Memory Types ───
export type MemoryType =
  | "short_term"
  | "long_term"
  | "episodic"
  | "semantic"
  | "emotional";

export type MemoryCategory =
  | "preference"
  | "hobby"
  | "date"
  | "goal"
  | "fact"
  | "personality"
  | "topic"
  | "milestone"
  | "emotion"
  | "conversation_summary"
  | "inside_joke"
  | "shared_experience";

export interface MemoryEntry {
  id: string;
  user_id: string;
  type: MemoryType;
  category: MemoryCategory;
  content: string;
  key: string;
  value: string;
  importance: number; // 1-10
  emotional_weight: number; // 0-1
  access_count: number;
  last_accessed: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

export interface MemoryContext {
  short_term: MemoryEntry[];
  long_term: MemoryEntry[];
  episodic: MemoryEntry[];
  semantic: MemoryEntry[];
  emotional: MemoryEntry[];
  summaries: MemorySummary[];
}

export interface MemorySummary {
  id: string;
  user_id: string;
  period: string; // "daily", "weekly", "monthly"
  summary: string;
  key_moments: string[];
  emotional_highlights: string[];
  created_at: string;
}

// ─── Relationship Types ───
export type RelationshipLevel =
  | "stranger"
  | "acquaintance"
  | "friend"
  | "close_friend"
  | "best_friend"
  | "soulmate";

export interface RelationshipState {
  user_id: string;
  level: RelationshipLevel;
  trust_score: number; // 0-100
  intimacy_score: number; // 0-100
  familiarity_score: number; // 0-100
  total_conversations: number;
  total_messages: number;
  days_known: number;
  first_conversation: string;
  last_conversation: string;
  shared_memories: number;
  inside_jokes: number;
  milestones_reached: string[];
  favorite_topics: string[];
  greeting_style: string;
  personality_adaptation: PersonalityAdaptation;
  created_at: string;
  updated_at: string;
}

export interface PersonalityAdaptation {
  formality_level: number; // 0-1
  humor_frequency: number; // 0-1
  emoji_usage: number; // 0-1
  tamil_ratio: number; // 0-1 (0=all english, 1=all tamil)
  sentence_length: "short" | "medium" | "long" | "mixed";
  emotional_depth: number; // 0-1
  proactive_engagement: number; // 0-1
}

// ─── Personality Types ───
export interface PersonalityConfig {
  user_id: string;
  companion_name: string;
  companion_persona: CompanionPersona;
  affection_level: number; // 0-1
  humor_level: number; // 0-1
  playfulness: number; // 0-1
  empathy: number; // 0-1
  intelligence: number; // 0-1
  confidence: number; // 0-1
  formality: number; // 0-1
  conversation_depth: "casual" | "moderate" | "deep" | "adaptive";
  communication_style: "romantic" | "friendly" | "motivational" | "cheerful" | "calm" | "caring" | "humorous";
  created_at: string;
  updated_at: string;
}

export type CompanionPersona =
  | "girlfriend"
  | "best_friend"
  | "mentor"
  | "therapist"
  | "companion"
  | "custom";

// ─── Voice Types ───
export interface VoiceConfig {
  provider: "elevenlabs" | "openai" | "azure" | "browser";
  voice_id: string;
  voice_name: string;
  language: "ta" | "en" | "auto";
  speed: number;
  pitch: number;
  volume: number;
  emotion_mapping: Record<Emotion, string>; // maps emotion to voice preset
  stability: number; // 0-1
  similarity_boost: number; // 0-1
  style: number; // 0-1
  use_speaker_boost: boolean;
}

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  voice_id: string;
  provider: string;
  language: string;
  gender: "female" | "male" | "neutral";
  accent: string;
  emotion_presets: Record<Emotion, VoicePreset>;
}

export interface VoicePreset {
  speed: number;
  pitch: number;
  stability: number;
  similarity_boost: number;
  style: number;
}

export interface VoiceStreamState {
  is_playing: boolean;
  is_interrupted: boolean;
  current_segment: string;
  queued_segments: string[];
  vad_active: boolean;
  noise_level: number;
}

export interface VADConfig {
  threshold: number; // 0-1
  min_speech_duration: number; // ms
  min_silence_duration: number; // ms
  speech_timeout: number; // ms
  silence_timeout: number; // ms
}

// ─── Conversation Types ───
export interface ConversationContext {
  conversation_id: string;
  user_id: string;
  messages: ConversationMessage[];
  memory_context: MemoryContext;
  emotion_state: EmotionState;
  relationship_state: RelationshipState;
  personality_config: PersonalityConfig;
  voice_config: VoiceConfig;
  time_context: TimeContext;
  language_context: LanguageContext;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  emotion?: EmotionState;
  tokens_used?: number;
  created_at: string;
  metadata?: {
    is_voice?: boolean;
    was_interrupted?: boolean;
    edit_history?: { content: string; edited_at: string }[];
    bookmarks?: boolean;
    read?: boolean;
    read_at?: string;
  };
}

export interface TimeContext {
  hour: number;
  minute: number;
  day_of_week: string;
  tamil_day: string;
  time_of_day: "morning" | "afternoon" | "evening" | "night";
  is_weekend: boolean;
  special_occasions: SpecialOccasion[];
  season: "spring" | "summer" | "monsoon" | "winter";
}

export interface SpecialOccasion {
  name: string;
  tamil_name?: string;
  type: "festival" | "birthday" | "anniversary" | "personal" | "seasonal";
  date: string;
  relevance: number; // 0-1
}

export interface LanguageContext {
  primary_language: "tamil" | "english" | "tanglish";
  detected_language: "tamil" | "english" | "tanglish" | "mixed";
  tamil_ratio: number; // 0-1
  confidence: number;
  dialect?: "madras" | "salem" | "coimbatore" | "chennai" | "standard";
}

// ─── Recommendation Types ───
export interface Recommendation {
  type: "movie" | "music" | "book" | "food" | "activity" | "topic";
  title: string;
  description: string;
  reason: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

// ─── Analytics Types ───
export interface UserAnalytics {
  user_id: string;
  total_conversations: number;
  total_messages: number;
  total_tokens_used: number;
  avg_session_duration: number;
  most_active_hour: number;
  most_used_style: string;
  emotion_distribution: Record<Emotion, number>;
  top_topics: string[];
  relationship_progression: RelationshipLevel;
  engagement_score: number;
  last_active: string;
}

// ─── API Types ───
export interface ChatRequest {
  messages: { role: string; content: string }[];
  conversationId?: string;
  isVoice?: boolean;
  language?: string;
}

export interface ChatResponse {
  content: string;
  reasoning?: string;
  emotion?: EmotionState;
  voice_url?: string;
  tokens_used?: number;
  memories_updated?: string[];
}

export interface MemorySearchResult {
  entry: MemoryEntry;
  relevance_score: number;
  semantic_similarity: number;
  recency_score: number;
  importance_score: number;
}

export interface PrivacySettings {
  user_id: string;
  encrypt_conversations: boolean;
  encrypt_memories: boolean;
  auto_delete_days?: number;
  memory_permissions: {
    short_term: boolean;
    long_term: boolean;
    episodic: boolean;
    semantic: boolean;
    emotional: boolean;
  };
  consent_given: boolean;
  consent_date: string;
  audit_log_enabled: boolean;
}
