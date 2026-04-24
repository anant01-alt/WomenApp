"use server";

import { revalidatePath } from "next/cache";
import { CheckinCreateSchema } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/admin-guard";
import { writeAudit } from "@/lib/audit/log";

export type ActionState = { ok?: true; error?: string };

export async function createCheckin(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = CheckinCreateSchema.safeParse({
    interval_minutes: formData.get("interval_minutes"),
    grace_period_minutes: formData.get("grace_period_minutes") || 2,
    message_template: formData.get("message_template") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // Cancel any existing active checkin.
  await supabase
    .from("checkins")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .eq("status", "active");

  const next = new Date(
    Date.now() + parsed.data.interval_minutes * 60_000,
  ).toISOString();

  const { error } = await supabase.from("checkins").insert({
    user_id: user.id,
    interval_minutes: parsed.data.interval_minutes,
    grace_period_minutes: parsed.data.grace_period_minutes,
    message_template: parsed.data.message_template ?? null,
    next_check_at: next,
    status: "active",
  });

  if (error) return { error: error.message };

  await writeAudit({
    actor_id: user.id,
    action: "checkin.create",
    entity_type: "checkin",
    metadata: { interval_minutes: parsed.data.interval_minutes },
  });

  revalidatePath("/checkin");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function tickCheckin(id: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: c } = await supabase
    .from("checkins")
    .select("interval_minutes")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!c) return { error: "Check-in not found." };
  const next = new Date(Date.now() + c.interval_minutes * 60_000).toISOString();
  const { error } = await supabase
    .from("checkins")
    .update({
      next_check_at: next,
      last_nudged_at: null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/checkin");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function cancelCheckin(id: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("checkins")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/checkin");
  revalidatePath("/dashboard");
  return { ok: true };
}
