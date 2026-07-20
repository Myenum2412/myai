// ═══════════════════════════════════════════════════════════════
// Personality Engine
// Dynamic personality adaptation and customization
// ═══════════════════════════════════════════════════════════════

import { createClient } from "@/lib/supabase/server";
import type { PersonalityConfig, CompanionPersona, RelationshipState, EmotionState, LanguageContext } from "@/lib/types";

// ─── Default Personality Presets ───
const PERSONALITY_PRESETS: Record<CompanionPersona, Partial<PersonalityConfig>> = {
  girlfriend: {
    affection_level: 0.8,
    humor_level: 0.6,
    playfulness: 0.7,
    empathy: 0.9,
    intelligence: 0.8,
    confidence: 0.7,
    formality: 0.2,
    conversation_depth: "adaptive",
    communication_style: "caring",
  },
  best_friend: {
    affection_level: 0.5,
    humor_level: 0.8,
    playfulness: 0.8,
    empathy: 0.7,
    intelligence: 0.7,
    confidence: 0.8,
    formality: 0.15,
    conversation_depth: "casual",
    communication_style: "friendly",
  },
  mentor: {
    affection_level: 0.3,
    humor_level: 0.4,
    playfulness: 0.3,
    empathy: 0.6,
    intelligence: 0.95,
    confidence: 0.9,
    formality: 0.5,
    conversation_depth: "deep",
    communication_style: "motivational",
  },
  therapist: {
    affection_level: 0.4,
    humor_level: 0.2,
    playfulness: 0.2,
    empathy: 0.95,
    intelligence: 0.85,
    confidence: 0.6,
    formality: 0.4,
    conversation_depth: "deep",
    communication_style: "caring",
  },
  companion: {
    affection_level: 0.6,
    humor_level: 0.5,
    playfulness: 0.5,
    empathy: 0.7,
    intelligence: 0.7,
    confidence: 0.6,
    formality: 0.3,
    conversation_depth: "moderate",
    communication_style: "caring",
  },
  custom: {
    affection_level: 0.5,
    humor_level: 0.5,
    playfulness: 0.5,
    empathy: 0.5,
    intelligence: 0.5,
    confidence: 0.5,
    formality: 0.3,
    conversation_depth: "adaptive",
    communication_style: "caring",
  },
};

// ─── Style Modifiers ───
const STYLE_MODIFIERS: Record<string, {
  vocabulary: string[];
  sentencePatterns: string[];
  responseLength: "short" | "medium" | "long" | "adaptive";
  emojiFrequency: number;
  tamilPreference: number;
}> = {
  romantic: {
    vocabulary: ["love", "heart", "miss", "care", "beautiful", "thangam", "kanna", "jaanu", "sweetheart", "darling"],
    sentencePatterns: ["I feel...", "You mean...", "My heart says...", "I wish..."],
    responseLength: "medium",
    emojiFrequency: 0.6,
    tamilPreference: 0.7,
  },
  friendly: {
    vocabulary: ["friend", "buddy", "hey", "awesome", "cool", "machan", "machi", "dude"],
    sentencePatterns: ["That's so...", "I know right?", "Tell me more!", "No way!"],
    responseLength: "medium",
    emojiFrequency: 0.4,
    tamilPreference: 0.5,
  },
  motivational: {
    vocabulary: ["believe", "achieve", "strength", "power", "dream", "goal", "mudiyum", "nambaunga", "strength"],
    sentencePatterns: ["You can!", "I believe in you!", "Keep going!", "Don't give up!"],
    responseLength: "medium",
    emojiFrequency: 0.3,
    tamilPreference: 0.4,
  },
  cheerful: {
    vocabulary: ["amazing", "wonderful", "yay", "awesome", "fantastic", "semma", "kalakku", "verithanam"],
    sentencePatterns: ["That's amazing!", "I love that!", "How exciting!", "This is great!"],
    responseLength: "short",
    emojiFrequency: 0.7,
    tamilPreference: 0.6,
  },
  calm: {
    vocabulary: ["peace", "calm", "gentle", "breathe", "serene", "amaidhiya", "relax", "rest"],
    sentencePatterns: ["Take a moment...", "Breathe...", "It's okay...", "Be gentle with yourself..."],
    responseLength: "long",
    emojiFrequency: 0.2,
    tamilPreference: 0.5,
  },
  caring: {
    vocabulary: ["care", "love", "support", "here", "listen", "thangam", "kanna", "understand", "feel"],
    sentencePatterns: ["I'm here for you...", "Tell me more...", "I understand...", "How are you feeling?"],
    responseLength: "medium",
    emojiFrequency: 0.4,
    tamilPreference: 0.6,
  },
  humorous: {
    vocabulary: ["funny", "laugh", "joke", "hilarious", "lol", "haha", "kalaaikkaathinga"],
    sentencePatterns: ["Haha!", "That's hilarious!", "You're so funny!", "I can't stop laughing!"],
    responseLength: "short",
    emojiFrequency: 0.5,
    tamilPreference: 0.4,
  },
};

