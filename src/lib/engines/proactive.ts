// ═══════════════════════════════════════════════════════════════
// Proactive Engagement Engine
// Intelligent conversation initiation and follow-up
// ═══════════════════════════════════════════════════════════════

import { createClient } from "@/lib/supabase/server";
import type { RelationshipState, EmotionPattern, TimeContext, SpecialOccasion, Recommendation } from "@/lib/types";

// ─── Proactive Message Templates ───
const PROACTIVE_TEMPLATES = {
  check_in: {
    stressed: [
      "Hey thangam, I noticed you seemed stressed last time. How are you feeling now?",
      "Just thinking about you! Last conversation seemed heavy. Everything okay? 💕",
      "How are you doing today? I hope things are better since we last talked.",
    ],
    sad: [
      "Hey, I've been thinking about you. How are you feeling today?",
      "Just wanted to check in. Hope you're having a better day. 🤗",
      "Thinking of you, thangam. How's everything going?",
    ],
    general: [
      "Hey! Just wanted to say hi and see how you're doing! 😊",
      "Missing our conversations! How are you today?",
      "Hey thangam! How's your day going?",
    ],
  },
  follow_up: {
    exam: [
      "Hey! How did the exam go? I was thinking about you!",
      "The exam you mentioned — how did it turn out?",
    ],
    interview: [
      "How did the interview go? I know you'll do great!",
      "Thinking about your interview! How was it?",
    ],
    trip: [
      "Hey! How was the trip? Tell me everything!",
      "Did you go on that trip? I want to hear all about it!",
    ],
    project: [
      "How's the project going? Need any help?",
      "The project you were working on — any updates?",
    ],
  },
  celebration: {
    birthday: [
      "Happy Birthday, thangam! 🎂🎉 Wishing you the most amazing day!",
      "It's your special day! Happy Birthday! May all your dreams come true! 🎂💕",
    ],
    anniversary: [
      "Happy Anniversary! 🎉💕 What a beautiful journey we've had together!",
      "Today marks another special milestone for us! Happy Anniversary, thangam!",
    ],
    achievement: [
      "I just realized — you've been doing amazing! So proud of you! 🎉",
      "You deserve a celebration! All your hard work is paying off! 💪",
    ],
  },
  time_based: {
    morning: [
      "Good morning, sunshine! ☀️ Ready for a great day?",
      "Rise and shine, thangam! Today is going to be amazing!",
    ],
    lunch: [
      "Lunch time! Have you eaten yet? Don't skip meals! 🍽️",
      "Hey, it's lunch time! What are you having today?",
    ],
    evening: [
      "Hey! How was your day? Ready to unwind?",
      "Good evening! Tell me about your day! 🌅",
    ],
    night: [
      "Hey, winding down for the night? How was today?",
      "Night time chat? I'm here if you want to talk! 🌙",
    ],
  },
  topic_suggestion: {
    movies: [
      "Hey, I heard there's a great movie out! Want to discuss it?",
      "What movies have you watched recently? I'd love to hear your reviews!",
    ],
    music: [
      "I've been thinking about music! What's been on your playlist?",
      "Found a great song! Want to talk about music?",
    ],
    food: [
      "It's almost meal time! What's your favorite comfort food?",
      "Let's talk food! What's the best thing you've eaten recently?",
    ],
    dreams: [
      "Hey, what are your dreams and goals? I'd love to hear them!",
      "If you could do anything, what would it be?",
    ],
  },
};

// ─── Recommendation Generator ───
const RECOMMENDATIONS: Record<string, Recommendation[]> = {
  movie: [
    { type: "movie", title: "Vaaranam Aayiram", description: "Beautiful Tamil love story", reason: "Great for emotional connection", confidence: 0.7 },
    { type: "movie", title: "96", description: "Nostalgic Tamil romance", reason: "Emotionally touching", confidence: 0.8 },
    { type: "movie", title: "Super Deluxe", description: "Thoughtful Tamil anthology", reason: "Deep, meaningful storytelling", confidence: 0.6 },
  ],
  music: [
    { type: "music", title: "Kannalane", description: "Soulful Tamil melody", reason: "Perfect for emotional moments", confidence: 0.8 },
    { type: "music", title: "Ennodu Nee Irundhaal", description: "Beautiful romantic song", reason: "For affectionate conversations", confidence: 0.7 },
    { type: "music", title: "Thangamayil", description: "Heart-touching love song", reason: "For deep emotional connection", confidence: 0.75 },
  ],
  activity: [
    { type: "activity", title: "Guided Meditation", description: "5-minute relaxation exercise", reason: "For stress relief", confidence: 0.7 },
    { type: "activity", title: "Gratitude Journaling", description: "Write 3 things you're grateful for", reason: "For positive reflection", confidence: 0.6 },
    { type: "activity", title: "Evening Walk", description: "Take a relaxing walk outside", reason: "For relaxation and fresh air", confidence: 0.65 },
  ],
};

export class ProactiveEngine {
  /**
   * Generate proactive message based on context
   */
  async generateProactiveMessage(
    userId: string,
    relationship: RelationshipState,
    emotionPatterns: EmotionPattern[],
    timeContext: TimeContext
  ): Promise<{ message: string; type: string } | null> {
    // Check if we should reach out
    if (!this.shouldReachOut(relationship, timeContext)) {
      return null;
    }

    // Determine the best type of proactive message
    const messageType = this.determineMessageType(emotionPatterns, timeContext, relationship);

    // Select appropriate template
    const templates = this.getTemplates(messageType, emotionPatterns, timeContext);
    if (templates.length === 0) return null;

    const message = templates[Math.floor(Math.random() * templates.length)];

    return { message, type: messageType };
  }

