import Link from "next/link";
import {
  ShieldCheck,
  Sunrise,
  Sun,
  Moon,
  Clock,
  Users,
  BellRing,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  Section,
} from "@/components/layout/page-header";
import { FadeUp } from "@/components/fx/motion-primitives";
import { AnimatedStagger } from "@/app/_landing/animated-stagger";
import { SosHero, Stat, QuickActions } from "./dashboard-tile";
import { WalkHomeHero } from "./walk-home-hero";

export const dynamic = "force-dynamic";

function SetupNotice() {
  return (
    <Card className="border-warning/40 bg-warning/5">
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          Finish Supabase setup
        </CardTitle>
        <CardDescription>
          Copy <code className="text-primary">.env.local.example</code> →{" "}
          <code className="text-primary">.env.local</code>, paste your project
          keys, then run the SQL files in{" "}
          <code className="text-primary">supabase/migrations/</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <a
          href="https://supabase.com"
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ size: "sm" })}
        >
          Open Supabase →
        </a>
      </CardContent>
    </Card>
  );
}

/** Local-time greeting tuned for India but works anywhere. */
function greetingFor(hour: number) {
  if (hour < 5) return { text: "Still up?", icon: Moon };
  if (hour < 12) return { text: "Good morning", icon: Sunrise };
  if (hour < 17) return { text: "Good afternoon", icon: Sun };
  if (hour < 21) return { text: "Good evening", icon: Sun };
  return { text: "Late night", icon: Moon };
}

/** Contextual safety tip — conditional on both time-of-day AND readiness
 *  state. Prioritise setup gaps (no contacts > no push > no timer in
 *  risky hours) before showing time-based nudges. */
function tipFor(
  hour: number,
  ctx: { hasContacts: boolean; pushEnabled: boolean; hasCheckin: boolean },
): { title: string; body: string; urgent: boolean } {
  if (!ctx.hasContacts) {
    return {
      title: "Add at least one trusted contact",
      body: "SOS is only useful when someone knows to help. Add a contact you trust — it takes 30 seconds.",
      urgent: true,
    };
  }
  if (!ctx.pushEnabled) {
    return {
      title: "Enable push notifications",
      body: "Contacts who install SafeGuard will receive your SOS push only if their push is on. Turn yours on too so someone else's SOS can reach you.",
      urgent: false,
    };
  }
  if ((hour >= 21 || hour < 5) && !ctx.hasCheckin) {
    return {
      title: "It's late — consider a check-in timer",
      body: "Start a 30-min safety timer before heading out. If you miss the check-in, SafeGuard auto-triggers SOS to your contacts.",
      urgent: true,
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      title: "Heading home? Share your live location",
      body: "Generate a passcode-protected link and send it to someone. They can watch you reach home safely on a map.",
      urgent: false,
    };
  }
  return {
    title: "You're set up",
    body: "Tap Walk-with-me when heading out, or the SOS button if you need help right now. 112 and 1091 are one tap away on the SOS page.",
    urgent: false,
  };
}

