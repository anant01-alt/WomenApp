import Link from "next/link";
import { Shield, Users, Siren, TrendingUp } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { createServiceClient } from "@/lib/supabase/service";
import {
  PageContainer,
  PageHeader,
  Section,
} from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertsChart } from "./alerts-chart";

export const dynamic = "force-dynamic";

function hoursAgo(ms: number) {
  const hours: { hour: string; count: number }[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now.getTime() - i * 3_600_000);
    hours.push({
      hour: `${String(h.getHours()).padStart(2, "0")}:00`,
      count: 0,
    });
  }
  return hours;
}

export default async function AdminPage() {
  await requireAdmin();
  const svc = createServiceClient();

  const [
    { count: totalUsers },
    { count: activeAlerts },
    { count: alerts24h },
    { data: recentAlerts },
    { data: allAlerts24h },
  ] = await Promise.all([
    svc.from("profiles").select("*", { count: "exact", head: true }),
    svc
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    svc
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 3_600_000).toISOString(),
      ),
    svc
      .from("alerts")
      .select("id, type, status, created_at, user_id, message")
      .order("created_at", { ascending: false })
      .limit(10),
    svc
      .from("alerts")
      .select("created_at")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 3_600_000).toISOString(),
      ),
  ]);

  const chartData = hoursAgo(24 * 3_600_000);
  for (const a of allAlerts24h ?? []) {
    const hour = new Date(a.created_at).getHours();
    const idx = chartData.findIndex(
      (p) => p.hour === `${String(hour).padStart(2, "0")}:00`,
    );
    if (idx >= 0) chartData[idx].count += 1;
  }

  return (
    <PageContainer>
      <PageHeader
        icon={Shield}
        title="Admin"
        description="System overview and moderation for SafeGuard administrators."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={Users}
          label="Total users"
          value={totalUsers ?? 0}
        />
        <MetricCard
          icon={Siren}
          label="Active alerts"
          value={activeAlerts ?? 0}
          accent={(activeAlerts ?? 0) > 0}
        />
        <MetricCard
          icon={TrendingUp}
          label="Alerts (last 24h)"
          value={alerts24h ?? 0}
        />
      </section>

      <Section
        title="Alerts per hour"
        description="Last 24 hours, all statuses."
      >
        <Card>
          <CardContent className="pt-6">
            <AlertsChart data={chartData} />
          </CardContent>
        </Card>
      </Section>

      <Section title="Recent alerts" description="10 most recent, any status.">
        <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden md:table-cell">Message</th>
              </tr>
            </thead>
            <tbody>
              {(recentAlerts ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No alerts yet.
                  </td>
                </tr>
              ) : (
                (recentAlerts ?? []).map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {a.type.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="capitalize">
                        {a.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-sm truncate hidden md:table-cell">
                      {a.message ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="text-xs text-muted-foreground">
        Admins are set via{" "}
        <code className="text-foreground">
          auth.users.raw_app_meta_data.role = &apos;admin&apos;
        </code>
        . Only the service role can change this.{" "}
        <Link href="/dashboard" className="text-primary hover:underline">
          Back to your dashboard
        </Link>
      </div>
    </PageContainer>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-destructive/40" : ""}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardDescription>{label}</CardDescription>
        <Icon
          className={`size-4 ${accent ? "text-destructive" : "text-muted-foreground"}`}
        />
      </CardHeader>
      <CardContent>
        <CardTitle
          className={`font-heading text-4xl font-bold ${accent ? "text-destructive" : ""}`}
        >
          {value}
        </CardTitle>
      </CardContent>
    </Card>
  );
}
