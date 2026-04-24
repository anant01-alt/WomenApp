import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const svc = createServiceClient();
  const cutoff = new Date(Date.now() - 30 * 24 * 3_600_000).toISOString();

  // Delete non-emergency location logs older than 30 days.
  const { count, error } = await svc
    .from("location_logs")
    .delete({ count: "exact" })
    .is("alert_id", null)
    .lt("recorded_at", cutoff);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Prune old idempotency keys (older than 7 days).
  const keyCutoff = new Date(Date.now() - 7 * 24 * 3_600_000).toISOString();
  await svc.from("sent_notifications").delete().lt("created_at", keyCutoff);

  return NextResponse.json({ ok: true, deleted: count ?? 0 });
}
