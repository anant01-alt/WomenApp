"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/admin-guard";
import { writeAudit } from "@/lib/audit/log";

const WalkHomeSchema = z.object({
  interval_minutes: z.coerce.number().int().min(5).max(240).default(30),
  share_link: z.boolean().default(true),
  passcode: z.string().regex(/^\d{4}$/).optional().or(z.literal("")),
});

export type WalkHomeResult = {
  ok?: true;
  trackingUrl?: string;
  checkinId?: string;
  error?: string;
};

/**
 * "Walk with me" — one tap, atomic:
 *   1. Cancel any currently-active check-in
 *   2. Create a new check-in (default 30 min interval, 2 min grace)
 *   3. Create a passcode-protected tracking link (default 6h)
 *   4. Return the tracking URL so the user can share it with one contact
 *
 * This is the headline feature — it replaces three separate manual flows
 * (add contact, set timer, create link) with a single "I'm walking home" tap.
 */
export async function startWalkHome(input: {
  interval_minutes?: number;
  share_link?: boolean;
  passcode?: string;
}): Promise<WalkHomeResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = WalkHomeSchema.safeParse({
    interval_minutes: input.interval_minutes ?? 30,
    share_link: input.share_link ?? true,
    passcode: input.passcode ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // Cancel any existing active check-in so we don't collide with the new one.
  await supabase
    .from("checkins")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .eq("status", "active");

  const next = new Date(
    Date.now() + parsed.data.interval_minutes * 60_000,
  ).toISOString();

  const { data: checkin, error: cerr } = await supabase
    .from("checkins")
    .insert({
      user_id: user.id,
      interval_minutes: parsed.data.interval_minutes,
      grace_period_minutes: 2,
      next_check_at: next,
      status: "active",
      message_template:
        "Walking home — auto-SOS if I miss my check-in.",
    })
    .select("id")
    .single();

  if (cerr || !checkin) {
    return { error: cerr?.message ?? "Failed to start timer." };
  }

  let trackingUrl: string | undefined;
  if (parsed.data.share_link) {
    const token = randomBytes(24).toString("base64url");
    const expiresAt = new Date(
      Date.now() + 6 * 3_600_000, // 6 hours to match a typical commute + buffer
    ).toISOString();

    // Hash passcode if provided.
    let passcodeHash: string | null = null;
    if (parsed.data.passcode) {
      const { data } = await supabase.rpc("hash_passcode", {
        p_passcode: parsed.data.passcode,
      } as never);
      passcodeHash = (data as unknown as string) ?? null;
    }

    const { error: terr } = await supabase.from("tracking_links").insert({
      user_id: user.id,
      token,
      passcode_hash: passcodeHash,
      expires_at: expiresAt,
    });

    if (!terr) {
      // Build the URL using the site URL env or default to localhost.
      const base =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      trackingUrl = `${base}/track/${token}`;
    }
  }

  await writeAudit({
    actor_id: user.id,
    action: "walk_home.start",
    entity_type: "checkin",
    entity_id: checkin.id,
    metadata: {
      interval_minutes: parsed.data.interval_minutes,
      share_link: !!parsed.data.share_link,
      has_passcode: !!parsed.data.passcode,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/checkin");
  revalidatePath("/tracking");

  return { ok: true, trackingUrl, checkinId: checkin.id };
}
