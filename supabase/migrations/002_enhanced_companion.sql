-- ═══════════════════════════════════════════════════════════════
-- Luna AI Companion — Enhanced Schema
-- Memory Engine, Relationship, Personality, Voice
-- ═══════════════════════════════════════════════════════════════

-- ─── Memory Entries (Hybrid Memory System) ───
CREATE TABLE IF NOT EXISTS memory_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('short_term', 'long_term', 'episodic', 'semantic', 'emotional')),
  category TEXT NOT NULL CHECK (category IN ('preference', 'hobby', 'date', 'goal', 'fact', 'personality', 'topic', 'milestone', 'emotion', 'conversation_summary', 'inside_joke', 'shared_experience')),
  content TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  emotional_weight REAL DEFAULT 0 CHECK (emotional_weight BETWEEN 0 AND 1),
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  embedding FLOAT8[],
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, key)
);

-- ─── Memory Summaries ───
CREATE TABLE IF NOT EXISTS memory_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  summary TEXT NOT NULL,
  key_moments TEXT[] DEFAULT '{}',
  emotional_highlights TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period)
);

-- ─── Relationship States ───
CREATE TABLE IF NOT EXISTS relationship_states (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT DEFAULT 'stranger' CHECK (level IN ('stranger', 'acquaintance', 'friend', 'close_friend', 'best_friend', 'soulmate')),
  trust_score REAL DEFAULT 5 CHECK (trust_score BETWEEN 0 AND 100),
  intimacy_score REAL DEFAULT 2 CHECK (intimacy_score BETWEEN 0 AND 100),
  familiarity_score REAL DEFAULT 1 CHECK (familiarity_score BETWEEN 0 AND 100),
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  days_known INTEGER DEFAULT 0,
  first_conversation TIMESTAMPTZ DEFAULT now(),
  last_conversation TIMESTAMPTZ DEFAULT now(),
  shared_memories INTEGER DEFAULT 0,
  inside_jokes INTEGER DEFAULT 0,
  milestones_reached TEXT[] DEFAULT '{}',
  favorite_topics TEXT[] DEFAULT '{}',
  greeting_style TEXT DEFAULT 'default',
  personality_adaptation JSONB DEFAULT '{"formality_level": 0.3, "humor_frequency": 0.5, "emoji_usage": 0.4, "tamil_ratio": 0.5, "sentence_length": "medium", "emotional_depth": 0.3, "proactive_engagement": 0.2}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Personality Configs ───
CREATE TABLE IF NOT EXISTS personality_configs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  companion_name TEXT DEFAULT 'Luna',
  companion_persona TEXT DEFAULT 'girlfriend' CHECK (companion_persona IN ('girlfriend', 'best_friend', 'mentor', 'therapist', 'companion', 'custom')),
  affection_level REAL DEFAULT 0.7 CHECK (affection_level BETWEEN 0 AND 1),
  humor_level REAL DEFAULT 0.5 CHECK (humor_level BETWEEN 0 AND 1),
  playfulness REAL DEFAULT 0.6 CHECK (playfulness BETWEEN 0 AND 1),
  empathy REAL DEFAULT 0.8 CHECK (empathy BETWEEN 0 AND 1),
  intelligence REAL DEFAULT 0.7 CHECK (intelligence BETWEEN 0 AND 1),
  confidence REAL DEFAULT 0.6 CHECK (confidence BETWEEN 0 AND 1),
  formality REAL DEFAULT 0.25 CHECK (formality BETWEEN 0 AND 1),
  conversation_depth TEXT DEFAULT 'adaptive' CHECK (conversation_depth IN ('casual', 'moderate', 'deep', 'adaptive')),
  communication_style TEXT DEFAULT 'caring' CHECK (communication_style IN ('romantic', 'friendly', 'motivational', 'cheerful', 'calm', 'caring', 'humorous')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Voice Configs ───
CREATE TABLE IF NOT EXISTS voice_configs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'browser' CHECK (provider IN ('elevenlabs', 'openai', 'azure', 'browser')),
  voice_profile_id TEXT DEFAULT 'luna-default',
  voice_id TEXT DEFAULT 'default',
  language TEXT DEFAULT 'auto' CHECK (language IN ('ta', 'en', 'auto')),
  speed REAL DEFAULT 1.0,
  pitch REAL DEFAULT 1.0,
  volume REAL DEFAULT 1.0,
  stability REAL DEFAULT 0.7,
  similarity_boost REAL DEFAULT 0.8,
  style REAL DEFAULT 0.3,
  use_speaker_boost BOOLEAN DEFAULT true,
  emotion_mapping JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Emotion History ───
CREATE TABLE IF NOT EXISTS emotion_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  primary_emotion TEXT NOT NULL,
  secondary_emotion TEXT,
  intensity REAL DEFAULT 0.5 CHECK (intensity BETWEEN 0 AND 1),
  confidence REAL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  valence REAL DEFAULT 0 CHECK (valence BETWEEN -1 AND 1),
  arousal REAL DEFAULT 0 CHECK (arousal BETWEEN -1 AND 1),
  trigger_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Privacy Settings ───
CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypt_conversations BOOLEAN DEFAULT false,
  encrypt_memories BOOLEAN DEFAULT false,
  auto_delete_days INTEGER,
  memory_permissions JSONB DEFAULT '{"short_term": true, "long_term": true, "episodic": true, "semantic": true, "emotional": true}',
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,
  audit_log_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Audit Logs ───
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ───
CREATE INDEX IF NOT EXISTS idx_memory_entries_user_id ON memory_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_entries_type ON memory_entries(user_id, type);
CREATE INDEX IF NOT EXISTS idx_memory_entries_category ON memory_entries(user_id, category);
CREATE INDEX IF NOT EXISTS idx_memory_entries_importance ON memory_entries(user_id, importance DESC);
CREATE INDEX IF NOT EXISTS idx_memory_summaries_user_id ON memory_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_history_user_id ON emotion_history(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_history_created ON emotion_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(user_id, created_at DESC);

-- ─── Row Level Security ───
ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Memory entries policies
CREATE POLICY "Users can view own memory entries" ON memory_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own memory entries" ON memory_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memory entries" ON memory_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memory entries" ON memory_entries FOR DELETE USING (auth.uid() = user_id);

-- Memory summaries policies
CREATE POLICY "Users can view own memory summaries" ON memory_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own memory summaries" ON memory_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memory summaries" ON memory_summaries FOR UPDATE USING (auth.uid() = user_id);

-- Relationship states policies
CREATE POLICY "Users can view own relationship" ON relationship_states FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own relationship" ON relationship_states FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own relationship" ON relationship_states FOR UPDATE USING (auth.uid() = user_id);

-- Personality configs policies
CREATE POLICY "Users can view own personality" ON personality_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own personality" ON personality_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personality" ON personality_configs FOR UPDATE USING (auth.uid() = user_id);

-- Voice configs policies
CREATE POLICY "Users can view own voice config" ON voice_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own voice config" ON voice_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own voice config" ON voice_configs FOR UPDATE USING (auth.uid() = user_id);

-- Emotion history policies
CREATE POLICY "Users can view own emotion history" ON emotion_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own emotion history" ON emotion_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Privacy settings policies
CREATE POLICY "Users can view own privacy settings" ON privacy_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own privacy settings" ON privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own privacy settings" ON privacy_settings FOR UPDATE USING (auth.uid() = user_id);

-- Audit logs policies
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Updated_at Triggers ───
CREATE TRIGGER memory_entries_updated_at BEFORE UPDATE ON memory_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER relationship_states_updated_at BEFORE UPDATE ON relationship_states FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER personality_configs_updated_at BEFORE UPDATE ON personality_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER voice_configs_updated_at BEFORE UPDATE ON voice_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER privacy_settings_updated_at BEFORE UPDATE ON privacy_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
