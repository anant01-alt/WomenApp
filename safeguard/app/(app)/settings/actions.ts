"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProfileSchema, PushSubscriptionSchema } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireUser } from "@/lib/auth/admin-guard";
import { writeAudit } from "@/lib/audit/log";

export type ActionState = { ok?: true; error?: string };

export async function updateProfile(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = ProfileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") || "",
    address: formData.get("address") || "",
    timezone: formData.get("timezone") || "UTC",
    age_confirmed_18: formData.get("age_confirmed_18") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // Upsert so that users who signed up before the on_auth_user_created
  // trigger was installed can still edit their profile (first save
  // creates the row).
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: parsed.data.full_name,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        timezone: parsed.data.timezone,
        age_confirmed_18: parsed.data.age_confirmed_18,
      },
      { onConflict: "id" },
    );

  if (error) return { error: error.message };

  await writeAudit({
    actor_id: user.id,
    action: "profile.update",
    entity_type: "profile",
    entity_id: user.id,
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function subscribePush(sub: unknown): Promise<ActionState> {
  const user = await requireUser();

  const parsed = PushSubscriptionSchema.safeParse(sub);
  if (!parsed.success) return { error: "Invalid subscription payload." };

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) return { error: error.message };

  await writeAudit({
    actor_id: user.id,
    action: "push.subscribe",
    entity_type: "push_subscription",
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function unsubscribePush(endpoint: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteAccount(): Promise<ActionState> {
  const user = await requireUser();

  await writeAudit({
    actor_id: user.id,
    action: "account.delete",
    entity_type: "user",
    entity_id: user.id,
  });

  const svc = createServiceClient();
  const { error } = await svc.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  redirect("/");
}
