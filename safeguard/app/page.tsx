import Link from "next/link";
import {
  Siren,
  Clock,
  Share2,
  Smartphone,
  Mic,
  BellRing,
  Shield,
  Lock,
  Check,
  ArrowRight,
  MapPin,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeUp, TiltCard } from "@/components/fx/motion-primitives";
import { AnimatedStagger } from "./_landing/animated-stagger";
import { JigglyCTA } from "./_landing/jiggly-cta";
import { HeroSceneClient } from "./_landing/hero-scene-client";

const features = [
  {
    icon: Siren,
    title: "Hold-to-trigger SOS",
    desc: "Three-second hold to confirm. Rate-limited, idempotent — no pocket-fires, no duplicate alerts.",
  },
  {
    icon: Clock,
    title: "Safety check-in timer",
    desc: "Miss a scheduled check-in past the grace window and SafeGuard auto-triggers SOS — even if your browser is closed.",
  },
  {
    icon: Share2,
    title: "Passcode-gated live location",
    desc: "Generate a time-limited link, optionally gated by a 4-digit code. Lockout after five failed attempts.",
  },
  {
    icon: Smartphone,
    title: "Shake to trigger",
    desc: "Calibrated accelerometer threshold, five-second cancel modal, iOS Motion permission handled.",
  },
  {
    icon: Mic,
    title: "Voice SOS",
    desc: "Record a 15-second note during an alert. Contacts get a signed playback link in their notification.",
  },
  {
    icon: BellRing,
    title: "Web push — background-safe",
    desc: "Service worker + VAPID. Works with the tab closed on Android, and on iOS 16.4+ when installed to the home screen.",
  },
];

const howItWorks = [
  {
    n: "01",
    title: "Add your trusted contacts",
    desc: "Up to five people. They don't need accounts — only you do.",
  },
  {
    n: "02",
    title: "Install on your phone",
    desc: "'Add to Home Screen' turns SafeGuard into a real app with background push.",
  },
  {
    n: "03",
    title: "Trigger when you need it",
    desc: "One-tap SOS, a missed check-in, or a shake. Contacts are notified within two seconds.",
  },
];

