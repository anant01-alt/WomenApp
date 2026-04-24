import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export async function writeAudit(entry: {
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const svc = createServiceClient();
    await svc.from("audit_log").insert({
      actor_id: entry.actor_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch (e) {
    // Never fail the caller on audit-log write failures.
    console.error("[audit] write failed:", e);
  }
}
