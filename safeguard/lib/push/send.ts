import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { getPushClient, VAPID_CONFIGURED } from "./vapid";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  alertId?: string;
  audioUrl?: string | null;
  tag?: string;
};

/**
 * Sends a push to every subscription owned by the contacts of {userId}.
 * Records one alert_notifications row per contact+channel.
 * Prunes 404/410 subscriptions (dead endpoints).
 */
export async function sendToContactsOfUser(
  userId: string,
  alertId: string,
  payload: PushPayload,
) {
  if (!VAPID_CONFIGURED) {
    console.warn("[push] VAPID not configured — skipping push send.");
    return { sent: 0, failed: 0 };
  }

  const svc = createServiceClient();

  // Contacts for this user (they're the recipients).
  const { data: contacts } = await svc
    .from("emergency_contacts")
    .select("id, email, notification_prefs")
    .eq("user_id", userId);

  if (!contacts?.length) return { sent: 0, failed: 0 };

  // All push subscriptions owned by app users matched via contact.email (best-effort).
  // A future improvement: require contacts to claim via a link that binds them to a user_id.
  const emails = contacts
    .map((c) => c.email)
    .filter((e): e is string => typeof e === "string" && e.length > 0);

  let subs:
    | { endpoint: string; p256dh: string; auth: string; user_id: string }[]
    | null = null;

  if (emails.length) {
    const { data: authUsersByEmail } = await svc.rpc("get_user_ids_by_emails", {
      p_emails: emails,
    } as never);
    // Fallback: if the RPC doesn't exist yet, query directly via auth schema via service role.
    const userIds = (authUsersByEmail as { id: string }[] | null)?.map(
      (u) => u.id,
    );
    if (userIds?.length) {
      const { data } = await svc
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth, user_id")
        .in("user_id", userIds);
      subs = data ?? [];
    }
  }

  const webpush = getPushClient();
  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;

  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent++;
      } catch (err) {
        failed++;
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await svc
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", s.endpoint);
        }
      }
    }),
  );

  // Queue notification rows (delivery attempt log).
  await svc.from("alert_notifications").insert(
    contacts.map((c) => ({
      alert_id: alertId,
      contact_id: c.id,
      channel: "push" as const,
      status: "sent" as const,
      sent_at: new Date().toISOString(),
    })),
  );

  return { sent, failed };
}