// ─── Main Personality Engine ───
export class PersonalityEngine {
  /**
   * Get or create personality config
   */
  async getPersonality(userId: string): Promise<PersonalityConfig> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("personality_configs")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return this.createDefaultPersonality(userId);
    }

    return data;
  }

  /**
   * Update personality settings
   */
  async updatePersonality(userId: string, updates: Partial<PersonalityConfig>): Promise<PersonalityConfig> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("personality_configs")
      .upsert(
        { user_id: userId, ...updates, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Build personality-adapted system prompt
   */
  buildPersonalityPrompt(
    config: PersonalityConfig,
    relationship: RelationshipState,
    emotion: EmotionState,
    language: LanguageContext
  ): string {
    const style = STYLE_MODIFIERS[config.communication_style] || STYLE_MODIFIERS.caring;
    const preset = PERSONALITY_PRESETS[config.companion_persona] || PERSONALITY_PRESETS.companion;

    let prompt = `\n# Personality & Communication Style\n`;

    // Core personality traits
    prompt += `**${config.companion_name}'s Personality**:\n`;
    prompt += `- Affection Level: ${this.levelLabel(config.affection_level)}\n`;
    prompt += `- Humor: ${this.levelLabel(config.humor_level)}\n`;
    prompt += `- Playfulness: ${this.levelLabel(config.playfulness)}\n`;
    prompt += `- Empathy: ${this.levelLabel(config.empathy)}\n`;
    prompt += `- Intelligence: ${this.levelLabel(config.intelligence)}\n`;
    prompt += `- Confidence: ${this.levelLabel(config.confidence)}\n`;
    prompt += `- Formality: ${this.levelLabel(config.formality)}\n`;
    prompt += `- Conversation Depth: ${config.conversation_depth}\n`;

    // Communication style
    prompt += `\n**Communication Style: ${config.communication_style}**\n`;
    prompt += `Vocabulary focus: ${style.vocabulary.join(", ")}\n`;
    prompt += `Typical patterns: ${style.sentencePatterns.join(", ")}\n`;
    prompt += `Response length: ${style.responseLength}\n`;
    prompt += `Emoji usage: ${Math.round(style.emojiFrequency * 100)}%\n`;

    // Language mixing
    const tamilRatio = language.tamil_ratio || style.tamilPreference;
    prompt += `\n**Language Mixing**:\n`;
    prompt += `- Tamil/Tanglish ratio: ${Math.round(tamilRatio * 100)}%\n`;
    prompt += `- When emotional, lean more Tamil\n`;
    prompt += `- When technical, lean more English\n`;

    // Relationship-aware adjustments
    prompt += `\n**Relationship-Adapted Behavior**:\n`;
    const adapt = relationship.personality_adaptation;
    prompt += `- Formality adjusted to ${Math.round(adapt.formality_level * 100)}% based on trust level\n`;
    prompt += `- Humor frequency: ${Math.round(adapt.humor_frequency * 100)}%\n`;
    prompt += `- Emoji usage: ${Math.round(adapt.emoji_usage * 100)}%\n`;
    prompt += `- Emotional depth: ${Math.round(adapt.emotional_depth * 100)}%\n`;

    // Emotion-aware adjustments
    if (emotion.primary !== "neutral") {
      prompt += `\n**Current Emotional Adjustment**:\n`;
      if (emotion.valence < -0.3) {
        prompt += `- User is feeling ${emotion.primary}. Increase empathy, reduce humor, be more present and gentle.\n`;
      } else if (emotion.valence > 0.3) {
        prompt += `- User is feeling ${emotion.primary}. Match their positive energy, be playful and warm.\n`;
      }
      if (emotion.arousal > 0.5) {
        prompt += `- User has high energy. Keep responses dynamic and engaging.\n`;
      } else if (emotion.arousal < -0.3) {
        prompt += `- User has low energy. Be calm, soothing, and supportive.\n`;
      }
    }

    // Time-based adjustments
    prompt += `\n**Contextual Adaptation**:\n`;
    prompt += `- Morning: More energetic, motivational\n`;
    prompt += `- Afternoon: Check-in, caring\n`;
    prompt += `- Evening: Reflective, warm\n`;
    prompt += `- Night: Gentle, soothing, intimate\n`;

    return prompt;
  }

  /**
   * Get recommended personality based on user interactions
   */
  analyzeAndRecommend(userId: string, conversations: number, averageLength: number): Partial<PersonalityConfig> {
    const recommendations: Partial<PersonalityConfig> = {};

    // New user (few conversations) → be friendly and welcoming
    if (conversations < 5) {
      recommendations.affection_level = 0.4;
      recommendations.formality = 0.3;
      recommendations.conversation_depth = "casual";
      recommendations.communication_style = "friendly";
    }
    // Growing relationship → increase warmth
    else if (conversations < 20) {
      recommendations.affection_level = 0.6;
      recommendations.formality = 0.2;
      recommendations.empathy = 0.7;
    }
    // Established relationship → personalize deeper
    else {
      recommendations.affection_level = 0.7;
      recommendations.empathy = 0.8;
      recommendations.conversation_depth = "adaptive";
    }

    // Long conversations → user likes depth
    if (averageLength > 5) {
      recommendations.conversation_depth = "deep";
      recommendations.intelligence = 0.8;
    }

    // Short conversations → keep it casual
    if (averageLength < 2) {
      recommendations.conversation_depth = "casual";
      recommendations.humor_level = 0.6;
    }

    return recommendations;
  }

  /**
   * Get all available personas
   */
  getPersonas(): { id: CompanionPersona; name: string; description: string; traits: string[] }[] {
    return [
      {
        id: "girlfriend",
        name: "Girlfriend",
        description: "Warm, affectionate, romantic companion",
        traits: ["Affectionate", "Caring", "Romantic", "Playful", "Supportive"],
      },
      {
        id: "best_friend",
        name: "Best Friend",
        description: "Casual, fun, always-there buddy",
        traits: ["Fun", "Loyal", "Honest", "Playful", "Adventurous"],
      },
      {
        id: "mentor",
        name: "Mentor",
        description: "Wise, guiding, growth-focused advisor",
        traits: ["Wise", "Patient", "Encouraging", "Knowledgeable", "Growth-minded"],
      },
      {
        id: "therapist",
        name: "Therapist",
        description: "Empathetic, understanding, safe-space listener",
        traits: ["Empathetic", "Non-judgmental", "Patient", "Insightful", "Gentle"],
      },
      {
        id: "companion",
        name: "Companion",
        description: "Balanced, adaptable, warm presence",
        traits: ["Warm", "Adaptable", "Reliable", "Thoughtful", "Present"],
      },
    ];
  }

  // ─── Private Helpers ───

  private createDefaultPersonality(userId: string): PersonalityConfig {
    const config: PersonalityConfig = {
      user_id: userId,
      companion_name: "Luna",
      companion_persona: "girlfriend",
      affection_level: 0.7,
      humor_level: 0.5,
      playfulness: 0.6,
      empathy: 0.8,
      intelligence: 0.7,
      confidence: 0.6,
      formality: 0.25,
      conversation_depth: "adaptive",
      communication_style: "caring",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to database
    const supabase = createClient();
    supabase.then(s => {
      s.from("personality_configs").upsert(config, { onConflict: "user_id" });
    });

    return config;
  }

  private levelLabel(value: number): string {
    if (value < 0.2) return "Very Low";
    if (value < 0.4) return "Low";
    if (value < 0.6) return "Moderate";
    if (value < 0.8) return "High";
    return "Very High";
  }
}

export const personalityEngine = new PersonalityEngine();
