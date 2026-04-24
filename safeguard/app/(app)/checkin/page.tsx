import { Clock } from "lucide-react";
import { requireUser } from "@/lib/auth/admin-guard";
import { createClient } from "@/lib/supabase/server";
import {
  PageContainer,
  PageHeader,
  Section,
} from "@/components/layout/page-header";
import { CreateForm } from "./create-form";
import { Countdown } from "./countdown";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: active } = await supabase
    .from("checkins")
    .select("id, interval_minutes, next_check_at, grace_period_minutes")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <PageContainer>
      <PageHeader
        icon={Clock}
        title="Safety check-in timer"
        description="Set an interval. Miss it past the grace window and SafeGuard auto-triggers SOS — even if your browser is closed. The server-side cron handles this."
      />

      {active ? (
        <Section
          title="Active timer"
          description={`Every ${active.interval_minutes} min · ${active.grace_period_minutes} min grace`}
        >
          <Countdown
            id={active.id}
            nextCheckAt={active.next_check_at}
            intervalMinutes={active.interval_minutes}
          />
        </Section>
      ) : (
        <Section
          title="Start a timer"
          description="Choose how often you want SafeGuard to nudge you."
        >
          <div className="rounded-2xl border border-border bg-card/60 p-6">
            <CreateForm />
          </div>
        </Section>
      )}

      <div className="rounded-xl border border-border bg-card/40 p-4 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">How it works.</strong> A Vercel
        Cron job runs every minute. When your <code>next_check_at</code>
        passes, we send you a nudge push. If the grace window expires without
        you tapping &ldquo;I&apos;m safe&rdquo;, an SOS alert is created
        automatically and your contacts are notified.
      </div>
    </PageContainer>
  );
}
