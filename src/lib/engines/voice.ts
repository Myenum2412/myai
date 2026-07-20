// ═══════════════════════════════════════════════════════════════
// Voice Engine
// Enterprise-grade speech services, VAD, streaming, interruption
// ═══════════════════════════════════════════════════════════════

import type { VoiceConfig, VoiceProfile, VoicePreset, VADConfig, VoiceStreamState, Emotion } from "@/lib/types";

// ─── Voice Profiles ───
export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: "luna-default",
    name: "Luna",
    description: "Warm, friendly, natural female voice",
    voice_id: "elevenlabs_rachel",
    provider: "elevenlabs",
    language: "auto",
    gender: "female",
    accent: "Indian English",
    emotion_presets: {
      happy: { speed: 1.05, pitch: 1.1, stability: 0.6, similarity_boost: 0.8, style: 0.4 },
      sad: { speed: 0.85, pitch: 0.95, stability: 0.8, similarity_boost: 0.9, style: 0.2 },
      excited: { speed: 1.15, pitch: 1.2, stability: 0.5, similarity_boost: 0.7, style: 0.6 },
      stressed: { speed: 0.9, pitch: 1.0, stability: 0.7, similarity_boost: 0.85, style: 0.3 },
      frustrated: { speed: 0.95, pitch: 0.98, stability: 0.75, similarity_boost: 0.8, style: 0.35 },
      lonely: { speed: 0.85, pitch: 0.95, stability: 0.85, similarity_boost: 0.9, style: 0.15 },
      confident: { speed: 1.1, pitch: 1.05, stability: 0.55, similarity_boost: 0.75, style: 0.5 },
      sarcastic: { speed: 1.0, pitch: 1.02, stability: 0.65, similarity_boost: 0.8, style: 0.45 },
      humorous: { speed: 1.1, pitch: 1.15, stability: 0.5, similarity_boost: 0.7, style: 0.55 },
      affectionate: { speed: 0.85, pitch: 1.05, stability: 0.8, similarity_boost: 0.9, style: 0.4 },
      uncertain: { speed: 0.95, pitch: 1.0, stability: 0.7, similarity_boost: 0.85, style: 0.25 },
      calm: { speed: 0.8, pitch: 0.95, stability: 0.9, similarity_boost: 0.9, style: 0.1 },
      angry: { speed: 1.1, pitch: 0.95, stability: 0.6, similarity_boost: 0.75, style: 0.5 },
      anxious: { speed: 1.05, pitch: 1.1, stability: 0.65, similarity_boost: 0.8, style: 0.35 },
      nostalgic: { speed: 0.85, pitch: 1.0, stability: 0.85, similarity_boost: 0.9, style: 0.2 },
      grateful: { speed: 0.9, pitch: 1.05, stability: 0.8, similarity_boost: 0.85, style: 0.3 },
      neutral: { speed: 1.0, pitch: 1.0, stability: 0.7, similarity_boost: 0.8, style: 0.3 },
    },
  },
  {
    id: "luna-sweet",
    name: "Luna Sweet",
    description: "Gentle, soft, caring voice",
    voice_id: "elevenlabs_bella",
    provider: "elevenlabs",
    language: "auto",
    gender: "female",
    accent: "Soft Indian",
    emotion_presets: {
      happy: { speed: 1.0, pitch: 1.15, stability: 0.7, similarity_boost: 0.85, style: 0.3 },
      sad: { speed: 0.8, pitch: 0.9, stability: 0.85, similarity_boost: 0.9, style: 0.15 },
      excited: { speed: 1.1, pitch: 1.2, stability: 0.55, similarity_boost: 0.75, style: 0.5 },
      stressed: { speed: 0.85, pitch: 0.95, stability: 0.75, similarity_boost: 0.85, style: 0.2 },
      frustrated: { speed: 0.9, pitch: 0.97, stability: 0.8, similarity_boost: 0.8, style: 0.25 },
      lonely: { speed: 0.8, pitch: 0.9, stability: 0.9, similarity_boost: 0.95, style: 0.1 },
      confident: { speed: 1.05, pitch: 1.05, stability: 0.6, similarity_boost: 0.8, style: 0.4 },
      sarcastic: { speed: 1.0, pitch: 1.0, stability: 0.7, similarity_boost: 0.8, style: 0.4 },
      humorous: { speed: 1.05, pitch: 1.15, stability: 0.55, similarity_boost: 0.75, style: 0.5 },
      affectionate: { speed: 0.8, pitch: 1.1, stability: 0.9, similarity_boost: 0.95, style: 0.35 },
      uncertain: { speed: 0.9, pitch: 1.0, stability: 0.75, similarity_boost: 0.85, style: 0.2 },
      calm: { speed: 0.75, pitch: 0.9, stability: 0.95, similarity_boost: 0.95, style: 0.05 },
      angry: { speed: 1.05, pitch: 0.95, stability: 0.65, similarity_boost: 0.75, style: 0.4 },
      anxious: { speed: 1.0, pitch: 1.1, stability: 0.7, similarity_boost: 0.8, style: 0.3 },
      nostalgic: { speed: 0.8, pitch: 0.95, stability: 0.9, similarity_boost: 0.9, style: 0.15 },
      grateful: { speed: 0.85, pitch: 1.05, stability: 0.85, similarity_boost: 0.9, style: 0.25 },
      neutral: { speed: 1.0, pitch: 1.0, stability: 0.75, similarity_boost: 0.85, style: 0.25 },
    },
  },
  {
    id: "luna-energetic",
    name: "Luna Energetic",
    description: "Upbeat, lively, enthusiastic voice",
    voice_id: "elevenlabs_ella",
    provider: "elevenlabs",
    language: "auto",
    gender: "female",
    accent: "Energetic Indian",
    emotion_presets: {
      happy: { speed: 1.15, pitch: 1.2, stability: 0.5, similarity_boost: 0.7, style: 0.6 },
      sad: { speed: 0.9, pitch: 1.0, stability: 0.7, similarity_boost: 0.8, style: 0.3 },
      excited: { speed: 1.25, pitch: 1.25, stability: 0.4, similarity_boost: 0.65, style: 0.7 },
      stressed: { speed: 1.0, pitch: 1.05, stability: 0.65, similarity_boost: 0.75, style: 0.35 },
      frustrated: { speed: 1.05, pitch: 1.0, stability: 0.7, similarity_boost: 0.75, style: 0.4 },
      lonely: { speed: 0.9, pitch: 1.0, stability: 0.75, similarity_boost: 0.85, style: 0.25 },
      confident: { speed: 1.2, pitch: 1.1, stability: 0.45, similarity_boost: 0.7, style: 0.55 },
      sarcastic: { speed: 1.05, pitch: 1.05, stability: 0.6, similarity_boost: 0.75, style: 0.5 },
      humorous: { speed: 1.15, pitch: 1.2, stability: 0.45, similarity_boost: 0.7, style: 0.65 },
      affectionate: { speed: 0.95, pitch: 1.1, stability: 0.7, similarity_boost: 0.85, style: 0.45 },
      uncertain: { speed: 1.0, pitch: 1.05, stability: 0.65, similarity_boost: 0.8, style: 0.3 },
      calm: { speed: 0.9, pitch: 1.0, stability: 0.8, similarity_boost: 0.85, style: 0.2 },
      angry: { speed: 1.15, pitch: 1.0, stability: 0.55, similarity_boost: 0.7, style: 0.5 },
      anxious: { speed: 1.1, pitch: 1.15, stability: 0.6, similarity_boost: 0.75, style: 0.35 },
      nostalgic: { speed: 0.95, pitch: 1.0, stability: 0.75, similarity_boost: 0.85, style: 0.25 },
      grateful: { speed: 1.0, pitch: 1.1, stability: 0.7, similarity_boost: 0.8, style: 0.35 },
      neutral: { speed: 1.0, pitch: 1.0, stability: 0.65, similarity_boost: 0.75, style: 0.35 },
    },
  },
];