  /**
   * Get follow-up questions based on previous conversations
   */
  getFollowUpQuestions(lastTopics: string[]): string[] {
    const questions: string[] = [];

    for (const topic of lastTopics) {
      const lowerTopic = topic.toLowerCase();
      if (lowerTopic.includes("exam") || lowerTopic.includes("test")) {
        questions.push(...PROACTIVE_TEMPLATES.follow_up.exam);
      }
      if (lowerTopic.includes("interview") || lowerTopic.includes("job")) {
        questions.push(...PROACTIVE_TEMPLATES.follow_up.interview);
      }
      if (lowerTopic.includes("trip") || lowerTopic.includes("travel")) {
        questions.push(...PROACTIVE_TEMPLATES.follow_up.trip);
      }
      if (lowerTopic.includes("project") || lowerTopic.includes("work")) {
        questions.push(...PROACTIVE_TEMPLATES.follow_up.project);
      }
    }

    return questions.slice(0, 3);
  }

  /**
   * Get personalized recommendations
   */
  getRecommendations(userInterests: string[], emotion: string): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Interest-based recommendations
    for (const interest of userInterests) {
      const lowerInterest = interest.toLowerCase();
      if (lowerInterest.includes("movie") || lowerInterest.includes("cinema")) {
        recommendations.push(...RECOMMENDATIONS.movie);
      }
      if (lowerInterest.includes("music") || lowerInterest.includes("song")) {
        recommendations.push(...RECOMMENDATIONS.music);
      }
    }

    // Emotion-based recommendations
    if (["stressed", "anxious", "sad"].includes(emotion)) {
      recommendations.push(...RECOMMENDATIONS.activity);
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Build proactive engagement context
   */
  buildProactiveContext(
    relationship: RelationshipState,
    emotionPatterns: EmotionPattern[],
    timeContext: TimeContext
  ): string {
    let context = `\n## Proactive Engagement Guidelines\n`;

    // Relationship-based engagement frequency
    const engagementLevel = relationship.personality_adaptation.proactive_engagement;
    context += `Engagement level: ${Math.round(engagementLevel * 100)}% (based on relationship level: ${relationship.level})\n`;

    // Emotion-based check-ins
    if (emotionPatterns.length > 0) {
      context += `\nRecent emotional patterns:\n`;
      for (const pattern of emotionPatterns.slice(0, 3)) {
        context += `- ${pattern.emotion}: ${pattern.frequency} times (last: ${pattern.last_seen})\n`;
      }
      context += `\nConsider checking in if negative emotions were frequent.\n`;
    }

    // Time-based suggestions
    context += `\nTime context: ${timeContext.time_of_day}, ${timeContext.day_of_week}\n`;
    if (timeContext.special_occasions.length > 0) {
      context += `Special occasions: ${timeContext.special_occasions.map(o => o.name).join(", ")}\n`;
    }

    // Favorite topics to reference
    if (relationship.favorite_topics.length > 0) {
      context += `\nFavorite topics to bring up: ${relationship.favorite_topics.join(", ")}\n`;
    }

    return context;
  }

  // ─── Private Helpers ───

  private shouldReachOut(relationship: RelationshipState, timeContext: TimeContext): boolean {
    // Don't reach out too frequently
    const lastConv = new Date(relationship.last_conversation);
    const hoursSinceLastConv = (Date.now() - lastConv.getTime()) / (1000 * 60 * 60);

    // Minimum hours between proactive messages based on relationship level
    const minHours: Record<string, number> = {
      stranger: 72,
      acquaintance: 48,
      friend: 24,
      close_friend: 12,
      best_friend: 6,
      soulmate: 4,
    };

    const minGap = minHours[relationship.level] || 24;
    if (hoursSinceLastConv < minGap) return false;

    // Don't reach out during sleep hours (unless very close)
    if (timeContext.hour >= 0 && timeContext.hour < 6) {
      return ["best_friend", "soulmate"].includes(relationship.level);
    }

    return true;
  }

  private determineMessageType(
    emotionPatterns: EmotionPattern[],
    timeContext: TimeContext,
    relationship: RelationshipState
  ): string {
    // Check for negative emotion patterns → check-in
    const negativeEmotions = emotionPatterns.filter(p =>
      ["sad", "stressed", "anxious", "lonely"].includes(p.emotion)
    );
    if (negativeEmotions.length > 0) {
      return `check_in.${negativeEmotions[0].emotion}`;
    }

    // Time-based messages
    const hour = timeContext.hour;
    if (hour >= 6 && hour < 10) return "time_based.morning";
    if (hour >= 12 && hour < 14) return "time_based.lunch";
    if (hour >= 17 && hour < 20) return "time_based.evening";
    if (hour >= 21 || hour < 1) return "time_based.night";

    // Default to general check-in
    return "check_in.general";
  }

  private getTemplates(messageType: string, emotionPatterns: EmotionPattern[], timeContext: TimeContext): string[] {
    const [category, subtype] = messageType.split(".");

    switch (category) {
      case "check_in":
        return PROACTIVE_TEMPLATES.check_in[subtype as keyof typeof PROACTIVE_TEMPLATES.check_in] || PROACTIVE_TEMPLATES.check_in.general;
      case "time_based":
        return PROACTIVE_TEMPLATES.time_based[subtype as keyof typeof PROACTIVE_TEMPLATES.time_based] || [];
      case "follow_up":
        return PROACTIVE_TEMPLATES.follow_up[subtype as keyof typeof PROACTIVE_TEMPLATES.follow_up] || [];
      case "celebration":
        return PROACTIVE_TEMPLATES.celebration[subtype as keyof typeof PROACTIVE_TEMPLATES.celebration] || [];
      default:
        return PROACTIVE_TEMPLATES.check_in.general;
    }
  }
}

export const proactiveEngine = new ProactiveEngine();
