"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { SparklesIcon, MailIcon, ArrowLeftIcon, CheckCircleIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

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
            {sent ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/30">
                  <CheckCircleIcon className="size-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We&apos;ve sent a password reset link to <strong>{email}</strong>.
                    Check your inbox and follow the instructions.
                  </p>
                </div>
                <Button variant="ghost" render={<Link href="/login" />} className="mt-2">
                  <ArrowLeftIcon className="size-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/40 dark:to-purple-950/40 mb-2">
                    <MailIcon className="size-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
                  <p className="text-sm text-muted-foreground">
                    Enter your email and we&apos;ll send you a reset link.
                  </p>
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2Icon className="size-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MailIcon className="size-4 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </Button>

                <Button variant="ghost" render={<Link href="/login" />} className="w-full">
                  <ArrowLeftIcon className="size-4 mr-2" />
                  Back to Login
                </Button>
              </form>
            )}
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
              No worries
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-sm">
              It happens to the best of us. We&apos;ll get you back to Luna in no time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
