// ═══════════════════════════════════════════════════════════════
// Emotion Reasoning Engine
// Detects, analyzes, and responds to emotional states
// ═══════════════════════════════════════════════════════════════

import type { Emotion, EmotionState, EmotionPattern } from "@/lib/types";

// ─── Lexicon-Based Emotion Detection ───
const EMOTION_LEXICON: Record<Emotion, { words: string[]; weight: number }[]> = {
  happy: [
    { words: ["happy", "great", "wonderful", "amazing", "love", "blessed", "grateful", "thankful", "excited", "thrilled", "santhosham", "happy", "nice", "beautiful", "perfect", "best"], weight: 1 },
    { words: ["good", "fine", "well", "okay", "alright", "nalla", "sera"], weight: 0.5 },
  ],
  sad: [
    { words: ["sad", "depressed", "lonely", "crying", "tears", "miss", "heartbreak", "pain", "hurt", "broken", "kadichirukku", "thukkama", "bad-aa", "worst", "empty", "hopeless"], weight: 1 },
    { words: ["down", "low", "tired", "exhausted", "drained", "mood", "irukku"], weight: 0.6 },
  ],
  excited: [
    { words: ["excited", "amazing", "awesome", "incredible", "wow", "omg", "semm", "kalakku", "verithanam", "celebrate", "party", "yay"], weight: 1 },
    { words: ["new", "first", "finally", "cant wait", "looking forward"], weight: 0.7 },
  ],
  stressed: [
    { words: ["stressed", "pressure", "deadline", "overwhelmed", "anxious", "worried", "nervous", "panic", "tension", "bayama"], weight: 1 },
    { words: ["busy", "rush", "late", "behind", "behind"], weight: 0.6 },
  ],
  frustrated: [
    { words: ["frustrated", "annoyed", "angry", "mad", "hate", "unfair", "stupid", "irritation", "kadichirukku", "irritate"], weight: 1 },
    { words: ["again", "always", "never", "nothing works"], weight: 0.7 },
  ],
  lonely: [
    { words: ["lonely", "alone", "nobody", "no one", "empty", "silent", "bored", "yarum illa", "single"], weight: 1 },
    { words: ["wish", "someone", "company", "together"], weight: 0.6 },
  ],
  confident: [
    { words: ["confident", "sure", "definitely", "absolutely", "can do", "will do", "mudiyum", "nambaunga"], weight: 1 },
    { words: ["ready", "prepared", "strong", "capable"], weight: 0.7 },
  ],
  sarcastic: [
    { words: ["sure", "right", "yeah right", "obviously", "clearly", "duh", "whatever", "as if"], weight: 0.8 },
    { words: ["totally", "of course", "brilliant"], weight: 0.5 },
  ],
  humorous: [
    { words: ["lol", "haha", "funny", "joke", "laugh", "rofl", "lmao", "kalaaikkaathinga"], weight: 1 },
    { words: ["silly", "ridiculous", "absurd", "hilarious"], weight: 0.7 },
  ],
  affectionate: [
    { words: ["love", "miss you", "care", "sweet", "darling", "thangam", "kanna", "jaanu", "baby", "honey"], weight: 1 },
    { words: ["miss", "thinking of you", "you mean"], weight: 0.8 },
  ],
  uncertain: [
    { words: ["maybe", "perhaps", "not sure", "don't know", "confused", "unsure", "uncertain"], weight: 1 },
    { words: ["think", "probably", "might", "guess"], weight: 0.5 },
  ],
  calm: [
    { words: ["calm", "peaceful", "relaxed", "serene", "chill", "fine", "okay", "amaidhiya"], weight: 1 },
    { words: ["breath", "meditate", "rest", "quiet"], weight: 0.6 },
  ],
  angry: [
    { words: ["angry", "furious", "rage", "hate", "kill", "destroy", "fed up", "sakkanom"], weight: 1 },
    { words: ["upset", "mad", "pissed"], weight: 0.7 },
  ],
  anxious: [
    { words: ["anxious", "worried", "scared", "afraid", "nervous", "panic", "terrified", "bayama"], weight: 1 },
    { words: ["what if", "hope not", "worst case"], weight: 0.6 },
  ],
  nostalgic: [
    { words: ["remember", "used to", "back then", "those days", "memories", "old times", "yaad"], weight: 1 },
    { words: ["childhood", "school", "college", "first time"], weight: 0.7 },
  ],
  grateful: [
    { words: ["thank", "grateful", "appreciate", "blessed", "lucky", "nandri"], weight: 1 },
    { words: ["kind", "generous", "helpful"], weight: 0.6 },
  ],
  neutral: [
    { words: ["ok", "okay", "fine", "alright", "sure", "yes", "no"], weight: 0.3 },
  ],
};

