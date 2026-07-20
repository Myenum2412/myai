-- ═══════════════════════════════════════════════════════════════
-- Luna AI Companion — Cognitive Platform Schema v3
-- Goals, Reflection, Analytics, Scheduler, Multimodal
-- ═══════════════════════════════════════════════════════════════

-- ─── User Goals ───
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'personal',
  target_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  milestones TEXT[] DEFAULT '{}',
  last_checked TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── User Habits ───
CREATE TABLE IF NOT EXISTS user_habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT DEFAULT 'daily',
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_completed TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Conversation Analyses ───
CREATE TABLE IF NOT EXISTS conversation_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  quality_score INTEGER DEFAULT 50,
  emotional_accuracy INTEGER DEFAULT 50,
  response_relevance INTEGER DEFAULT 50,
  engagement_score INTEGER DEFAULT 50,
  user_satisfaction_estimate INTEGER DEFAULT 50,
  key_moments TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  successful_patterns TEXT[] DEFAULT '{}',
  issues_detected TEXT[] DEFAULT '{}',
  memory_quality INTEGER DEFAULT 50,
  personality_consistency INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id)
);

-- ─── Scheduled Messages ───
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('check_in', 'follow_up', 'celebration', 'motivation', 'wellness', 'seasonal', 'topic', 'goal')),
  message TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── User Attachments ───
CREATE TABLE IF NOT EXISTS user_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'document', 'voice_note', 'video', 'pdf')),
  filename TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  summary TEXT,
  extracted_text TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Analytics Metrics ───
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  tags JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- ─── Analytics Events ───
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- ─── Knowledge Graph (Memory Relationships) ───
CREATE TABLE IF NOT EXISTS knowledge_graph (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL,
  source_type TEXT NOT NULL,
  target_node_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  relationship TEXT NOT NULL,
  weight REAL DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ───
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON user_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_habits_user_id ON user_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analyses_user ON conversation_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_user ON scheduled_messages(user_id, sent, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_user_attachments_user ON user_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_user ON analytics_metrics(user_id, metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_user ON knowledge_graph(user_id);

-- ─── Row Level Security ───
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals" ON user_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own habits" ON user_habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own analyses" ON conversation_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own analyses" ON conversation_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own scheduled messages" ON scheduled_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own attachments" ON user_attachments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own metrics" ON analytics_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own metrics" ON analytics_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own events" ON analytics_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own events" ON analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own knowledge graph" ON knowledge_graph FOR ALL USING (auth.uid() = user_id);

-- ─── Updated_at Triggers ───
CREATE TRIGGER user_goals_updated_at BEFORE UPDATE ON user_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER user_habits_updated_at BEFORE UPDATE ON user_habits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