export default async function DashboardPage() {
  const envReady =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let firstName = "friend";
  let displayName = "";
  let safetyStatus: "safe" | "alert" | "emergency" = "safe";
  let contactsCount = 0;
  let alertsCount = 0;
  let activeCheckin: null | {
    id: string;
    next_check_at: string;
    interval_minutes: number;
  } = null;
  let pushEnabled = false;
  let primaryContactName: string | null = null;

  if (envReady) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const [
        { data: profile },
        { count: contacts },
        { count: alerts },
        { data: checkin },
        { count: subs },
        { data: primary },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, safety_status")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("emergency_contacts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("alerts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("checkins")
          .select("id, next_check_at, interval_minutes")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("push_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("emergency_contacts")
          .select("name")
          .eq("user_id", user.id)
          .eq("is_primary", true)
          .maybeSingle(),
      ]);

      displayName = profile?.full_name?.trim() || "";
      firstName = displayName.split(" ")[0] || "friend";
      safetyStatus = (profile?.safety_status as typeof safetyStatus) ?? "safe";
      contactsCount = contacts ?? 0;
      alertsCount = alerts ?? 0;
      activeCheckin = checkin ?? null;
      pushEnabled = (subs ?? 0) > 0;
      primaryContactName = primary?.name ?? null;
    }
  }

  const hour = new Date().getHours();
  const greeting = greetingFor(hour);
  const GreetingIcon = greeting.icon;
  const tip = tipFor(hour, {
    hasContacts: contactsCount > 0,
    pushEnabled,
    hasCheckin: !!activeCheckin,
  });

  const hasContacts = contactsCount > 0;
  const readinessScore =
    (hasContacts ? 1 : 0) +
    (pushEnabled ? 1 : 0) +
    (displayName ? 1 : 0) +
    (activeCheckin ? 1 : 0);
  const readinessPct = Math.round((readinessScore / 4) * 100);

  return (
    <PageContainer>
      {!envReady && <SetupNotice />}

      <FadeUp>
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <GreetingIcon className="size-3.5" />
              {greeting.text}
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mt-1">
              Hi, {firstName}.
            </h1>
            <p className="text-muted-foreground mt-1">
              Your current safety status is{" "}
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <span
                  className={`inline-block size-2 rounded-full ${
                    safetyStatus === "safe"
                      ? "bg-success"
                      : safetyStatus === "alert"
                        ? "bg-warning"
                        : "bg-destructive"
                  }`}
                />
                {safetyStatus}
              </span>
              .{" "}
              {primaryContactName ? (
                <span className="text-muted-foreground">
                  Primary contact: <span className="text-foreground">{primaryContactName}</span>.
                </span>
              ) : null}
            </p>
          </div>
          <SosHero />
        </header>
      </FadeUp>

      {envReady ? <WalkHomeHero hasContacts={hasContacts} /> : null}

      {/* Safety tip card — contextual by time of day */}
      <FadeUp>
        <Card
          className={
            tip.urgent
              ? "border-warning/40 bg-warning/5"
              : "border-primary/30 bg-primary/5"
          }
        >
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            {tip.urgent ? (
              <AlertCircle className="size-5 text-warning shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <CardTitle className="font-heading text-base">
                {tip.title}
              </CardTitle>
              <CardDescription className="mt-1">{tip.body}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </FadeUp>

      {/* Readiness bar + stats */}
      <Section
        title="Readiness"
        description={`You're ${readinessPct}% set up. Higher is safer.`}
      >
        <FadeUp>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 mb-4">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-primary to-primary/60 transition-all"
                style={{ width: `${readinessPct}%` }}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
              <ReadinessItem done={!!displayName} label="Profile complete" />
              <ReadinessItem done={hasContacts} label="Trusted contact added" />
              <ReadinessItem done={pushEnabled} label="Push enabled" />
              <ReadinessItem done={!!activeCheckin} label="Timer set (optional)" />
            </div>
          </div>
        </FadeUp>

        <AnimatedStagger className="grid gap-4 md:grid-cols-3">
          <Stat
            label="Trusted contacts"
            value={contactsCount}
            hint={`${Math.max(0, 5 - contactsCount)} slots left`}
            href="/contacts"
          />
          <Stat
            label="Total alerts"
            value={alertsCount}
            hint="All-time"
            href="/history"
          />
          <Stat
            label="Push notifications"
            value={pushEnabled ? "On" : "Off"}
            hint={
              pushEnabled ? "Contacts can reach you" : "Enable to reach contacts"
            }
            href="/settings"
          />
        </AnimatedStagger>
      </Section>

      {/* Active check-in — show if any */}
      {activeCheckin ? (
        <FadeUp>
          <Link
            href="/checkin"
            className="group flex items-center justify-between rounded-2xl border border-warning/40 bg-warning/5 p-5 hover:bg-warning/10 transition"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center size-10 rounded-xl bg-warning/20 text-warning">
                <Clock className="size-5" />
              </span>
              <div>
                <div className="font-medium">
                  Safety timer is running — every {activeCheckin.interval_minutes} min
                </div>
                <div className="text-xs text-muted-foreground">
                  Next check-in at{" "}
                  {new Date(activeCheckin.next_check_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
            <Badge className="bg-warning/20 text-warning border-warning/40">
              Active
            </Badge>
          </Link>
        </FadeUp>
      ) : null}

      <Section
        title="Quick actions"
        description="Everything a safety app should do — one tap away."
      >
        <FadeUp>
          <QuickActions />
        </FadeUp>
      </Section>

      <FadeUp>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <ShieldCheck className="size-4 text-primary" />
              How this keeps you safe
            </CardTitle>
            <CardDescription className="space-y-2 mt-2 leading-relaxed">
              <p>
                • Hold the <strong>SOS</strong> button for 3 seconds → all your
                contacts get a push notification with your live location in under 2
                seconds.
              </p>
              <p>
                • Start a <strong>Walk-with-me</strong> timer when heading out. Miss the check-in and we auto-trigger SOS.
              </p>
              <p>
                • Share a <strong>passcode-protected live link</strong> with anyone — they watch your location on a map without needing an account.
              </p>
            </CardDescription>
          </CardHeader>
        </Card>
      </FadeUp>
    </PageContainer>
  );
}

function ReadinessItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 className="size-4 text-success shrink-0" />
      ) : (
        <span className="size-4 rounded-full border border-muted-foreground/40 shrink-0" />
      )}
      <span className={done ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}

// avoid lint-unused
void Users;
void BellRing;
void MapPin;
