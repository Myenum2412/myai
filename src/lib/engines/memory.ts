// ═══════════════════════════════════════════════════════════════
// Hybrid Memory Engine
// Short-term, Long-term, Episodic, Semantic, Emotional Memory
// ═══════════════════════════════════════════════════════════════

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemoryEntry, MemoryType, MemoryCategory, MemoryContext, MemorySummary, MemorySearchResult } from "@/lib/types";

// ─── Memory Configuration ───
const MEMORY_CONFIG = {
  short_term: {
    max_entries: 50,
    ttl_hours: 24,
    auto_decay: 0.1, // decay factor per hour
  },
  long_term: {
    max_entries: 500,
    min_importance: 5,
    promotion_threshold: 3, // how many times accessed to promote
  },
  episodic: {
    max_entries: 200,
    min_importance: 7,
    retention_days: 365,
  },
  semantic: {
    max_entries: 300,
    min_importance: 4,
    dedup_threshold: 0.9, // similarity threshold for dedup
  },
  emotional: {
    max_entries: 100,
    min_importance: 6,
    decay_days: 90, // emotional memories decay after 90 days
  },
  summary: {
    daily_threshold: 10, // messages per day to trigger summary
    weekly_threshold: 50,
    max_summaries: 100,
  },
};

// ─── Importance Scoring ───
const CATEGORY_IMPORTANCE: Record<MemoryCategory, number> = {
  milestone: 9,
  emotion: 8,
  date: 8,
  goal: 7,
  inside_joke: 7,
  shared_experience: 7,
  preference: 6,
  personality: 6,
  conversation_summary: 5,
  hobby: 5,
  topic: 4,
  fact: 4,
};

export class MemoryEngine {
  /**
   * Get complete memory context for a conversation
   */
  async getMemoryContext(userId: string): Promise<MemoryContext> {
    const supabase = await createClient();

    const [shortTerm, longTerm, episodic, semantic, emotional, summaries] = await Promise.all([
      this.getMemoriesByType(supabase, userId, "short_term"),
      this.getMemoriesByType(supabase, userId, "long_term"),
      this.getMemoriesByType(supabase, userId, "episodic"),
      this.getMemoriesByType(supabase, userId, "semantic"),
      this.getMemoriesByType(supabase, userId, "emotional"),
      this.getSummaries(supabase, userId),
    ]);

    return { short_term: shortTerm, long_term: longTerm, episodic, semantic, emotional, summaries };
  }

