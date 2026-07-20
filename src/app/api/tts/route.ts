import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/tts - Text to Speech
// Uses the Web Speech API on the client side for natural voice
// This server endpoint is for any server-side TTS needs (future: ElevenLabs, etc.)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text, voice, speed, pitch, volume } = await req.json();

  // For now, return the text and client-side handles TTS via Web Speech API
  // In the future, this can be upgraded to ElevenLabs, OpenAI TTS, etc.
  return Response.json({
    text,
    voice: voice || "default",
    speed: speed || 1.0,
    pitch: pitch || 1.0,
    volume: volume || 1.0,
    engine: "webspeech",
  });
}
