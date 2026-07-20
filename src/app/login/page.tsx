"use client";

import { Suspense } from "react";
import { LoginForm, LoginFormSkeleton } from "@/components/login-form";
import { SparklesIcon } from "lucide-react";
import Link from "next/link";

function LoginPageInner() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-pink-400 to-purple-500 text-white">
              <SparklesIcon className="size-4" />
            </div>
            Luna AI
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Suspense fallback={<LoginFormSkeleton />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/30 dark:to-purple-950/30 lg:block">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 mb-6">
              <SparklesIcon className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-sm">
              Continue your journey with Luna, your AI companion who remembers and grows with you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
