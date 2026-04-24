"use server";

import { revalidatePath } from "next/cache";
import { EmergencyContactSchema } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/admin-guard";
import { writeAudit } from "@/lib/audit/log";

export type ActionState = { ok?: true; error?: string };

export async function addContact(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = EmergencyContactSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    relationship: formData.get("relationship"),
    is_primary: formData.get("is_primary") === "on",
    consent_confirmed: formData.get("consent_confirmed") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // If marking as primary, clear the current primary first.
  if (parsed.data.is_primary) {
    await supabase
      .from("emergency_contacts")
      .update({ is_primary: false })
      .eq("user_id", user.id)
      .eq("is_primary", true);
  }

  const { error } = await supabase.from("emergency_contacts").insert({
    user_id: user.id,
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    relationship: parsed.data.relationship,
    is_primary: parsed.data.is_primary,
  });

  if (error) {
    if (error.message.includes("at most 5")) {
      return { error: "You already have 5 contacts. Remove one first." };
    }
    return { error: error.message };
  }

  await writeAudit({
    actor_id: user.id,
    action: "contact.add",
    entity_type: "emergency_contact",
    metadata: { relationship: parsed.data.relationship },
  });

  revalidatePath("/contacts");
  return { ok: true };
}

export async function deleteContact(id: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("emergency_contacts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  await writeAudit({
    actor_id: user.id,
    action: "contact.delete",
    entity_type: "emergency_contact",
    entity_id: id,
  });

  revalidatePath("/contacts");
  return { ok: true };
}

export async function setPrimary(id: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  await supabase
    .from("emergency_contacts")
    .update({ is_primary: false })
    .eq("user_id", user.id)
    .eq("is_primary", true);

  const { error } = await supabase
    .from("emergency_contacts")
    .update({ is_primary: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/contacts");
  return { ok: true };
}