  /**
   * Store a memory entry with automatic classification
   */
  async storeMemory(
    userId: string,
    category: MemoryCategory,
    key: string,
    value: string,
    options: {
      type?: MemoryType;
      importance?: number;
      emotional_weight?: number;
      metadata?: Record<string, unknown>;
      expires_at?: string;
    } = {}
  ): Promise<MemoryEntry> {
    const supabase = await createClient();
    const type = options.type || this.classifyMemoryType(category, options.importance || CATEGORY_IMPORTANCE[category] || 5);
    const importance = options.importance || CATEGORY_IMPORTANCE[category] || 5;
    const emotional_weight = options.emotional_weight || this.calculateEmotionalWeight(value);

    const { data, error } = await supabase
      .from("memory_entries")
      .upsert(
        {
          user_id: userId,
          type,
          category,
          content: value,
          key,
          value,
          importance,
          emotional_weight,
          access_count: 0,
          last_accessed: new Date().toISOString(),
          metadata: options.metadata || {},
          expires_at: options.expires_at || null,
        },
        { onConflict: "user_id,key" }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Search memories with relevance scoring
   */
  async searchMemories(
    userId: string,
    query: string,
    options: {
      types?: MemoryType[];
      categories?: MemoryCategory[];
      limit?: number;
      min_relevance?: number;
    } = {}
  ): Promise<MemorySearchResult[]> {
    const supabase = await createClient();
    const limit = options.limit || 10;

    let queryBuilder = supabase
      .from("memory_entries")
      .select("*")
      .eq("user_id", userId)
      .gt("importance", 3);

    if (options.types?.length) {
      queryBuilder = queryBuilder.in("type", options.types);
    }
    if (options.categories?.length) {
      queryBuilder = queryBuilder.in("category", options.categories);
    }

    const { data: memories, error } = await queryBuilder;
    if (error) throw error;
    if (!memories) return [];

    // Score each memory for relevance
    const scored: MemorySearchResult[] = memories.map((m) => {
      const textMatch = this.textSimilarity(query.toLowerCase(), `${m.key} ${m.value}`.toLowerCase());
      const recencyScore = this.recencyScore(m.last_accessed);
      const importanceScore = m.importance / 10;
      const emotionalScore = m.emotional_weight * 0.5;

      const relevance_score = textMatch * 0.4 + recencyScore * 0.2 + importanceScore * 0.25 + emotionalScore * 0.15;

      return {
        entry: m,
        relevance_score,
        semantic_similarity: textMatch,
        recency_score: recencyScore,
        importance_score: importanceScore,
      };
    });

    return scored
      .filter((r) => r.relevance_score >= (options.min_relevance || 0.1))
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);
  }

  /**
   * Build memory context for system prompt
   */
  buildMemoryPrompt(context: MemoryContext): string {
    let prompt = "";

    // Short-term memory (current conversation context)
    if (context.short_term.length > 0) {
      prompt += `\n## Current Conversation Context\n`;
      for (const m of context.short_term.slice(-10)) {
        prompt += `- ${m.value}\n`;
      }
    }

    // Long-term memory (important persistent facts)
    if (context.long_term.length > 0) {
      prompt += `\n## What You Know About Your Person\n`;
      const grouped = this.groupByCategory(context.long_term);
      for (const [category, memories] of Object.entries(grouped)) {
        prompt += `**${this.formatCategoryName(category)}**: ${memories.map((m) => m.value).join(", ")}\n`;
      }
    }

    // Episodic memory (important events and milestones)
    if (context.episodic.length > 0) {
      prompt += `\n## Important Memories & Milestones\n`;
      for (const m of context.episodic.slice(0, 10)) {
        prompt += `- ${m.value} (importance: ${m.importance}/10)\n`;
      }
    }

    // Semantic memory (facts about the user)
    if (context.semantic.length > 0) {
      prompt += `\n## Facts About Your Person\n`;
      for (const m of context.semantic.slice(0, 15)) {
        prompt += `- ${m.key}: ${m.value}\n`;
      }
    }

    // Emotional memory (emotional patterns and significant moments)
    if (context.emotional.length > 0) {
      prompt += `\n## Emotional Context\n`;
      prompt += `Your person's emotional patterns and important emotional moments:\n`;
      for (const m of context.emotional.slice(0, 5)) {
        prompt += `- ${m.value}\n`;
      }
    }

    // Conversation summaries
    if (context.summaries.length > 0) {
      const latest = context.summaries[0];
      prompt += `\n## Recent Conversation Summary\n`;
      prompt += `${latest.summary}\n`;
      if (latest.key_moments.length > 0) {
        prompt += `Key moments: ${latest.key_moments.join(", ")}\n`;
      }
      if (latest.emotional_highlights.length > 0) {
        prompt += `Emotional highlights: ${latest.emotional_highlights.join(", ")}\n`;
      }
    }

    return prompt;
  }

  /**
   * Promote short-term memories to long-term based on access patterns
   */
  async promoteMemories(userId: string): Promise<number> {
    const supabase = await createClient();

    const { data: candidates } = await supabase
      .from("memory_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "short_term")
      .gte("access_count", MEMORY_CONFIG.long_term.promotion_threshold)
      .gte("importance", MEMORY_CONFIG.long_term.min_importance);

    if (!candidates || candidates.length === 0) return 0;

    let promoted = 0;
    for (const memory of candidates) {
      const { error } = await supabase
        .from("memory_entries")
        .update({ type: "long_term" })
        .eq("id", memory.id);

      if (!error) promoted++;
    }

    return promoted;
  }

  /**
   * Generate conversation summary
   */
  async generateSummary(
    userId: string,
    messages: { role: string; content: string; created_at: string }[]
  ): Promise<MemorySummary> {
    // Extract key moments and emotional highlights
    const keyMoments: string[] = [];
    const emotionalHighlights: string[] = [];

    for (const msg of messages) {
      if (msg.role === "user") {
        // Simple extraction of significant content
        if (msg.content.length > 50) {
          keyMoments.push(msg.content.slice(0, 100));
        }
      }
    }

    const summary = `Conversation on ${messages[0]?.created_at || new Date().toISOString()}. ` +
      `${messages.length} messages exchanged. ` +
      `Topics discussed include daily life, feelings, and shared experiences.`;

    const entry: MemorySummary = {
      id: "",
      user_id: userId,
      period: "daily",
      summary,
      key_moments: keyMoments.slice(0, 5),
      emotional_highlights: emotionalHighlights.slice(0, 3),
      created_at: new Date().toISOString(),
    };

    // Store summary
    const supabase = await createClient();
    const { data } = await supabase
      .from("memory_summaries")
      .upsert({
        user_id: userId,
        period: entry.period,
        summary: entry.summary,
        key_moments: entry.key_moments,
        emotional_highlights: entry.emotional_highlights,
      }, { onConflict: "user_id,period" })
      .select()
      .single();

    if (data) entry.id = data.id;
    return entry;
  }

  /**
   * Clean up expired memories
   */
  async cleanupExpired(userId: string): Promise<number> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("memory_entries")
      .delete()
      .eq("user_id", userId)
      .lt("expires_at", now)
      .select();

    return data?.length || 0;
  }

  // ─── Private Helpers ───

  private async getMemoriesByType(supabase: SupabaseClient, userId: string, type: MemoryType): Promise<MemoryEntry[]> {
    const { data, error } = await supabase
      .from("memory_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("type", type)
      .order("importance", { ascending: false })
      .order("last_accessed", { ascending: false })
      .limit(type === "short_term" ? MEMORY_CONFIG.short_term.max_entries : 50);

    if (error) return [];
    return data || [];
  }

  private async getSummaries(supabase: SupabaseClient, userId: string): Promise<MemorySummary[]> {
    const { data, error } = await supabase
      .from("memory_summaries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) return [];
    return data || [];
  }

  private classifyMemoryType(category: MemoryCategory, importance: number): MemoryType {
    if (category === "milestone" || category === "inside_joke" || category === "shared_experience") return "episodic";
    if (category === "emotion") return "emotional";
    if (category === "conversation_summary") return "long_term";
    if (importance >= 7) return "long_term";
    if (importance >= 4) return "semantic";
    return "short_term";
  }

  private calculateEmotionalWeight(text: string): number {
    const emotionalWords = [
      "love", "miss", "heart", "cry", "tears", "happy", "sad", "angry",
      "thangam", "kanna", "jaanu", "kadichirukku", "santhosham",
    ];
    const matches = emotionalWords.filter((w) => text.toLowerCase().includes(w));
    return Math.min(1, matches.length * 0.3);
  }

  private textSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private recencyScore(lastAccessed: string): number {
    const hoursSinceAccess = (Date.now() - new Date(lastAccessed).getTime()) / (1000 * 60 * 60);
    return Math.max(0, 1 - hoursSinceAccess / 720); // Decay over 30 days
  }

  private groupByCategory(memories: MemoryEntry[]): Record<string, MemoryEntry[]> {
    return memories.reduce((acc, m) => {
      if (!acc[m.category]) acc[m.category] = [];
      acc[m.category].push(m);
      return acc;
    }, {} as Record<string, MemoryEntry[]>);
  }

  private formatCategoryName(category: string): string {
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

export const memoryEngine = new MemoryEngine();
