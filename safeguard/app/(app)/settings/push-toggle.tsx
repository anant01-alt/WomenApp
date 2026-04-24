"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribePush, unsubscribePush } from "./actions";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Status = "idle" | "unsupported" | "denied" | "enabled" | "disabled";

export function PushToggle({
  vapidPublicKey,
  initialEnabled,
}: {
  vapidPublicKey: string | null;
  initialEnabled: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    setStatus(initialEnabled ? "enabled" : "disabled");
  }, [initialEnabled]);

  async function enable() {
    if (!vapidPublicKey) {
      toast.error("VAPID public key isn't configured on the server yet.");
      return;
    }
    try {
      const reg =
        (await navigator.serviceWorker.getRegistration("/sw.js")) ??
        (await navigator.serviceWorker.register("/sw.js"));
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      startTransition(async () => {
        const res = await subscribePush(sub.toJSON());
        if (res.ok) {
          toast.success("Push enabled.");
          setStatus("enabled");
        } else {
          toast.error(res.error ?? "Failed to enable push.");
        }
      });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function disable() {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      startTransition(async () => {
        await unsubscribePush(sub.endpoint);
        toast.success("Push disabled.");
        setStatus("disabled");
      });
    } else {
      setStatus("disabled");
    }
  }

  if (status === "unsupported") {
    return (
      <p className="text-sm text-muted-foreground">
        Your browser doesn&apos;t support web push. Install SafeGuard to your
        home screen from a modern browser (iOS 16.4+ Safari, Android Chrome).
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-sm text-warning">
        Notifications are blocked. Re-enable them in your browser&apos;s site
        settings, then reload this page.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {status === "enabled" ? (
        <>
          <span className="inline-flex items-center gap-2 text-sm text-success">
            <Bell className="size-4" /> Push is active
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={disable}
            disabled={pending}
          >
            Disable
          </Button>
        </>
      ) : (
        <>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <BellOff className="size-4" /> Push is off
          </span>
          <Button size="sm" onClick={enable} disabled={pending}>
            {pending ? "Enabling…" : "Enable push"}
          </Button>
        </>
      )}
    </div>
  );
}
