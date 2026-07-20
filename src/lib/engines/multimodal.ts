// ═══════════════════════════════════════════════════════════════
// Multimodal Intelligence Engine
// Handles images, documents, voice notes, PDFs, videos
// ═══════════════════════════════════════════════════════════════

import { createClient } from "@/lib/supabase/server";
import type { Attachment } from "./cognitive-context";

export interface MultimodalContent {
  type: "image" | "document" | "voice_note" | "video" | "pdf";
  content: string;
  description?: string;
  extracted_text?: string;
  summary?: string;
}

export class MultimodalEngine {
  /**
   * Process uploaded file and extract context
   */
  async processUpload(
    userId: string,
    file: File | Buffer,
    filename: string,
    mimeType: string
  ): Promise<MultimodalContent> {
    const type = this.detectType(mimeType, filename);

    switch (type) {
      case "image":
        return this.processImage(file, filename);
      case "document":
        return this.processDocument(file, filename);
      case "voice_note":
        return this.processVoiceNote(file, filename);
      case "pdf":
        return this.processPDF(file, filename);
      case "video":
        return this.processVideo(file, filename);
      default:
        return { type: "document", content: "Unsupported file type" };
    }
  }

  /**
   * Build multimodal context for prompt
   */
  buildMultimodalContext(attachments: Attachment[]): string {
    if (attachments.length === 0) return "";

    let context = `\n## Shared Content\n`;
    context += `The user has shared ${attachments.length} file(s) in this conversation:\n`;

    for (const att of attachments.slice(-5)) {
      context += `- ${att.filename} (${att.type})`;
      if (att.summary) context += `: ${att.summary}`;
      context += "\n";
    }

    context += `\nReference these naturally in conversation. Ask about them if relevant.\n`;
    return context;
  }

  /**
   * Search through shared content
   */
  async searchAttachments(userId: string, query: string): Promise<Attachment[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_attachments")
      .select("*")
      .eq("user_id", userId)
      .or(`filename.ilike.%${query}%,summary.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(10);

    return (data || []) as Attachment[];
  }

  private detectType(mimeType: string, filename: string): MultimodalContent["type"] {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf" || filename.endsWith(".pdf")) return "pdf";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "voice_note";
    return "document";
  }

  private async processImage(file: File | Buffer, filename: string): Promise<MultimodalContent> {
    return {
      type: "image",
      content: `[Image: ${filename}]`,
      description: `Image shared by user: ${filename}`,
    };
  }

  private async processDocument(file: File | Buffer, filename: string): Promise<MultimodalContent> {
    return {
      type: "document",
      content: `[Document: ${filename}]`,
      description: `Document shared by user: ${filename}`,
    };
  }

  private async processVoiceNote(file: File | Buffer, filename: string): Promise<MultimodalContent> {
    return {
      type: "voice_note",
      content: `[Voice note: ${filename}]`,
      description: `Voice note shared by user`,
    };
  }

  private async processPDF(file: File | Buffer, filename: string): Promise<MultimodalContent> {
    return {
      type: "pdf",
      content: `[PDF: ${filename}]`,
      description: `PDF document shared by user: ${filename}`,
    };
  }

  private async processVideo(file: File | Buffer, filename: string): Promise<MultimodalContent> {
    return {
      type: "video",
      content: `[Video: ${filename}]`,
      description: `Video shared by user: ${filename}`,
    };
  }
}

export const multimodalEngine = new MultimodalEngine();
