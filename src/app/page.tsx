"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  SparklesIcon,
  BrainIcon,
  ShieldIcon,
  ZapIcon,
  MessageCircleIcon,
  LockIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  StarIcon,
  ArrowRightIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";

const FEATURES = [
  {
    icon: BrainIcon,
    title: "Advanced Reasoning",
    description:
      "Powered by state-of-the-art AI models with chain-of-thought reasoning for deeper, more thoughtful conversations.",
  },
  {
    icon: MessageCircleIcon,
    title: "Natural Conversations",
    description:
      "Luna understands context, remembers your preferences, and grows with you over time for truly personalized interactions.",
  },
  {
    icon: ShieldIcon,
    title: "Enterprise Security",
    description:
      "End-to-end encryption, SOC 2 compliance, and GDPR-ready data handling to keep your conversations private and secure.",
  },
  {
    icon: ZapIcon,
    title: "Lightning Fast",
    description:
      "Sub-second response times with streaming output so you never have to wait for Luna to think.",
  },
  {
    icon: LockIcon,
    title: "Privacy First",
    description:
      "Your data stays yours. We never train on your conversations and you can delete your data at any time.",
  },
  {
    icon: SparklesIcon,
    title: "Always Improving",
    description:
      "Regular updates with new capabilities, better reasoning, and enhanced emotional intelligence.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "50 messages per day",
      "Basic AI reasoning",
      "Standard response speed",
      "Community support",
    ],
    cta: "Get Started Free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For power users who need more",
    features: [
      "Unlimited messages",
      "Advanced reasoning modes",
      "Priority response speed",
      "Email support",
      "Conversation history",
      "Custom personas",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "per team",
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Team workspace",
      "Admin dashboard",
      "SSO & SAML",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "Product Manager at TechFlow",
    content:
      "Luna has completely changed how I brainstorm product ideas. The reasoning depth is unlike any other AI tool I've used.",
    rating: 5,
  },
  {
    name: "Marcus Rodriguez",
    role: "Software Engineer at DevCo",
    content:
      "I use Luna daily for code reviews and architecture discussions. The contextual understanding is remarkably accurate.",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "Research Lead at BioLab",
    content:
      "The emotional intelligence combined with technical capability makes Luna a uniquely valuable research companion.",
    rating: 5,
  },
];

const FAQS = [
  {
    q: "What is Luna?",
    a: "Luna is an AI companion powered by advanced reasoning models. She provides thoughtful, context-aware conversations that adapt to your needs over time.",
  },
  {
    q: "Is my data private?",
    a: "Absolutely. We use end-to-end encryption, never train on your conversations, and you have full control to export or delete your data at any time.",
  },
  {
    q: "How does the free plan work?",
    a: "The free plan gives you 50 messages per day with access to Luna's core features. No credit card required to get started.",
  },
  {
    q: "Can I use Luna for my team?",
    a: "Yes! Our Enterprise plan includes team workspaces, admin dashboards, SSO/SAML integration, and dedicated support. Contact our sales team for details.",
  },
  {
    q: "What AI model powers Luna?",
    a: "Luna is powered by NVIDIA's Nemotron 3 Ultra, a 550B parameter model with advanced reasoning capabilities and chain-of-thought processing.",
  },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 text-white">
            <SparklesIcon className="size-4" />
          </div>
          Luna
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            Log in
          </Button>
          <Button size="sm" render={<Link href="/signup" />} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
            Sign Up Free
          </Button>
        </div>

        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-lg px-6 py-4 space-y-3">
          <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground">Features</a>
          <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground">Pricing</a>
          <a href="#testimonials" className="block text-sm text-muted-foreground hover:text-foreground">Testimonials</a>
          <a href="#faq" className="block text-sm text-muted-foreground hover:text-foreground">FAQ</a>
          <div className="pt-3 border-t border-border/40 flex flex-col gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              Log in
            </Button>
            <Button size="sm" render={<Link href="/signup" />} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
              Sign Up Free
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-foreground)/0.04,transparent_70%)]" />
      <div className="mx-auto max-w-4xl text-center relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-8">
          <SparklesIcon className="size-3.5" />
          Powered by NVIDIA Nemotron 3 Ultra
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
          Your AI companion that
          <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent"> thinks </span>
          before it speaks
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
          Luna is an AI companion with advanced reasoning capabilities. She understands
          context, remembers your preferences, and grows with you over time.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" render={<Link href="/signup" />} className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
            Start for Free
            <ArrowRightIcon className="size-4 ml-1" />
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/login" />} className="w-full sm:w-auto">
            Log in to Luna
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          No credit card required. 50 free messages per day.
        </p>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for meaningful conversations</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Luna combines cutting-edge AI with thoughtful design to deliver
            conversations that actually matter.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-border/50 bg-card p-6 hover:shadow-md transition-shadow">
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/40 dark:to-purple-950/40">
                <feature.icon className="size-5 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="px-6 py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-3 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.featured
                  ? "border-purple-500/50 bg-card shadow-lg ring-1 ring-purple-500/20 relative"
                  : "border-border/50 bg-card"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-1 text-xs font-medium text-white">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period !== "forever" && (
                  <span className="text-sm text-muted-foreground"> / {plan.period}</span>
                )}
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircleIcon className="size-4 mt-0.5 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                render={<Link href="/signup" />}
                className={`w-full ${
                  plan.featured
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    : ""
                }`}
                variant={plan.featured ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Loved by thousands</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See what people are saying about their experience with Luna.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-border/50 bg-card p-6 flex flex-col">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <StarIcon key={i} className="size-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="mt-6 pt-4 border-t border-border/50">
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="px-6 py-24 bg-muted/30">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
        </div>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <button
                className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {faq.q}
                <ChevronDownIcon
                  className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 p-12 sm:p-16">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 mb-6">
            <SparklesIcon className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to meet Luna?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Join thousands of users already having meaningful conversations
            with their AI companion.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" render={<Link href="/signup" />} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
              Get Started Free
              <ArrowRightIcon className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2 font-bold">
            <div className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-pink-400 to-purple-500 text-white">
              <SparklesIcon className="size-3" />
            </div>
            Luna AI
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Luna AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
