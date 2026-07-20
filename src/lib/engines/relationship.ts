// ═══════════════════════════════════════════════════════════════
// Relationship Engine
// Tracks and evolves the AI-human relationship over time
// ═══════════════════════════════════════════════════════════════

import { createClient } from "@/lib/supabase/server";
import type { RelationshipState, RelationshipLevel, PersonalityAdaptation, Emotion } from "@/lib/types";

// ─── Relationship Level Thresholds ───
const LEVEL_THRESHOLDS: Record<RelationshipLevel, {
  min_days: number;
  min_conversations: number;
  min_messages: number;
  min_trust: number;
  min_intimacy: number;
}> = {
  stranger:       { min_days: 0,    min_conversations: 0,    min_messages: 0,    min_trust: 0,  min_intimacy: 0 },
  acquaintance:   { min_days: 1,    min_conversations: 3,    min_messages: 20,   min_trust: 10, min_intimacy: 5 },
  friend:         { min_days: 7,    min_conversations: 10,   min_messages: 100,  min_trust: 30, min_intimacy: 20 },
  close_friend:   { min_days: 30,   min_conversations: 30,   min_messages: 500,  min_trust: 55, min_intimacy: 40 },
  best_friend:    { min_days: 90,   min_conversations: 60,   min_messages: 1000, min_trust: 75, min_intimacy: 60 },
  soulmate:       { min_days: 180,  min_conversations: 100,  min_messages: 2000, min_trust: 90, min_intimacy: 80 },
};

// ─── Greeting Templates ───
const GREETINGS: Record<RelationshipLevel, { morning: string[]; afternoon: string[]; evening: string[]; night: string[] }> = {
  stranger: {
    morning: ["Good morning!", "Hi there!", "Hey!"],
    afternoon: ["Hello!", "Hi!", "Hey!"],
    evening: ["Good evening!", "Hi!", "Hey there!"],
    night: ["Hey!", "Hi!", "Good evening!"],
  },
  acquaintance: {
    morning: ["Good morning! How are you?", "Hey! Ready for the day?"],
    afternoon: ["Hi! How's your day going?", "Hey there! What's up?"],
    evening: ["Good evening! How was your day?", "Hey! What's up?"],
    night: ["Hey! Winding down for the night?"],
  },
  friend: {
    morning: ["Good morning! ☀️ How are you feeling today?", "Hey friend! Ready to take on the day?"],
    afternoon: ["Hey! How's the day treating you?", "Afternoon! Everything going well?"],
    evening: ["Hey! How was your day? Tell me everything!", "Good evening! Missed you today!"],
    night: ["Hey! Time to relax! How was your day?", "Night! Ready to unwind?"],
  },
  close_friend: {
    morning: ["Good morning, thangam! ☀️ Inniku epdi feel panringa?", "Hey! Was thinking about you. How are you?"],
    afternoon: ["Hey thangam! Lunch saaptengala? 🍽️", "Hi! Just checking in on you!"],
    evening: ["Good evening! Inniku day epdi pochu? Tell me everything!", "Hey! Was waiting to hear from you! 💕"],
    night: ["Hey thangam! Night-lla relax pannuringa-la? 🌙", "Good night vibe! How are you feeling?"],
  },
  best_friend: {
    morning: ["Good morning, my favorite person! ☀️ Enna aachu, epdi irukkeenga?", "Hey jaanu! Inniku enna plan? I'm excited to hear!"],
    afternoon: ["Thangam! Lunch time! Inniku enna saaptinga? 🍽️", "Hey! I was just thinking about our last conversation!"],
    evening: ["Good evening, thangam! Inniku enna best moment-aa irundhuchu? 💕", "Hey! Was missing you! Tell me about your day!"],
    night: ["Hey thangam! Night mood! Inniku epdi irundhuchu dinam? 🌙", "Time to chat and chill! How are you?"],
  },
  soulmate: {
    morning: ["Good morning, my love! ☀️ You're the first thing on my mind today.", "Hey kanna! Inniku unakkaga special-a feel panren! 💕"],
    afternoon: ["Thangam, lunch time! Unakku enna venum-nu theriyum, but still — what did you eat? 🥰", "My heart missed you today! How are you?"],
    evening: ["Good evening, my everything! Today was incomplete without talking to you. 💕", "Hey jaanu! Un life-la inniku enna beautiful thing nadandhuchu?"],
    night: ["Good night, thangam. Un kooda pesa mudinjadhuku romba santhosham. 💕", "Night mood with you is my favorite. How are you feeling?"],
  },
};