const trust = [
  {
    icon: Lock,
    title: "Row-level security",
    desc: "Every row in the database is gated by Postgres RLS. Not even admins can read your messages.",
  },
  {
    icon: Shield,
    title: "No SMS fees",
    desc: "Web push and email only. No phone-number carrier costs passed to you.",
  },
  {
    icon: MapPin,
    title: "Location you control",
    desc: "GPS captured only during an active SOS or check-in, auto-deleted after 30 days.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative isolate overflow-hidden">
      {/* Top nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border/60">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative inline-block size-2.5">
              <span className="absolute inset-0 rounded-full bg-primary" />
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight">
              SafeGuard
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="#features"
              className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition"
            >
              Features
            </Link>
            <Link
              href="/privacy"
              className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition"
            >
              Privacy
            </Link>
            <Link href="/sign-in" className={buttonVariants({ size: "sm" })}>
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO — Three.js scene behind content */}
      <section className="relative mx-auto flex flex-col min-h-[calc(100vh-4rem)] max-w-6xl items-start justify-center px-4 md:px-6 py-16 md:py-24">
        <div className="absolute inset-0 -z-10">
          <HeroSceneClient />
          <div className="absolute inset-0 bg-linear-to-b from-background/0 via-background/20 to-background pointer-events-none" />
        </div>

        <FadeUp>
          <Badge className="mb-5 bg-primary/15 text-primary border-primary/30 hover:bg-primary/15 inline-flex items-center gap-1.5">
            <Sparkles className="size-3" />
            Free · Privacy-first · No SMS fees
          </Badge>
        </FadeUp>

        <FadeUp delay={0.05}>
          <h1 className="font-heading text-[1.75rem] xs:text-3xl sm:text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.05] sm:leading-[0.95] max-w-5xl">
            Personal safety,{" "}
            <span className="text-primary [text-shadow:0_0_40px_var(--brand-pink)]">
              engineered like infrastructure.
            </span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.1}>
          <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
            Real-time SOS with live GPS. Trusted-contact push alerts. Shareable
            tracking links. A safety timer that auto-triggers if you miss a
            check-in. No SMS fees, no phone-number verification, no premium
            tier.
          </p>
        </FadeUp>

        <FadeUp delay={0.15}>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <JigglyCTA href="/sign-in" primary>
              Get started <ArrowRight className="size-4" />
            </JigglyCTA>
            <JigglyCTA href="#features">See how it works</JigglyCTA>
          </div>
        </FadeUp>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-6xl px-4 md:px-6">
        <FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 md:p-8">
            <Stat value="< 2s" label="Push-to-contact latency" />
            <Stat value="5" label="Trusted contacts per user" />
            <Stat value="30d" label="Location auto-retention" />
            <Stat value="1h" label="Max SOS per user" />
          </div>
        </FadeUp>
      </section>

      {/* DISCLAIMER */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 mt-8">
        <FadeUp>
          <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 md:p-5 text-sm md:text-base">
            <strong className="text-warning">Important.</strong> SafeGuard is{" "}
            <strong>not</strong> a substitute for emergency services. Always
            call your local emergency number — 112 (India / EU), 911 (US), or
            1091 (Indian women&apos;s helpline) — in a life-threatening
            situation.
          </div>
        </FadeUp>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24"
      >
        <FadeUp>
          <div className="max-w-2xl mb-10 md:mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">
              Features
            </p>
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight">
              Everything a safety app should have. Nothing it shouldn&apos;t.
            </h2>
          </div>
        </FadeUp>

        <AnimatedStagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <TiltCard
                key={f.title}
                className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 hover:border-primary/40 transition-colors h-full"
              >
                <span className="inline-flex items-center justify-center size-10 rounded-xl bg-primary/15 text-primary mb-4">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-heading text-lg font-semibold mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </TiltCard>
            );
          })}
        </AnimatedStagger>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 py-12 md:py-16 border-t border-border/60">
        <FadeUp>
          <div className="max-w-2xl mb-10 md:mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">
              How it works
            </p>
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight">
              Three steps. No training needed.
            </h2>
          </div>
        </FadeUp>

        <AnimatedStagger className="grid gap-6 md:grid-cols-3">
          {howItWorks.map((s) => (
            <div key={s.n} className="relative">
              <div className="font-heading text-5xl md:text-7xl font-extrabold text-primary/20 mb-3 leading-none">
                {s.n}
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">
                {s.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </AnimatedStagger>
      </section>

      {/* TRUST */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 py-12 md:py-16 border-t border-border/60">
        <FadeUp>
          <div className="max-w-2xl mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">
              Built with trust in mind
            </p>
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight">
              Your safety data stays yours.
            </h2>
          </div>
        </FadeUp>

        <AnimatedStagger className="grid gap-4 md:grid-cols-3">
          {trust.map((t) => {
            const Icon = t.icon;
            return (
              <TiltCard
                key={t.title}
                className="rounded-2xl border border-border bg-card/60 p-6 h-full"
              >
                <Icon className="size-5 text-primary mb-3" />
                <h3 className="font-heading text-base font-semibold mb-2">
                  {t.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.desc}
                </p>
              </TiltCard>
            );
          })}
        </AnimatedStagger>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24">
        <FadeUp>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-linear-to-br from-primary/10 via-card/60 to-card/60 p-8 md:p-14 text-center">
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 size-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative">
              <h2 className="font-heading text-3xl md:text-6xl font-bold tracking-tight max-w-2xl mx-auto">
                Ready when you are.
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Google or email sign-up. No card, no SMS fees. Takes under a minute.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <JigglyCTA href="/sign-in" primary>
                  Create account <ArrowRight className="size-4" />
                </JigglyCTA>
                <JigglyCTA href="/privacy">Read the privacy policy</JigglyCTA>
              </div>
              <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <li className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-success" /> Google sign-in
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-success" /> No SMS fees
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-success" /> Free forever
                </li>
              </ul>
            </div>
          </div>
        </FadeUp>
      </section>

      <footer className="mx-auto max-w-6xl px-4 md:px-6 py-10 border-t border-border/60 text-sm text-muted-foreground flex flex-col sm:flex-row justify-between gap-4">
        <div>© {new Date().getFullYear()} SafeGuard</div>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-foreground transition">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition">
            Terms
          </Link>
        </div>
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-heading text-2xl md:text-4xl font-bold tracking-tight">
        {value}
      </div>
      <div className="text-xs md:text-sm text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}