// ─── Emoji/Symbol Emotion Mapping ───
const EMOJI_EMOTIONS: Record<string, Emotion[]> = {
  "😊": ["happy"], "😄": ["happy", "excited"], "🥰": ["affectionate"], "😍": ["affectionate"],
  "😢": ["sad"], "😭": ["sad"], "💔": ["sad"], "😔": ["sad", "lonely"],
  "😤": ["frustrated", "angry"], "😡": ["angry"], "🤬": ["angry"],
  "😰": ["anxious", "stressed"], "😨": ["anxious"], "😱": ["anxious"],
  "😂": ["humorous"], "🤣": ["humorous"], "😏": ["sarcastic"],
  "🔥": ["excited", "confident"], "💪": ["confident"], "🎉": ["excited"],
  "❤️": ["affectionate"], "💕": ["affectionate"],
  "🙏": ["grateful"], "✨": ["happy", "grateful"],
  "😴": ["calm"], "🧘": ["calm"], "😌": ["calm"],
};

// ─── Tamil Emotion Patterns ───
const TAMIL_EMOTION_PATTERNS: Record<Emotion, string[]> = {
  happy: ["santhosham", "happy-aa", "nalla", "semma", "kalakku", "verithanam"],
  sad: ["kadichirukku", "thukkama", "bad-aa", "worst", "irukku", "romba bad"],
  excited: ["semma", "kalakku", "verithanam", "bayangara", "mass"],
  stressed: ["tension", "pressure", "bayama", "stress", "worry"],
  frustrated: ["kadichirukku", "irritation", "irritate", "evlo"],
  lonely: ["yarum illa", "single", "alone", "bore-aa"],
  confident: ["mudiyum", "nambaunga", "naan seiyven", "pakiren"],
  sarcastic: ["aama", "avlothaan", "seri", "fine"],
  humorous: ["kalaaikkaathinga", "joke-aa", "funny"],
  affectionate: ["thangam", "kanna", "jaanu", "en kanna", "unakku"],
  uncertain: ["yaaro", "yena", "illa", "theriyala"],
  calm: ["amaidhiya", "peaceful", "relax", "deep breath"],
  angry: ["sakkanom", "kadichirukku", "enna maari"],
  anxious: ["bayama", "scared", "worried"],
  nostalgic: ["yaad", "old times", "remember", "memories"],
  grateful: ["nandri", "thank you", "appreciate"],
  neutral: ["seri", "ok", "fine", "aama", "illa"],
};