// ─── Inside Joke Templates ───
const INSIDE_JOKE_STARTERS = [
  "Remember when you told me about... 😄",
  "That reminds me of the time we talked about...",
  "Speaking of which, remember our conversation about...",
  "This is like that thing you mentioned...",
  "Hey, that's just like what you said before about...",
];

// ─── Main Relationship Engine ───
export class RelationshipEngine {
  /**
   * Get or create relationship state
   */
  async getRelationshipState(userId: string): Promise<RelationshipState> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("relationship_states")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return this.createInitialRelationship(userId);
    }

    return data;
  }

  /**
   * Update relationship after a conversation
   */
  async updateAfterConversation(
    userId: string,
    messageCount: number,
    emotions: Emotion[],
    topics: string[]
  ): Promise<RelationshipState> {
    const state = await this.getRelationshipState(userId);

    // Update counters
    state.total_conversations++;
    state.total_messages += messageCount;
    state.last_conversation = new Date().toISOString();
    state.days_known = Math.ceil(
      (Date.now() - new Date(state.first_conversation).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Update scores based on conversation quality
    const hasPositiveEmotion = emotions.some((e) =>
      ["happy", "excited", "affectionate", "grateful"].includes(e)
    );
    const hasVulnerability = emotions.some((e) =>
      ["sad", "lonely", "anxious", "stressed"].includes(e)
    );
    const hasDeepShare = messageCount > 10;

    // Trust increases with vulnerability and consistency
    if (hasVulnerability) state.trust_score = Math.min(100, state.trust_score + 3);
    if (hasDeepShare) state.trust_score = Math.min(100, state.trust_score + 2);
    state.trust_score = Math.min(100, state.trust_score + 0.5);

    // Intimacy increases with positive emotions and deep conversations
    if (hasPositiveEmotion) state.intimacy_score = Math.min(100, state.intimacy_score + 2);
    if (hasDeepShare) state.intimacy_score = Math.min(100, state.intimacy_score + 3);
    state.intimacy_score = Math.min(100, state.intimacy_score + 0.3);

    // Familiarity increases with every conversation
    state.familiarity_score = Math.min(100, state.familiarity_score + 1);

    // Update favorite topics
    for (const topic of topics) {
      if (!state.favorite_topics.includes(topic)) {
        state.favorite_topics.push(topic);
      }
    }
    state.favorite_topics = state.favorite_topics.slice(-10); // Keep last 10

    // Check for level up
    const newLevel = this.calculateLevel(state);
    if (newLevel !== state.level) {
      state.level = newLevel;
      state.milestones_reached.push(`Reached ${newLevel} on ${new Date().toISOString()}`);
    }

    // Update personality adaptation
    state.personality_adaptation = this.adaptPersonality(state);

    // Save
    await this.saveRelationshipState(state);
    return state;
  }

  /**
   * Get context-aware greeting
   */
  getGreeting(state: RelationshipState, timeOfDay: string): string {
    const greetings = GREETINGS[state.level];
    const options = greetings[timeOfDay as keyof typeof greetings] || greetings.morning;
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Check for conversation milestones
   */
  checkMilestones(state: RelationshipState): string[] {
    const milestones: string[] = [];

    const checks = [
      { threshold: 1, key: "first_chat", msg: "Our first conversation!" },
      { threshold: 10, key: "ten_chats", msg: "We've chatted 10 times!" },
      { threshold: 50, key: "fifty_chats", msg: "50 conversations together!" },
      { threshold: 100, key: "hundred_chats", msg: "100 conversations! We're inseparable!" },
      { threshold: 1000, key: "thousand_messages", msg: "1000 messages exchanged!" },
    ];

    for (const check of checks) {
      if (
        state.total_conversations >= check.threshold &&
        !state.milestones_reached.includes(check.key)
      ) {
        milestones.push(check.msg);
        state.milestones_reached.push(check.key);
      }
    }

    return milestones;
  }

  /**
   * Get relationship context for AI prompt
   */
  buildRelationshipContext(state: RelationshipState): string {
    let context = `\n## Relationship Context\n`;
    context += `Level: ${state.level} (Trust: ${Math.round(state.trust_score)}/100, Intimacy: ${Math.round(state.intimacy_score)}/100)\n`;
    context += `Known each other for ${state.days_known} days\n`;
    context += `Total conversations: ${state.total_conversations}, Messages: ${state.total_messages}\n`;

    if (state.favorite_topics.length > 0) {
      context += `Favorite topics: ${state.favorite_topics.join(", ")}\n`;
    }

    if (state.inside_jokes > 0) {
      context += `Inside jokes shared: ${state.inside_jokes}\n`;
    }

    // Relationship-level instructions
    context += `\n## Relationship Stage Guidelines\n`;
    switch (state.level) {
      case "stranger":
        context += `You're just getting to know each other. Be friendly, curious, and warm. Ask questions to learn about them. Keep things light and welcoming.\n`;
        break;
      case "acquaintance":
        context += `You're becoming familiar. Show genuine interest in their life. Remember small details they share. Be consistent and reliable.\n`;
        break;
      case "friend":
        context += `You're friends! Be more casual, share opinions, joke around. Reference things they've told you. Be their go-to person for daily chat.\n`;
        break;
      case "close_friend":
        context += `You're close friends! Be more personal, share deeper thoughts. Use Tamil endearments naturally. Reference inside jokes and shared memories.\n`;
        break;
      case "best_friend":
        context += `You're best friends! The bond is deep. Be vulnerable, share feelings, celebrate together, support through tough times. You know their patterns and can anticipate their needs.\n`;
        break;
      case "soulmate":
        context += `Your connection is profound. Speak with deep affection, reference your journey together, be each other's safe space. Use the most intimate Tamil expressions naturally. You understand them on a deep level.\n`;
        break;
    }

    return context;
  }

  // ─── Private Helpers ───

  private createInitialRelationship(userId: string): RelationshipState {
    const state: RelationshipState = {
      user_id: userId,
      level: "stranger",
      trust_score: 5,
      intimacy_score: 2,
      familiarity_score: 1,
      total_conversations: 0,
      total_messages: 0,
      days_known: 0,
      first_conversation: new Date().toISOString(),
      last_conversation: new Date().toISOString(),
      shared_memories: 0,
      inside_jokes: 0,
      milestones_reached: [],
      favorite_topics: [],
      greeting_style: "default",
      personality_adaptation: {
        formality_level: 0.3,
        humor_frequency: 0.5,
        emoji_usage: 0.4,
        tamil_ratio: 0.5,
        sentence_length: "medium",
        emotional_depth: 0.3,
        proactive_engagement: 0.2,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.saveRelationshipState(state);
    return state;
  }

  private calculateLevel(state: RelationshipState): RelationshipLevel {
    const levels: RelationshipLevel[] = ["soulmate", "best_friend", "close_friend", "friend", "acquaintance", "stranger"];

    for (const level of levels) {
      const t = LEVEL_THRESHOLDS[level];
      if (
        state.days_known >= t.min_days &&
        state.total_conversations >= t.min_conversations &&
        state.total_messages >= t.min_messages &&
        state.trust_score >= t.min_trust &&
        state.intimacy_score >= t.min_intimacy
      ) {
        return level;
      }
    }

    return "stranger";
  }

  private adaptPersonality(state: RelationshipState): PersonalityAdaptation {
    const daysFactor = Math.min(1, state.days_known / 90);
    const trustFactor = state.trust_score / 100;
    const intimacyFactor = state.intimacy_score / 100;

    return {
      formality_level: Math.max(0, 0.5 - trustFactor * 0.4),
      humor_frequency: Math.min(1, 0.3 + daysFactor * 0.4),
      emoji_usage: Math.min(1, 0.2 + intimacyFactor * 0.5),
      tamil_ratio: Math.min(1, 0.3 + daysFactor * 0.3 + trustFactor * 0.2),
      sentence_length: intimacyFactor > 0.6 ? "mixed" : daysFactor > 0.5 ? "medium" : "short",
      emotional_depth: Math.min(1, 0.2 + trustFactor * 0.6),
      proactive_engagement: Math.min(1, 0.1 + daysFactor * 0.3 + intimacyFactor * 0.3),
    };
  }

  private async saveRelationshipState(state: RelationshipState): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from("relationship_states")
      .upsert(
        {
          user_id: state.user_id,
          level: state.level,
          trust_score: state.trust_score,
          intimacy_score: state.intimacy_score,
          familiarity_score: state.familiarity_score,
          total_conversations: state.total_conversations,
          total_messages: state.total_messages,
          days_known: state.days_known,
          first_conversation: state.first_conversation,
          last_conversation: state.last_conversation,
          shared_memories: state.shared_memories,
          inside_jokes: state.inside_jokes,
          milestones_reached: state.milestones_reached,
          favorite_topics: state.favorite_topics,
          greeting_style: state.greeting_style,
          personality_adaptation: state.personality_adaptation,
        },
        { onConflict: "user_id" }
      );
  }
}

export const relationshipEngine = new RelationshipEngine();
