"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { AuthLoadingSkeleton } from "@/components/auth-loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return <AuthLoadingSkeleton />;
  }

  if (!user) {
    return <AuthLoadingSkeleton />;
  }

  return <>{children}</>;
}
