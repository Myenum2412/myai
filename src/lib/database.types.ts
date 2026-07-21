export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  style: 'romantic' | 'friendly' | 'motivational' | 'cheerful' | 'calm' | 'caring' | 'humorous' | 'intimate';
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  reaction: 'love' | 'laugh' | 'fire' | 'sad' | 'wow' | null;
  favorite: boolean;
  created_at: string;
}

export interface UserMemory {
  id: string;
  user_id: string;
  category: 'preference' | 'topic' | 'date' | 'hobby' | 'goal' | 'milestone' | 'fact' | 'personality';
  key: string;
  value: string;
  importance: number;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  preferred_language: 'auto' | 'tamil' | 'english';
  voice_enabled: boolean;
  voice_id: string;
  voice_speed: number;
  voice_pitch: number;
  voice_volume: number;
  memory_enabled: boolean;
  companion_name: string;
  voice_profile?: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryEntry {
  id: string;
  user_id: string;
  type: 'short_term' | 'long_term' | 'episodic' | 'semantic' | 'emotional';
  category: 'preference' | 'hobby' | 'date' | 'goal' | 'fact' | 'personality' | 'topic' | 'milestone' | 'emotion' | 'conversation_summary' | 'inside_joke' | 'shared_experience';
  content: string;
  key: string;
  value: string;
  importance: number;
  emotional_weight: number;
  access_count: number;
  last_accessed: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
}

export interface MemorySummary {
  id: string;
  user_id: string;
  period: 'daily' | 'weekly' | 'monthly';
  summary: string;
  key_moments: string[];
  emotional_highlights: string[];
  created_at: string;
}

export interface RelationshipState {
  user_id: string;
  level: 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'best_friend' | 'soulmate';
  trust_score: number;
  intimacy_score: number;
  familiarity_score: number;
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
  personality_adaptation: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PersonalityConfig {
  user_id: string;
  companion_name: string;
  companion_persona: 'girlfriend' | 'best_friend' | 'mentor' | 'therapist' | 'companion' | 'custom';
  affection_level: number;
  humor_level: number;
  playfulness: number;
  empathy: number;
  intelligence: number;
  confidence: number;
  formality: number;
  conversation_depth: 'casual' | 'moderate' | 'deep' | 'adaptive';
  communication_style: 'romantic' | 'friendly' | 'motivational' | 'cheerful' | 'calm' | 'caring' | 'humorous' | 'intimate';
  created_at: string;
  updated_at: string;
}

export interface VoiceConfig {
  user_id: string;
  provider: 'elevenlabs' | 'openai' | 'azure' | 'browser';
  voice_profile_id: string;
  voice_id: string;
  language: 'ta' | 'en' | 'auto';
  speed: number;
  pitch: number;
  volume: number;
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  emotion_mapping: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface EmotionHistory {
  id: string;
  user_id: string;
  conversation_id?: string;
  primary_emotion: string;
  secondary_emotion?: string;
  intensity: number;
  confidence: number;
  valence: number;
  arousal: number;
  trigger_text?: string;
  created_at: string;
}

export interface PrivacySettings {
  user_id: string;
  encrypt_conversations: boolean;
  encrypt_memories: boolean;
  auto_delete_days?: number;
  memory_permissions: Record<string, boolean>;
  consent_given: boolean;
  consent_date?: string;
  audit_log_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, unknown>;
  created_at: string;
}

export type ConversationStyle = Conversation['style'];
