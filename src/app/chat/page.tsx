"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { AuthLoadingSkeleton } from "@/components/auth-loading";
import { ChatInterface } from "@/components/chat-interface";

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/chat");
    }
  }, [user, loading, router]);

  if (loading) {
    return <AuthLoadingSkeleton />;
  }

  if (!user) {
    return <AuthLoadingSkeleton />;
  }

  return (
    <div className="h-screen">
      <ChatInterface />
    </div>
  );
}
