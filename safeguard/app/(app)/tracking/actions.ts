"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { TrackingLinkCreateSchema } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireUser } from "@/lib/auth/admin-guard";
import { writeAudit } from "@/lib/audit/log";

export type CreateResult = {
  ok?: true;
  token?: string;
  error?: string;
};

export async function createTrackingLink(
  _prev: CreateResult | undefined,
  formData: FormData,
): Promise<CreateResult> {
  const user = await requireUser();

  const parsed = TrackingLinkCreateSchema.safeParse({
    expires_in_hours: Number(formData.get("expires_in_hours")),
    passcode: (formData.get("passcode") as string) || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(
    Date.now() + parsed.data.expires_in_hours * 3_600_000,
  ).toISOString();

  // Passcode is hashed in Postgres via crypt() — send via service client RPC.
  // Simpler for Wave-MVP: use supabase-js insert and let Postgres compute via trigger.
  // Here we directly call SQL via service role to hash with pgcrypto.
  const supabase = await createClient();
  const svc = createServiceClient();

  let passcodeHash: string | null = null;
  if (parsed.data.passcode) {
    const { data: hashed, error: he } = await svc.rpc("hash_passcode", {
      p_passcode: parsed.data.passcode,
    } as never);
    if (he) return { error: he.message };
    passcodeHash = hashed as unknown as string;
  }

  const { error } = await supabase.from("tracking_links").insert({
    user_id: user.id,
    token,
    passcode_hash: passcodeHash,
    expires_at: expiresAt,
  });

  if (error) return { error: error.message };

  await writeAudit({
    actor_id: user.id,
    action: "tracking.create",
    entity_type: "tracking_link",
    metadata: {
      expires_in_hours: parsed.data.expires_in_hours,
      has_passcode: !!parsed.data.passcode,
    },
  });

  revalidatePath("/tracking");
  return { ok: true, token };
}

export async function revokeTrackingLink(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tracking_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  await writeAudit({
    actor_id: user.id,
    action: "tracking.revoke",
    entity_type: "tracking_link",
    entity_id: id,
  });

  revalidatePath("/tracking");
  return { ok: true };
}
