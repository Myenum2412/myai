import { createClient } from '@/lib/supabase/server';
import type { Conversation, Message, UserMemory, UserSettings } from '@/lib/database.types';

// ─── Conversations ───

export async function getConversations(userId: string): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createConversation(userId: string, title?: string, style?: string): Promise<Conversation> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, title: title || 'New Chat', style: style || 'caring' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateConversation(id: string, updates: Partial<Pick<Conversation, 'title' | 'style' | 'pinned'>>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteConversation(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getConversationStyle(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('style')
    .eq('id', id)
    .single();

  if (error) return null;
  return data?.style || null;
}

// ─── Messages ───

export async function getMessages(conversationId: string, limit = 50): Promise<Message[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getRecentMessages(conversationId: string, limit = 20): Promise<Message[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).reverse();
}

export async function addMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<Message> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single();

  if (error) throw error;

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
}

export async function updateMessageReaction(id: string, reaction: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('messages')
    .update({ reaction })
    .eq('id', id);

  if (error) throw error;
}

export async function toggleMessageFavorite(id: string, favorite: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('messages')
    .update({ favorite })
    .eq('id', id);

  if (error) throw error;
}

// ─── User Memory ───

export async function getUserMemory(userId: string): Promise<UserMemory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_memory')
    .select('*')
    .eq('user_id', userId)
    .order('importance', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function upsertMemory(
  userId: string,
  category: UserMemory['category'],
  key: string,
  value: string,
  importance = 5
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('user_memory')
    .upsert(
      { user_id: userId, category, key, value, importance },
      { onConflict: 'user_id,key' }
    );

  if (error) throw error;
}

export async function deleteMemory(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('user_memory')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── User Settings ───

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' });

  if (error) throw error;
}
