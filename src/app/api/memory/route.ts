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

// PUT /api/memory - Update memory
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, category, key, value, importance } = await req.json();

  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_memory")
    .update({ category, key, value, importance })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return Response.json({ error: "Failed to update memory" }, { status: 500 });
  }

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

  if (id) {
    // Delete specific memory
    await deleteMemory(id);
    return Response.json({ ok: true });
  }

  // Delete all user memory
  const { error } = await supabase
    .from("user_memory")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return Response.json({ error: "Failed to clear memory" }, { status: 500 });
  }

  return Response.json({ ok: true, cleared: true });
}