// ─── VAD Configuration ───
export const DEFAULT_VAD_CONFIG: VADConfig = {
  threshold: 0.5,
  min_speech_duration: 300,
  min_silence_duration: 700,
  speech_timeout: 500,
  silence_timeout: 1500,
};

// ─── Voice Engine ───
export class VoiceEngine {
  private streamState: VoiceStreamState = {
    is_playing: false,
    is_interrupted: false,
    current_segment: "",
    queued_segments: [],
    vad_active: false,
    noise_level: 0,
  };

  private profiles: Map<string, VoiceProfile> = new Map();

  constructor() {
    for (const profile of VOICE_PROFILES) {
      this.profiles.set(profile.id, profile);
    }
  }

  /**
   * Get voice profile by ID
   */
  getProfile(profileId: string): VoiceProfile {
    return this.profiles.get(profileId) || VOICE_PROFILES[0];
  }

  /**
   * Get voice settings for a specific emotion
   */
  getVoiceForEmotion(profileId: string, emotion: Emotion): VoicePreset {
    const profile = this.getProfile(profileId);
    return profile.emotion_presets[emotion] || profile.emotion_presets.neutral;
  }

  /**
   * Build TTS request for ElevenLabs
   */
  buildElevenLabsRequest(
    text: string,
    profileId: string,
    emotion: Emotion,
    options: { stability?: number; similarity_boost?: number; style?: number } = {}
  ): {
    url: string;
    body: Record<string, unknown>;
    headers: Record<string, string>;
  } {
    const profile = this.getProfile(profileId);
    const preset = this.getVoiceForEmotion(profileId, emotion);

    return {
      url: `https://api.elevenlabs.io/v1/text-to-speech/${profile.voice_id}/stream`,
      body: {
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: options.stability ?? preset.stability,
          similarity_boost: options.similarity_boost ?? preset.similarity_boost,
          style: options.style ?? preset.style,
          use_speaker_boost: true,
        },
      },
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
      },
    };
  }

  /**
   * Build TTS request for OpenAI
   */
  buildOpenAIRequest(
    text: string,
    profileId: string,
    emotion: Emotion
  ): {
    url: string;
    body: Record<string, unknown>;
    headers: Record<string, string>;
  } {
    const profile = this.getProfile(profileId);
    const preset = this.getVoiceForEmotion(profileId, emotion);

    // OpenAI voice mapping
    const voiceMap: Record<string, string> = {
      "luna-default": "nova",
      "luna-sweet": "shimmer",
      "luna-energetic": "echo",
    };

    return {
      url: "https://api.openai.com/v1/audio/speech",
      body: {
        model: "tts-1-hd",
        input: text,
        voice: voiceMap[profileId] || "nova",
        response_format: "mp3",
        speed: preset.speed,
      },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
      },
    };
  }

  /**
   * Build TTS request for Azure
   */
  buildAzureRequest(
    text: string,
    profileId: string,
    emotion: Emotion
  ): {
    url: string;
    body: string;
    headers: Record<string, string>;
  } {
    const profile = this.getProfile(profileId);
    const preset = this.getVoiceForEmotion(profileId, emotion);

    // SSML with emotion
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
             xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN">
        <voice name="en-IN-NeerjaNeural">
          <mstts:express-as style="${this.mapEmotionToAzureStyle(emotion)}">
            <prosody rate="${Math.round((preset.speed - 1) * 100)}%"
                     pitch="${Math.round((preset.pitch - 1) * 100)}%">
              ${text}
            </prosody>
          </mstts:express-as>
        </voice>
      </speak>
    `.trim();

    return {
      url: `https://${process.env.AZURE_SPEECH_REGION || "centralindia"}.tts.speech.microsoft.com/cognitiveservices/v1`,
      body: ssml,
      headers: {
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY || "",
      },
    };
  }

  /**
   * Process voice stream with interruption support
   */
  async processVoiceStream(
    text: string,
    profileId: string,
    emotion: Emotion,
    provider: "elevenlabs" | "openai" | "azure" | "browser" = "browser"
  ): Promise<ReadableStream> {
    this.streamState.is_playing = true;
    this.streamState.is_interrupted = false;

    // Split text into segments for streaming
    const segments = this.splitIntoSegments(text);
    this.streamState.queued_segments = segments;

    // For browser fallback
    if (provider === "browser") {
      return new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          for (const segment of segments) {
            controller.enqueue(encoder.encode(JSON.stringify({ type: "segment", text: segment })));
          }
          controller.enqueue(encoder.encode(JSON.stringify({ type: "done" })));
          controller.close();
        },
      });
    }

    // For server-side TTS providers
    let requestConfig;
    switch (provider) {
      case "elevenlabs":
        requestConfig = this.buildElevenLabsRequest(text, profileId, emotion);
        break;
      case "openai":
        requestConfig = this.buildOpenAIRequest(text, profileId, emotion);
        break;
      case "azure":
        requestConfig = this.buildAzureRequest(text, profileId, emotion);
        break;
    }

    try {
      const response = await fetch(requestConfig.url, {
        method: "POST",
        headers: requestConfig.headers,
        body: JSON.stringify(requestConfig.body),
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      return response.body!;
    } catch (error) {
      console.error("Voice stream error:", error);
      this.streamState.is_playing = false;
      throw error;
    }
  }

  /**
   * Handle voice interruption
   */
  interrupt(): void {
    this.streamState.is_interrupted = true;
    this.streamState.is_playing = false;
    this.streamState.current_segment = "";
    this.streamState.queued_segments = [];
  }

  /**
   * Get current stream state
   */
  getStreamState(): VoiceStreamState {
    return { ...this.streamState };
  }

  /**
   * Split text into natural speech segments
   */
  splitIntoSegments(text: string): string[] {
    // Split on sentence boundaries, keeping punctuation
    const segments: string[] = [];
    const sentences = text.split(/(?<=[.!?।])\s+/);

    let current = "";
    for (const sentence of sentences) {
      if (current.length + sentence.length > 200) {
        if (current) segments.push(current.trim());
        current = sentence;
      } else {
        current += (current ? " " : "") + sentence;
      }
    }
    if (current) segments.push(current.trim());

    return segments.length > 0 ? segments : [text];
  }

  /**
   * Map emotion to Azure SSML style
   */
  private mapEmotionToAzureStyle(emotion: Emotion): string {
    const styleMap: Record<Emotion, string> = {
      happy: "cheerful",
      sad: "sad",
      excited: "excited",
      stressed: "anxious",
      frustrated: "angry",
      lonely: "sad",
      confident: "cheerful",
      sarcastic: "chat",
      humorous: "cheerful",
      affectionate: "gentle",
      uncertain: "uncertain",
      calm: "calm",
      angry: "angry",
      anxious: "anxious",
      nostalgic: "gentle",
      grateful: "cheerful",
      neutral: "default",
    };
    return styleMap[emotion] || "default";
  }

  /**
   * Generate natural pause markers
   */
  addNaturalPauses(text: string, emotion: Emotion): string {
    // Add pauses after commas, before important words
    let processed = text;

    // Emotional pauses
    if (["sad", "lonely", "nostalgic", "affectionate"].includes(emotion)) {
      processed = processed.replace(/,\s*/g, ", ... ");
      processed = processed.replace(/!\s*/g, "! ... ");
    }

    // Quick pauses for excited/happy
    if (["excited", "happy", "humorous"].includes(emotion)) {
      processed = processed.replace(/,\s*/g, ", ");
    }

    return processed;
  }

  /**
   * Build voice configuration context for the AI prompt
   */
  buildVoiceContext(profileId: string, emotion: Emotion): string {
    const profile = this.getProfile(profileId);
    const preset = this.getVoiceForEmotion(profileId, emotion);

    return `
## Voice Configuration
Profile: ${profile.name} (${profile.description})
Emotion preset: ${emotion}
Speed: ${preset.speed}x, Pitch: ${preset.pitch}, Stability: ${preset.stability}
Provider: ${profile.provider}
Language: ${profile.language}

Adjust your response style to match the voice:
- ${preset.speed > 1.1 ? "Keep sentences shorter for the faster pace" : preset.speed < 0.9 ? "Use longer, more flowing sentences for the slower pace" : "Normal sentence length is fine"}
- ${preset.pitch > 1.1 ? "Use more expressive, higher-energy language" : preset.pitch < 0.95 ? "Use calmer, more soothing language" : "Balanced tone is fine"}
`;
  }
}

export const voiceEngine = new VoiceEngine();
