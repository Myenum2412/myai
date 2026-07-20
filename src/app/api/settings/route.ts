import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings, upsertUserSettings } from "@/lib/db";

// GET /api/settings - Get user settings
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getUserSettings(user.id);
  return Response.json({ settings });
}

// PUT /api/settings - Update settings
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await req.json();
  await upsertUserSettings(user.id, settings);
  return Response.json({ ok: true });
}
