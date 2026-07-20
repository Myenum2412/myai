import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserMemory, upsertMemory, deleteMemory } from "@/lib/db";

// GET /api/memory - Get user memory
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memories = await getUserMemory(user.id);
  return Response.json({ memories });
}

// POST /api/memory - Add/update memory
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, key, value, importance } = await req.json();
  await upsertMemory(user.id, category, key, value, importance);
  return Response.json({ ok: true });
}

// DELETE /api/memory - Delete memory
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  await deleteMemory(id);
  return Response.json({ ok: true });
}
