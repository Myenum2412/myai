"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  Loader2Icon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  LockIcon,
  UserIcon,
  MailIcon,
} from "lucide-react";

type Step = 1 | 2 | 3;

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Strong", color: "bg-green-500" };
  return { score, label: "Very Strong", color: "bg-emerald-500" };
}

const STEP_ICONS = [
  { icon: MailIcon, label: "Account" },
  { icon: UserIcon, label: "Profile" },
  { icon: ShieldCheckIcon, label: "Confirm" },
];

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const showEmailError = emailTouched && email.length > 0 && !emailValid;
  const showPasswordError = passwordTouched && password.length > 0 && password.length < 8;
  const showConfirmError = confirmTouched && confirmPassword.length > 0 && !passwordsMatch;

  const canStep1 = emailValid && password.length >= 8 && passwordsMatch;
  const canStep2 = displayName.trim().length >= 2;
  const canStep3 = acceptedTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!canStep1) {
        setEmailTouched(true);
        setPasswordTouched(true);
        setConfirmTouched(true);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!canStep2) return;
      setStep(3);
      return;
    }
    if (!canStep3) return;

    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        setError("An account with this email already exists. Try logging in instead.");
      } else if (error.message.includes("rate limit")) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    router.push("/chat");
    router.refresh();
  };

  return (
    <form
      className={cn("flex flex-col gap-5", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <div className="flex flex-col items-center gap-1 text-center mb-1">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          {step === 1 && "Set up your login credentials"}
          {step === 2 && "Tell us a bit about yourself"}
          {step === 3 && "Review and accept to get started"}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {STEP_ICONS.map((s, i) => {
          const num = (i + 1) as Step;
          const isActive = step === num;
          const isComplete = step > num;
          return (
            <div key={num} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-medium transition-all",
                  isComplete
                    ? "bg-gradient-to-br from-pink-500 to-purple-500 text-white"
                    : isActive
                      ? "bg-gradient-to-br from-pink-500 to-purple-500 text-white ring-2 ring-pink-500/20 ring-offset-2"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <CheckCircleIcon className="size-4" />
                ) : (
                  <s.icon className="size-4" />
                )}
              </div>
              {i < STEP_ICONS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 transition-colors",
                    isComplete ? "bg-gradient-to-r from-pink-500 to-purple-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg">
          <AlertCircleIcon className="size-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Credentials */}
      {step === 1 && (
        <>
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
              onBlur={() => setEmailTouched(true)}
              className={showEmailError ? "border-red-500 focus-visible:ring-red-500" : ""}
              autoComplete="email"
            />
            {showEmailError && (
              <p className="text-xs text-red-500">Please enter a valid email address</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                className={showPasswordError ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        i <= passwordStrength.score ? passwordStrength.color : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <p className={cn(
                  "text-xs",
                  passwordStrength.score <= 2 ? "text-red-500" : passwordStrength.score <= 3 ? "text-yellow-600" : "text-green-600"
                )}>
                  {passwordStrength.label}
                </p>
              </div>
            )}
            {showPasswordError && (
              <p className="text-xs text-red-500">Password must be at least 8 characters</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setConfirmTouched(true)}
              className={showConfirmError ? "border-red-500 focus-visible:ring-red-500" : ""}
              autoComplete="new-password"
            />
            {showConfirmError && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
            {passwordsMatch && confirmPassword.length > 0 && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircleIcon className="size-3" /> Passwords match
              </p>
            )}
          </div>
        </>
      )}

      {/* Step 2: Profile */}
      {step === 2 && (
        <div className="space-y-1.5">
          <label htmlFor="displayName" className="text-sm font-medium">
            Display Name
          </label>
          <Input
            id="displayName"
            type="text"
            placeholder="How should Luna call you?"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
          />
          <p className="text-xs text-muted-foreground">
            This is how Luna will address you in conversations.
          </p>
        </div>
      )}

      {/* Step 3: Terms */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <LockIcon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Data Privacy</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your conversations are encrypted end-to-end and never used for training.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheckIcon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Account Security</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  We use industry-standard encryption to protect your credentials.
                </p>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="size-4 mt-0.5 rounded border-gray-300 accent-pink-500"
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              I agree to the{" "}
              <a href="#" className="text-foreground underline underline-offset-4 hover:no-underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-foreground underline underline-offset-4 hover:no-underline">
                Privacy Policy
              </a>
            </span>
          </label>
        </div>
      )}

      <div className="flex gap-2 mt-1">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((step - 1) as Step)}
            disabled={loading}
            className="flex-1"
          >
            <ArrowLeftIcon className="size-4 mr-1" />
            Back
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading || (step === 1 && !canStep1) || (step === 2 && !canStep2) || (step === 3 && !canStep3)}
          className={cn(
            "flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600",
            step < 3 && "flex-1"
          )}
        >
          {loading ? (
            <>
              <Loader2Icon className="size-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : step === 3 ? (
            <>
              <CheckCircleIcon className="size-4 mr-2" />
              Create Account
            </>
          ) : (
            <>
              Continue
              <ArrowRightIcon className="size-4 ml-1" />
            </>
          )}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-2">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-foreground hover:underline underline-offset-4">
          Sign in
        </a>
      </p>
    </form>
  );
}

export function SignupFormSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="size-8 bg-muted animate-pulse rounded-full" />
        ))}
      </div>
      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
      <div className="h-10 w-full bg-muted animate-pulse rounded" />
      <div className="h-10 w-full bg-muted animate-pulse rounded" />
      <div className="h-10 w-full bg-muted animate-pulse rounded" />
    </div>
  );
}
