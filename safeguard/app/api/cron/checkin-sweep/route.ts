import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendToContactsOfUser } from "@/lib/push/send";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const svc = createServiceClient();

  // Sweep overdue check-ins via the Postgres function (FOR UPDATE SKIP LOCKED
  // inside ensures idempotency across retries).
  const { data: results, error } = await svc.rpc("sweep_overdue_checkins");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const triggered = (results as {
    action: string;
    checkin_id: string;
    user_id: string;
    alert_id: string | null;
  }[] | null) ?? [];

  // Fan out push for each newly-triggered alert.
  await Promise.all(
    triggered
      .filter((r) => r.action === "trigger" && r.alert_id)
      .map((r) =>
        sendToContactsOfUser(r.user_id, r.alert_id!, {
          title: "Missed check-in — SOS",
          body: "A SafeGuard user missed their safety check-in. Auto-SOS triggered.",
          url: `/dashboard`,
          alertId: r.alert_id!,
        }),
      ),
  );

  return NextResponse.json({
    ok: true,
    processed: triggered.length,
    nudged: triggered.filter((r) => r.action === "nudge").length,
    triggered: triggered.filter((r) => r.action === "trigger").length,
  });
}
