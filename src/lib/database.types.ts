export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  style: 'romantic' | 'friendly' | 'motivational' | 'cheerful' | 'calm' | 'caring' | 'humorous';
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
  created_at: string;
  updated_at: string;
}

export type ConversationStyle = Conversation['style'];
