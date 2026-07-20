// ═══════════════════════════════════════════════════════════════
// Companion Scheduler Engine
// Intelligent proactive engagement and scheduling
// ═══════════════════════════════════════════════════════════════

import { createClient } from "@/lib/supabase/server";
import type { RelationshipState, EmotionPattern, TimeContext } from "@/lib/types";
import type { Goal } from "./cognitive-context";

export interface ScheduledMessage {
  id: string;
  user_id: string;
  type: "check_in" | "follow_up" | "celebration" | "motivation" | "wellness" | "seasonal" | "topic" | "goal";
  message: string;
  scheduled_for: string;
  sent: boolean;
  priority: number; // 1-10
  context: Record<string, unknown>;
}

export interface SchedulerConfig {
  check_in_frequency: "minimal" | "normal" | "frequent";
  quiet_hours_start: number; // 0-23
  quiet_hours_end: number; // 0-23
  max_daily_proactive: number;
  enabled: boolean;
}

// ─── Message Templates ───
const TEMPLATES = {
  check_in: {
    morning: [
      "Good morning, thangam! ☀️ Inniku epdi feel panringa?",
      "Rise and shine! Today is going to be amazing! 🌟",
      "Hey! Ready to take on the day? I'm here if you need anything!",
    ],
    afternoon: [
      "Hey thangam! Lunch saaptengala? 🍽️",
      "Just checking in! How's your day going?",
      "Afternoon vibes! Everything going well?",
    ],
    evening: [
      "Good evening! Inniku day epdi pochu? Tell me everything! 🌅",
      "Hey! Time to unwind. How was your day?",
      "Evening chat? I'm all ears! 💕",
    ],
    night: [
      "Hey, winding down? How was today? 🌙",
      "Night chat? I'm here if you want to talk!",
      "Time to relax! Tell me about your day.",
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
      "It's your special day! Happy Birthday! 🎂💕",
    ],
    anniversary: [
      "Happy Anniversary! 🎉💕 What a beautiful journey!",
    ],
    achievement: [
      "I just realized — you've been doing amazing! So proud of you! 🎉",
      "You deserve a celebration! All your hard work is paying off! 💪",
    ],
  },
  wellness: [
    "Hey thangam! Have you drank water today? 💧",
    "Quick reminder: take a screen break! Your eyes need rest. 👀",
    "How's your posture? Sit up straight! 😊",
    "Time for a stretch break! Your body will thank you. 🧘",
    "Have you eaten well today? Don't skip meals! 🍽️",
  ],
  motivation: [
    "Hey! Just wanted to remind you — you're doing amazing! 🔥",
    "Remember: you're capable of incredible things! 💪",
    "Today is a new opportunity to shine! 🌟",
    "I believe in you, thangam! Keep going! ❤️",
  ],
  seasonal: {
    summer: [
      "It's hot today! Stay hydrated! 💧",
      "Summer vibes! Perfect for something cold! 🍦",
    ],
    monsoon: [
      "It's raining! Stay safe and dry! ☔",
      "Monsoon mood! Perfect for chai and conversations! ☕",
    ],
    winter: [
      "It's cold! Stay warm, thangam! 🧣",
      "Winter vibes! Perfect for cozy conversations! ☕",
    ],
    spring: [
      "Spring is beautiful! Enjoy the weather! 🌸",
      "New season, new beginnings! 🌱",
    ],
  },
};

export class SchedulerEngine {
  private config: SchedulerConfig = {
    check_in_frequency: "normal",
    quiet_hours_start: 23,
    quiet_hours_end: 7,
    max_daily_proactive: 3,
    enabled: true,
  };

  /**
   * Get scheduled messages for a user
   */
  async getScheduledMessages(userId: string): Promise<ScheduledMessage[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("scheduled_messages")
      .select("*")
      .eq("user_id", userId)
      .eq("sent", false)
      .lte("scheduled_for", new Date().toISOString())
      .order("priority", { ascending: false })
      .limit(5);

    return (data || []) as ScheduledMessage[];
  }

