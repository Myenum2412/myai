// ═══════════════════════════════════════════════════════════════
// Reflection & Self-Improvement Engine
// Post-conversation analysis and continuous improvement
// ═══════════════════════════════════════════════════════════════

import { createClient } from "@/lib/supabase/server";
import type { EmotionState, ConversationContext } from "@/lib/types";

export interface ConversationAnalysis {
  conversation_id: string;
  quality_score: number; // 0-100
  emotional_accuracy: number; // 0-100
  response_relevance: number; // 0-100
  engagement_score: number; // 0-100
  user_satisfaction_estimate: number; // 0-100
  key_moments: string[];
  improvements: string[];
  successful_patterns: string[];
  issues_detected: string[];
  memory_quality: number; // 0-100
  personality_consistency: number; // 0-100
}

export class ReflectionEngine {
  /**
   * Analyze a completed conversation
   */
  async analyzeConversation(
    userId: string,
    conversationId: string,
    messages: { role: string; content: string; created_at: string }[],
    emotions: EmotionState[]
  ): Promise<ConversationAnalysis> {
    // Calculate metrics
    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");

    // Quality score based on conversation length and depth
    const avgMessageLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / (userMessages.length || 1);
    const quality_score = Math.min(100, Math.round(
      (Math.min(1, userMessages.length / 10) * 30) +
      (Math.min(1, avgMessageLength / 50) * 30) +
      (Math.min(1, assistantMessages.length / 10) * 20) +
      (emotions.length > 0 ? 20 : 0)
    ));

    // Emotional accuracy (did we detect and respond to emotions appropriately?)
    const emotional_accuracy = emotions.length > 0
      ? Math.round(emotions.reduce((sum, e) => sum + e.confidence * 100, 0) / emotions.length)
      : 50;

    // Engagement score (did the user stay engaged?)
    const engagement_score = Math.min(100, Math.round(
      (Math.min(1, userMessages.length / 15) * 40) +
      (Math.min(1, avgMessageLength / 30) * 30) +
      30
    ));

    // User satisfaction estimate (based on message patterns)
    const positivePatterns = ["thank", "love", "great", "awesome", "happy", "nice", "santhosham", "semma"];
    const negativePatterns = ["bad", "hate", "terrible", "worst", "annoying", "kadichirukku"];
    let positiveCount = 0;
    let negativeCount = 0;
    for (const msg of userMessages) {
      const lower = msg.content.toLowerCase();
      if (positivePatterns.some((p) => lower.includes(p))) positiveCount++;
      if (negativePatterns.some((p) => lower.includes(p))) negativeCount++;
    }
    const user_satisfaction_estimate = Math.round(
      50 + ((positiveCount - negativeCount) / (userMessages.length || 1)) * 50
    );

    // Key moments
    const key_moments: string[] = [];
    for (const msg of userMessages) {
      if (msg.content.length > 100) {
        key_moments.push(msg.content.slice(0, 80));
      }
    }

    // Improvements
    const improvements: string[] = [];
    if (quality_score < 60) improvements.push("Conversation felt shallow — ask more follow-up questions");
    if (emotional_accuracy < 70) improvements.push("Emotional detection could be improved");
    if (engagement_score < 50) improvements.push("User engagement was low — try more engaging topics");
    if (user_satisfaction_estimate < 40) improvements.push("User may not be satisfied — adjust approach");

    // Successful patterns
    const successful_patterns: string[] = [];
    if (positiveCount > negativeCount) successful_patterns.push("Positive emotional tone maintained");
    if (userMessages.length > 10) successful_patterns.push("Sustained engagement throughout");
    if (emotions.some((e) => e.primary === "happy")) successful_patterns.push("Successfully elicited positive emotions");

    // Save analysis
    await this.saveAnalysis(userId, conversationId, {
      quality_score,
      emotional_accuracy,
      response_relevance: Math.round((quality_score + engagement_score) / 2),
      engagement_score,
      user_satisfaction_estimate,
      key_moments,
      improvements,
      successful_patterns,
      issues_detected: improvements,
      memory_quality: 70,
      personality_consistency: 80,
    });

    return {
      conversation_id: conversationId,
      quality_score,
      emotional_accuracy,
      response_relevance: Math.round((quality_score + engagement_score) / 2),
      engagement_score,
      user_satisfaction_estimate,
      key_moments,
      improvements,
      successful_patterns,
      issues_detected: improvements,
      memory_quality: 70,
      personality_consistency: 80,
    };
  }

  /**
   * Build reflection context for the AI
   */
  buildReflectionContext(analyses: ConversationAnalysis[]): string {
    if (analyses.length === 0) return "";

    const avgQuality = analyses.reduce((s, a) => s + a.quality_score, 0) / analyses.length;
    const avgEngagement = analyses.reduce((s, a) => s + a.engagement_score, 0) / analyses.length;
    const avgSatisfaction = analyses.reduce((s, a) => s + a.user_satisfaction_estimate, 0) / analyses.length;

    let context = `\n## Self-Reflection\n`;
    context += `Recent conversation quality: ${Math.round(avgQuality)}/100\n`;
    context += `Average engagement: ${Math.round(avgEngagement)}/100\n`;
    context += `Estimated satisfaction: ${Math.round(avgSatisfaction)}/100\n`;

    const allImprovements = analyses.flatMap((a) => a.improvements);
    const uniqueImprovements = [...new Set(allImprovements)].slice(0, 3);
    if (uniqueImprovements.length > 0) {
      context += `\nAreas to improve:\n`;
      for (const imp of uniqueImprovements) {
        context += `- ${imp}\n`;
      }
    }

    const allSuccesses = analyses.flatMap((a) => a.successful_patterns);
    const uniqueSuccesses = [...new Set(allSuccesses)].slice(0, 3);
    if (uniqueSuccesses.length > 0) {
      context += `\nWhat's working well:\n`;
      for (const suc of uniqueSuccesses) {
        context += `- ${suc}\n`;
      }
    }

    return context;
  }

  private async saveAnalysis(
    userId: string,
    conversationId: string,
    analysis: Omit<ConversationAnalysis, "conversation_id">
  ): Promise<void> {
    const supabase = await createClient();
    await supabase.from("conversation_analyses").upsert({
      user_id: userId,
      conversation_id: conversationId,
      quality_score: analysis.quality_score,
      emotional_accuracy: analysis.emotional_accuracy,
      response_relevance: analysis.response_relevance,
      engagement_score: analysis.engagement_score,
      user_satisfaction_estimate: analysis.user_satisfaction_estimate,
      key_moments: analysis.key_moments,
      improvements: analysis.improvements,
      successful_patterns: analysis.successful_patterns,
      issues_detected: analysis.issues_detected,
      memory_quality: analysis.memory_quality,
      personality_consistency: analysis.personality_consistency,
    }, { onConflict: "conversation_id" });
  }
}

export const reflectionEngine = new ReflectionEngine();
