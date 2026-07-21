"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { AuthLoadingSkeleton } from "@/components/auth-loading";
import { ChatInterface } from "@/components/chat-interface";
import { AgeVerification } from "@/components/age-verification";

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ageVerified, setAgeVerified] = useState(false);

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

  if (!ageVerified) {
    return <AgeVerification onVerified={() => setAgeVerified(true)} />;
  }

  return (
    <div className="h-screen">
      <ChatInterface />
    </div>
  );
}
