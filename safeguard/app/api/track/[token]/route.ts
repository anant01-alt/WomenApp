import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const BodySchema = z.object({
  passcode: z.string().regex(/^\d{4}$/).optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const json = (await req.json().catch(() => ({}))) as unknown;
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const svc = createServiceClient();

  // Validate token + passcode via SECURITY DEFINER function.
  const { data, error } = await svc.rpc("validate_tracking_token", {
    p_token: token,
    p_passcode: parsed.data.passcode ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const row = (data as { user_id: string; alert_id: string | null }[] | null)?.[0];
  if (!row) {
    return NextResponse.json(
      { error: "Invalid, expired, or locked link." },
      { status: 403 },
    );
  }

  // Fetch the latest ~1h of location logs for this user.
  const since = new Date(Date.now() - 60 * 60_000).toISOString();
  const { data: logs } = await svc
    .from("location_logs")
    .select("location_lat, location_lng, recorded_at, is_emergency")
    .eq("user_id", row.user_id)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: false })
    .limit(120);

  const { data: profile } = await svc
    .from("profiles")
    .select("full_name, last_location_at")
    .eq("id", row.user_id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    userName: profile?.full_name ?? "User",
    logs: logs ?? [],
  });
}
