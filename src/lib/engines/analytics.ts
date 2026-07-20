// ═══════════════════════════════════════════════════════════════
// Analytics & Observability Engine
// Metrics, tracing, health monitoring, usage analytics
// ═══════════════════════════════════════════════════════════════

import { createClient } from "@/lib/supabase/server";
import type { Emotion } from "@/lib/types";
import type { ConversationStyle } from "@/lib/database.types";

export interface MetricEntry {
  user_id: string;
  metric_name: string;
  metric_value: number;
  tags: Record<string, string>;
  timestamp: string;
}

export interface HealthStatus {
  service: string;
  status: "healthy" | "degraded" | "down";
  latency_ms: number;
  last_check: string;
  error_rate: number;
}

export interface UsageAnalytics {
  total_conversations: number;
  total_messages: number;
  total_tokens_used: number;
  avg_session_duration: number;
  most_active_hour: number;
  most_used_style: ConversationStyle;
  emotion_distribution: Record<Emotion, number>;
  top_topics: string[];
  voice_usage_percent: number;
  memory_retrieval_rate: number;
  proactive_engagement_rate: number;
}

export class AnalyticsEngine {
  /**
   * Record a metric
   */
  async recordMetric(
    userId: string,
    name: string,
    value: number,
    tags: Record<string, string> = {}
  ): Promise<void> {
    const supabase = await createClient();
    await supabase.from("analytics_metrics").insert({
      user_id: userId,
      metric_name: name,
      metric_value: value,
      tags,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Record conversation event
   */
  async recordConversationEvent(
    userId: string,
    eventType: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const supabase = await createClient();
    await supabase.from("analytics_events").insert({
      user_id: userId,
      event_type: eventType,
      event_data: data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get usage analytics for a user
   */
  async getUsageAnalytics(userId: string): Promise<UsageAnalytics> {
    const supabase = await createClient();

    // Get conversation stats
    const { count: totalConversations } = await supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get message stats (simplified query)
    const { count: totalMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true });

    // Get emotion distribution
    const { data: emotions } = await supabase
      .from("emotion_history")
      .select("primary_emotion")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    const emotionDist: Record<string, number> = {};
    for (const e of emotions || []) {
      emotionDist[e.primary_emotion] = (emotionDist[e.primary_emotion] || 0) + 1;
    }

    return {
      total_conversations: totalConversations || 0,
      total_messages: totalMessages || 0,
      total_tokens_used: 0,
      avg_session_duration: 0,
      most_active_hour: 12,
      most_used_style: "caring",
      emotion_distribution: emotionDist as Record<Emotion, number>,
      top_topics: [],
      voice_usage_percent: 0,
      memory_retrieval_rate: 0,
      proactive_engagement_rate: 0,
    };
  }

  /**
   * Build analytics context for the AI
   */
  buildAnalyticsContext(analytics: UsageAnalytics): string {
    let context = `\n## Usage Insights\n`;
    context += `Total conversations: ${analytics.total_conversations}\n`;
    context += `Total messages: ${analytics.total_messages}\n`;

    if (Object.keys(analytics.emotion_distribution).length > 0) {
      const topEmotions = Object.entries(analytics.emotion_distribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
      context += `Common emotions: ${topEmotions.map(([e, c]) => `${e}(${c})`).join(", ")}\n`;
    }

    return context;
  }

  /**
   * Check system health
   */
  async checkHealth(): Promise<HealthStatus[]> {
    const checks: HealthStatus[] = [];

    // Database health
    const start = Date.now();
    try {
      const supabase = await createClient();
      await supabase.from("conversations").select("id").limit(1);
      checks.push({
        service: "database",
        status: "healthy",
        latency_ms: Date.now() - start,
        last_check: new Date().toISOString(),
        error_rate: 0,
      });
    } catch {
      checks.push({
        service: "database",
        status: "down",
        latency_ms: Date.now() - start,
        last_check: new Date().toISOString(),
        error_rate: 1,
      });
    }

    // AI API health
    const aiStart = Date.now();
    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/models", {
        headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}` },
      });
      checks.push({
        service: "nvidia_api",
        status: response.ok ? "healthy" : "degraded",
        latency_ms: Date.now() - aiStart,
        last_check: new Date().toISOString(),
        error_rate: response.ok ? 0 : 0.5,
      });
    } catch {
      checks.push({
        service: "nvidia_api",
        status: "down",
        latency_ms: Date.now() - aiStart,
        last_check: new Date().toISOString(),
        error_rate: 1,
      });
    }

    return checks;
  }
}

export const analyticsEngine = new AnalyticsEngine();