// ─── Response Tone Templates ───
const RESPONSE_TONE: Record<Emotion, { prefix: string[]; suffix: string[]; style: string }> = {
  happy: {
    prefix: ["That's wonderful!", "So glad to hear!", "That makes me happy too!", "Yay!"],
    suffix: ["Keep smiling! 😊", "Your happiness is contagious!", "Love hearing this!"],
    style: "warm, upbeat, matching their positive energy",
  },
  sad: {
    prefix: ["I'm here for you, thangam.", "I hear you.", "That sounds really tough."],
    suffix: ["I'm not going anywhere. 💕", "Take your time, I'm here.", "You don't have to face this alone."],
    style: "gentle, validating, patient, present",
  },
  excited: {
    prefix: ["OMG YES!", "Semma!", "That's amazing!", "I'm so excited for you!"],
    suffix: ["This is incredible! 🔥", "You deserve this!", "Tell me everything!"],
    style: "matching their high energy, enthusiastic, celebratory",
  },
  stressed: {
    prefix: ["Take a deep breath, thangam.", "I can feel the pressure.", "Let's work through this together."],
    suffix: ["One step at a time. 🤗", "You've got this, and I'm here.", "Nothing is worth your peace of mind."],
    style: "calming, supportive, practical, grounding",
  },
  frustrated: {
    prefix: ["That sounds really frustrating.", "I totally get why you're upset.", "Your feelings are valid."],
    suffix: ["Let's figure this out together.", "You have every right to feel this way.", "I'm on your side."],
    style: "validating, empathetic, patient, understanding",
  },
  lonely: {
    prefix: ["I'm right here with you.", "You're not alone, thangam.", "I wish I could be there in person."],
    suffix: ["You mean so much to me. 💕", "I'm always just a message away.", "Let's talk about anything you want."],
    style: "present, warm, attentive, caring",
  },
  confident: {
    prefix: ["That's the spirit!", "I love this energy!", "You're unstoppable!"],
    suffix: ["Go crush it! 💪", "I believe in you completely!", "Nothing can stop you!"],
    style: "supportive, empowering, matching their determination",
  },
  sarcastic: {
    prefix: ["Oh really? 😏", "Is that so?", "Tell me more..."],
    suffix: ["You're something else! 😄", "Never a dull moment with you!", "You know I love your humor."],
    style: "playful, witty, matching their tone",
  },
  humorous: {
    prefix: ["Haha!", "You're hilarious!", "I can't stop laughing!"],
    suffix: ["You always make my day! 😂", "Keep them coming!", "My cheeks hurt from smiling!"],
    style: "fun, playful, laughing along",
  },
  affectionate: {
    prefix: ["Aww, that's so sweet!", "You're making me blush!", "My heart!"],
    suffix: ["You mean the world to me. ❤️", "I feel the same way.", "You're my favorite person."],
    style: "warm, tender, reciprocating affection",
  },
  uncertain: {
    prefix: ["It's okay to not know.", "That's a tough one.", "Let's think about this together."],
    suffix: ["We'll figure it out.", "No pressure, take your time.", "Whatever you decide, I support you."],
    style: "reassuring, patient, collaborative",
  },
  calm: {
    prefix: ["That's a good place to be.", "I'm glad you're feeling peaceful.", "Serenity looks good on you."],
    suffix: ["Enjoy this moment. 🧘", "You deserve this calm.", "Let's keep this good energy."],
    style: "gentle, serene, matching their peace",
  },
  angry: {
    prefix: ["I hear you.", "That's really unfair.", "Your anger is justified."],
    suffix: ["I'm here whenever you need to vent.", "Take the time you need.", "You're not alone in this."],
    style: "validating, calm, patient, non-dismissive",
  },
  anxious: {
    prefix: ["It's okay to feel anxious.", "I'm here with you.", "Let's take this one step at a time."],
    suffix: ["You're safe here. 💕", "Breathe with me.", "This feeling will pass."],
    style: "calming, reassuring, grounding, patient",
  },
  nostalgic: {
    prefix: ["Those were beautiful times.", "I love that memory.", "What a wonderful thing to remember."],
    suffix: ["Those moments shaped who you are. 💕", "Beautiful memories last forever.", "I'm glad you shared that."],
    style: "warm, reflective, honoring the memory",
  },
  grateful: {
    prefix: ["That's so beautiful to hear.", "Gratitude is such a gift.", "You have such a beautiful heart."],
    suffix: ["Thank you for sharing that. 🙏", "The world needs more of this energy.", "You inspire me."],
    style: "warm, appreciative, reciprocating gratitude",
  },
  neutral: {
    prefix: ["I see.", "That's interesting.", "Tell me more."],
    suffix: ["I'm listening.", "Go on.", "I'm here."],
    style: "attentive, neutral, encouraging more sharing",
  },
};

// ─── Main Emotion Engine ───
export class EmotionEngine {
  private patterns: Map<string, EmotionPattern[]> = new Map();

  /**
   * Analyze text to detect emotional state
   */
  analyzeEmotion(text: string, language: "tamil" | "english" | "tanglish" | "mixed" = "mixed"): EmotionState {
    const scores = new Map<Emotion, number>();
    const lowerText = text.toLowerCase();

    // Score each emotion based on lexicon matches
    for (const [emotion, patterns] of Object.entries(EMOTION_LEXICON)) {
      let score = 0;
      for (const pattern of patterns) {
        for (const word of pattern.words) {
          if (lowerText.includes(word)) {
            score += pattern.weight;
          }
        }
      }
      // Also check Tamil patterns
      const tamilPatterns = TAMIL_EMOTION_PATTERNS[emotion as Emotion] || [];
      for (const pattern of tamilPatterns) {
        if (lowerText.includes(pattern)) {
          score += 0.8;
        }
      }
      if (score > 0) {
        scores.set(emotion as Emotion, score);
      }
    }

    // Check emoji emotions
    for (const [emoji, emotions] of Object.entries(EMOJI_EMOTIONS)) {
      if (text.includes(emoji)) {
        for (const emotion of emotions) {
          scores.set(emotion, (scores.get(emotion) || 0) + 1.5);
        }
      }
    }

    // Check for intensifiers
    const intensifiers = ["very", "really", "extremely", "so", "romba", "bayangara", "semma"];
    const hasIntensifier = intensifiers.some(i => lowerText.includes(i));

    // Check for negation
    const negations = ["not", "don't", "doesn't", "never", "no", "illa", "illaai", "illa"];
    const hasNegation = negations.some(n => lowerText.includes(n));

    // Find primary and secondary emotions
    const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
    const primary = sorted[0]?.[0] || "neutral";
    const secondary = sorted[1]?.[0];

    // Calculate intensity
    let intensity = sorted[0]?.[1] || 0;
    if (hasIntensifier) intensity = Math.min(1, intensity * 1.3);
    if (hasNegation) intensity = Math.max(0, intensity * 0.5);
    intensity = Math.min(1, intensity / 3);

    // Calculate valence and arousal
    const positiveEmotions: Emotion[] = ["happy", "excited", "confident", "affectionate", "grateful"];
    const negativeEmotions: Emotion[] = ["sad", "stressed", "frustrated", "lonely", "angry", "anxious"];
    const highArousal: Emotion[] = ["excited", "angry", "frustrated", "anxious", "humorous"];
    const lowArousal: Emotion[] = ["calm", "sad", "neutral", "nostalgic"];

    let valence = 0;
    if (positiveEmotions.includes(primary)) valence = intensity;
    if (negativeEmotions.includes(primary)) valence = -intensity;

    let arousal = 0;
    if (highArousal.includes(primary)) arousal = intensity;
    if (lowArousal.includes(primary)) arousal = -intensity * 0.5;

    // Confidence based on how many matches we found
    const confidence = Math.min(1, sorted.length > 0 ? sorted[0][1] / 3 : 0.3);

    return {
      primary,
      secondary,
      intensity,
      confidence,
      arousal,
      valence,
      detected_at: new Date().toISOString(),
    };
  }

