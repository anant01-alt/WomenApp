import "server-only";
import webpush from "web-push";

let configured = false;

function configure() {
  if (configured) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) {
    throw new Error(
      "VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT must all be set.",
    );
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export function getPushClient() {
  configure();
  return webpush;
}

export const VAPID_CONFIGURED = !!(
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT
);
