"use server";

import { revalidatePath } from "next/cache";
import { SosTriggerSchema } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireUser } from "@/lib/auth/admin-guard";
import { writeAudit } from "@/lib/audit/log";
import { sendToContactsOfUser } from "@/lib/push/send";

export type TriggerResult = { ok?: true; alertId?: string; error?: string };

export async function triggerSos(
  input: unknown,
): Promise<TriggerResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = SosTriggerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // Rate limit check (5/hour, sliding window). Service-role function bypasses RLS.
  const svc = createServiceClient();
  const { data: rateOk } = await svc.rpc("consume_sos_rate_limit", {
    p_user_id: user.id,
  });
  if (rateOk === false) {
    return {
      error:
        "Rate limit reached — 5 SOS triggers per hour. Try again in a few minutes.",
    };
  }

  // If an active alert already exists, append a location log to it instead of
  // creating a duplicate.
  const { data: existing } = await supabase
    .from("alerts")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  let alertId = existing?.id;

  if (!alertId) {
    const { data, error } = await supabase
      .from("alerts")
      .insert({
        user_id: user.id,
        type: "sos",
        status: "active",
        triggered_by: parsed.data.triggered_by,
        message: parsed.data.message ?? null,
        location_lat: parsed.data.location_lat,
        location_lng: parsed.data.location_lng,
        location_address: parsed.data.location_address ?? null,
      })
      .select("id")
      .single();
    if (error || !data) return { error: error?.message ?? "Failed to create alert." };
    alertId = data.id;

    await writeAudit({
      actor_id: user.id,
      action: "sos.trigger",
      entity_type: "alert",
      entity_id: alertId,
      metadata: { triggered_by: parsed.data.triggered_by },
    });

    // Fire-and-forget push fan-out. Awaited so contacts reliably see the push
    // before the user's UI updates (typically <1s).
    await sendToContactsOfUser(user.id, alertId, {
      title: "SOS alert",
      body: `${user.email ?? "A SafeGuard user"} triggered an emergency.`,
      url: `/dashboard`,
      alertId,
    });
  }

  // Always log the location (whether we just created the alert or are updating).
  await supabase.from("location_logs").insert({
    user_id: user.id,
    alert_id: alertId,
    location_lat: parsed.data.location_lat,
    location_lng: parsed.data.location_lng,
    is_emergency: true,
  });

  revalidatePath("/dashboard");
  revalidatePath("/sos");
  revalidatePath("/history");
  return { ok: true, alertId };
}

export async function resolveAlert(
  id: string,
  mark: "resolved" | "false_alarm" | "cancelled",
): Promise<{ ok?: true; error?: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("alerts")
    .update({
      status: mark,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) return { error: error.message };

  await writeAudit({
    actor_id: user.id,
    action: `sos.${mark}`,
    entity_type: "alert",
    entity_id: id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/sos");
  revalidatePath("/history");
  return { ok: true };
}
