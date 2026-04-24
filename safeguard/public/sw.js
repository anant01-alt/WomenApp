// SafeGuard service worker — handles web-push notifications.
// No offline caching (intentional: a safety app must never serve stale data).

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "SafeGuard", body: event.data.text() };
  }

  const title = payload.title || "SafeGuard";
  const options = {
    body: payload.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: payload.tag || payload.alertId || "safeguard-alert",
    data: {
      url: payload.url || "/dashboard",
      alertId: payload.alertId,
      audioUrl: payload.audioUrl,
    },
    requireInteraction: true,
    vibrate: [400, 200, 400, 200, 400],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })(),
  );
});