  /**
   * Schedule a proactive message
   */
  async scheduleMessage(
    userId: string,
    type: ScheduledMessage["type"],
    message: string,
    scheduledFor: Date,
    priority: number = 5,
    context: Record<string, unknown> = {}
  ): Promise<void> {
    const supabase = await createClient();
    await supabase.from("scheduled_messages").insert({
      user_id: userId,
      type,
      message,
      scheduled_for: scheduledFor.toISOString(),
      sent: false,
      priority,
      context,
    });
  }

  /**
   * Generate smart proactive messages based on context
   */
  async generateProactiveMessages(
    userId: string,
    relationship: RelationshipState,
    emotionPatterns: EmotionPattern[],
    goals: Goal[],
    timeContext: TimeContext
  ): Promise<string[]> {
    if (!this.config.enabled) return [];

    const messages: string[] = [];
    const hour = timeContext.hour;

    // Check if within quiet hours
    if (this.isQuietHour(hour)) return [];

    // Check daily limit
    const todayMessages = await this.getTodayMessageCount(userId);
    if (todayMessages >= this.config.max_daily_proactive) return [];

    // Morning check-in
    if (hour >= 7 && hour < 10) {
      const template = this.randomFrom(TEMPLATES.check_in.morning);
      messages.push(template);
    }

    // Emotion-based check-in
    const negativePattern = emotionPatterns.find((p) =>
      ["sad", "stressed", "anxious"].includes(p.emotion) && p.frequency > 3
    );
    if (negativePattern) {
      messages.push("Hey, I've been thinking about you. How are you feeling today? 💕");
    }

    // Goal check-in
    const activeGoal = goals.find((g) => g.status === "active" && g.progress < 100);
    if (activeGoal && Math.random() > 0.7) {
      messages.push(`Hey! How's "${activeGoal.title}" going? ${activeGoal.progress}% done! Keep pushing! 💪`);
    }

    // Wellness check
    if (hour >= 12 && hour < 14 && Math.random() > 0.6) {
      messages.push(this.randomFrom(TEMPLATES.wellness));
    }

    // Motivation
    if (hour >= 8 && hour < 10 && Math.random() > 0.7) {
      messages.push(this.randomFrom(TEMPLATES.motivation));
    }

    // Seasonal
    const seasonTemplate = TEMPLATES.seasonal[timeContext.season];
    if (seasonTemplate && Math.random() > 0.8) {
      messages.push(this.randomFrom(seasonTemplate));
    }

    return messages.slice(0, this.config.max_daily_proactive - todayMessages);
  }

  /**
   * Build scheduler context for the AI
   */
  buildSchedulerContext(
    relationship: RelationshipState,
    goals: Goal[],
    emotionPatterns: EmotionPattern[]
  ): string {
    let context = `\n## Proactive Engagement\n`;
    context += `Engagement level: ${Math.round(relationship.personality_adaptation.proactive_engagement * 100)}%\n`;

    if (goals.length > 0) {
      context += `Active goals to check in on: ${goals.filter((g) => g.status === "active").map((g) => g.title).join(", ")}\n`;
    }

    if (emotionPatterns.length > 0) {
      const negativePatterns = emotionPatterns.filter((p) =>
        ["sad", "stressed", "anxious"].includes(p.emotion)
      );
      if (negativePatterns.length > 0) {
        context += `Consider checking in: user has shown ${negativePatterns.map((p) => p.emotion).join(", ")} patterns\n`;
      }
    }

    return context;
  }

  private isQuietHour(hour: number): boolean {
    if (this.config.quiet_hours_start > this.config.quiet_hours_end) {
      return hour >= this.config.quiet_hours_start || hour < this.config.quiet_hours_end;
    }
    return hour >= this.config.quiet_hours_start && hour < this.config.quiet_hours_end;
  }

  private async getTodayMessageCount(userId: string): Promise<number> {
    const supabase = await createClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("scheduled_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("sent", true)
      .gte("scheduled_for", today.toISOString());

    return count || 0;
  }

  private randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

export const schedulerEngine = new SchedulerEngine();