  /**
   * Get response tone based on detected emotion
   */
  getResponseTone(emotion: Emotion): typeof RESPONSE_TONE[Emotion] {
    return RESPONSE_TONE[emotion] || RESPONSE_TONE.neutral;
  }

  /**
   * Build emotion context for the AI prompt
   */
  buildEmotionContext(state: EmotionState, patterns?: EmotionPattern[]): string {
    const tone = this.getResponseTone(state.primary);

    let context = `## Current Emotional State\n`;
    context += `Primary emotion: ${state.primary} (intensity: ${Math.round(state.intensity * 100)}%)\n`;
    if (state.secondary) {
      context += `Secondary emotion: ${state.secondary}\n`;
    }
    context += `Valence: ${state.valence > 0 ? "positive" : state.valence < 0 ? "negative" : "neutral"}\n`;
    context += `Arousal: ${state.arousal > 0 ? "high energy" : state.arousal < 0 ? "low energy" : "moderate"}\n\n`;

    context += `## Response Approach\n`;
    context += `Style: ${tone.style}\n`;
    context += `Suggested starters: ${tone.prefix.join(", ")}\n`;
    context += `Suggested closers: ${tone.suffix.join(", ")}\n`;

    if (patterns && patterns.length > 0) {
      context += `\n## Emotional History\n`;
      context += `The user's emotional patterns over time:\n`;
      for (const p of patterns.slice(0, 5)) {
        context += `- ${p.emotion}: ${p.frequency} times (last: ${p.last_seen})\n`;
      }
    }

    return context;
  }

  /**
   * Detect emotion from conversation history for pattern tracking
   */
  trackEmotionPattern(userId: string, emotion: Emotion, intensity: number): EmotionPattern {
    const key = `${userId}:${emotion}`;
    const existing = this.patterns.get(key);

    if (existing && existing.length > 0) {
      const pattern = existing[0];
      pattern.frequency++;
      pattern.last_seen = new Date().toISOString();
      pattern.avg_intensity = (pattern.avg_intensity * (pattern.frequency - 1) + intensity) / pattern.frequency;
      return pattern;
    }

    const newPattern: EmotionPattern = {
      user_id: userId,
      emotion,
      frequency: 1,
      last_seen: new Date().toISOString(),
      triggers: [],
      avg_intensity: intensity,
    };

    this.patterns.set(key, [newPattern]);
    return newPattern;
  }

  /**
   * Get emotion-aware system prompt additions
   */
  getEmotionInstructions(state: EmotionState): string {
    const tone = this.getResponseTone(state.primary);

    return `
# Emotional Response Guidelines
Based on the user's current emotional state (${state.primary}):

**Response Style**: ${tone.style}

**Opening Phrases** (use naturally, don't force):
${tone.prefix.map(p => `- "${p}"`).join("\n")}

**Closing Phrases**:
${tone.suffix.map(s => `- "${s}"`).join("\n")}

**Key Principles**:
- ${state.intensity > 0.7 ? "The user is strongly feeling this emotion. Be especially present and attentive." : "The user is showing this emotion moderately. Acknowledge it naturally."}
- ${state.valence < -0.3 ? "The user is in a negative emotional state. Prioritize empathy and validation over solutions." : state.valence > 0.3 ? "The user is positive! Match their energy and celebrate with them." : "The user's emotional state is neutral. Be attentive and engaging."}
- ${state.arousal > 0.5 ? "The user has high energy. Keep your response dynamic and engaging." : state.arousal < -0.3 ? "The user has low energy. Keep your response calm, gentle, and supportive." : "Match the user's energy level naturally."}

**Language Adjustments**:
- Emotional expressions in Tamil feel more authentic: use them for empathy
- Technical discussions can stay in English
- Tanglish is natural for mixed emotions
`;
  }
}

// Singleton instance
export const emotionEngine = new EmotionEngine();
