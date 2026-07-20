import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  getMessages,
  updateMessageReaction,
  toggleMessageFavorite,
} from "@/lib/db";
import type { ConversationStyle } from "@/lib/database.types";

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

// PATCH /api/conversations - Update conversation or message
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, messageId, reaction, favorite, content, pinned, style, title } = body;

  // Handle message updates
  if (messageId) {
    if (reaction !== undefined) {
      await updateMessageReaction(messageId, reaction);
    }
    if (favorite !== undefined) {
      await toggleMessageFavorite(messageId, favorite);
    }
    if (content !== undefined) {
      // Update message content
      const { error } = await supabase
        .from("messages")
        .update({ content })
        .eq("id", messageId);

      if (error) {
        return Response.json({ error: "Failed to update message" }, { status: 500 });
      }
    }
    return Response.json({ ok: true });
  }

  // Handle conversation updates
  if (id) {
    const updates: Record<string, unknown> = {};
    if (pinned !== undefined) updates.pinned = pinned;
    if (style !== undefined) updates.style = style;
    if (title !== undefined) updates.title = title;

    if (Object.keys(updates).length > 0) {
      await updateConversation(id, updates as { title?: string; style?: ConversationStyle; pinned?: boolean });
    }
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Missing id" }, { status: 400 });
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
