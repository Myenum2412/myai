// ═══════════════════════════════════════════════════════════════
// Goal & Life Planning Engine
// Tracks ambitions, habits, milestones, and progress
// ═══════════════════════════════════════════════════════════════

import { createClient } from "@/lib/supabase/server";
import type { Goal, Habit } from "./cognitive-context";

export class GoalEngine {
  /**
   * Get all goals for a user
   */
  async getGoals(userId: string): Promise<{ active: Goal[]; completed: Goal[] }> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const goals = (data || []) as Goal[];
    return {
      active: goals.filter((g) => g.status === "active"),
      completed: goals.filter((g) => g.status === "completed"),
    };
  }

  /**
   * Create a new goal
   */
  async createGoal(userId: string, goal: Partial<Goal>): Promise<Goal> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_goals")
      .insert({
        user_id: userId,
        title: goal.title,
        category: goal.category || "personal",
        target_date: goal.target_date,
        progress: 0,
        status: "active",
        milestones: goal.milestones || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update goal progress
   */
  async updateProgress(userId: string, goalId: string, progress: number): Promise<void> {
    const supabase = await createClient();
    const updates: Record<string, unknown> = {
      progress: Math.min(100, Math.max(0, progress)),
      last_checked: new Date().toISOString(),
    };

    if (progress >= 100) {
      updates.status = "completed";
    }

    await supabase
      .from("user_goals")
      .update(updates)
      .eq("id", goalId)
      .eq("user_id", userId);
  }

  /**
   * Build goal context for AI prompt
   */
  buildGoalContext(goals: Goal[], habits: Habit[]): string {
    let context = "";

    if (goals.length > 0) {
      context += `\n## Goals & Progress\n`;
      for (const goal of goals.slice(0, 5)) {
        context += `- ${goal.title} (${goal.category}): ${goal.progress}% complete`;
        if (goal.target_date) context += ` — target: ${goal.target_date}`;
        context += "\n";
      }
    }

    if (habits.length > 0) {
      context += `\n## Habits & Streaks\n`;
      for (const habit of habits.slice(0, 5)) {
        context += `- ${habit.name}: ${habit.current_streak} day streak (best: ${habit.best_streak})\n`;
      }
    }

    return context;
  }

  /**
   * Generate progress encouragement
   */
  getEncouragement(goal: Goal): string {
    if (goal.progress >= 100) {
      return `Congratulations! You've completed "${goal.title}"! 🎉`;
    }
    if (goal.progress >= 75) {
      return `Almost there with "${goal.title}"! ${goal.progress}% done — keep pushing! 💪`;
    }
    if (goal.progress >= 50) {
      return `Halfway through "${goal.title}"! You're doing great! 🔥`;
    }
    if (goal.progress >= 25) {
      return `Good progress on "${goal.title}"! ${goal.progress}% complete. Keep going! 🌟`;
    }
    return `Just started "${goal.title}"! Every journey begins with a single step. 🚀`;
  }
}

export const goalEngine = new GoalEngine();
