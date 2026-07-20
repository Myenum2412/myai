import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  getMessages,
} from "@/lib/db";

// GET /api/conversations - List all conversations
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const conversationId = url.searchParams.get("id");

  if (conversationId) {
    const messages = await getMessages(conversationId);
    return Response.json({ messages });
  }

  const conversations = await getConversations(user.id);
  return Response.json({ conversations });
}

// POST /api/conversations - Create new conversation
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, style } = await req.json();
  const conversation = await createConversation(user.id, title, style);
  return Response.json({ conversation });
}

// PATCH /api/conversations - Update conversation
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, ...updates } = await req.json();
  await updateConversation(id, updates);
  return Response.json({ ok: true });
}

// DELETE /api/conversations - Delete conversation
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

  await deleteConversation(id);
  return Response.json({ ok: true });
}
