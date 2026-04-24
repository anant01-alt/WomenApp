"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, AlertTriangle } from "lucide-react";
import { resolveAlert } from "./actions";
import { Button } from "@/components/ui/button";

export function ActiveAlertPanel({
  alertId,
  createdAt,
  message,
  lat,
  lng,
}: {
  alertId: string;
  createdAt: string;
  message: string | null;
  lat: number | null;
  lng: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function act(mark: "resolved" | "false_alarm" | "cancelled") {
    startTransition(async () => {
      const res = await resolveAlert(alertId, mark);
      if (res.ok) {
        toast.success(
          mark === "false_alarm"
            ? "Marked as false alarm."
            : mark === "cancelled"
              ? "Cancelled."
              : "Resolved. Stay safe.",
        );
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed.");
      }
    });
  }

  return (
    <div className="rounded-2xl border-2 border-destructive/60 bg-destructive/5 p-6 md:p-8 space-y-5 shadow-[0_0_64px_color-mix(in_oklch,var(--brand-pink)_20%,transparent)]">
      <div className="flex items-start gap-3">
        <span className="flex items-center justify-center size-11 rounded-full bg-destructive/20 text-destructive shrink-0 animate-pulse">
          <AlertTriangle className="size-5" />
        </span>
        <div className="flex-1">
          <h2 className="font-heading text-xl font-bold">
            Active SOS in progress
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Triggered {new Date(createdAt).toLocaleTimeString()} · Contacts
            notified via push.
          </p>
          {message ? (
            <p className="mt-3 text-sm rounded-lg bg-background/50 border border-border p-3">
              &ldquo;{message}&rdquo;
            </p>
          ) : null}
          {lat !== null && lng !== null ? (
            <p className="mt-2 text-xs font-mono text-muted-foreground">
              📍 {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          className="flex-1"
          onClick={() => act("resolved")}
          disabled={pending}
        >
          <Check className="size-4" />
          I&apos;m safe
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => act("false_alarm")}
          disabled={pending}
        >
          False alarm
        </Button>
        <Button
          variant="ghost"
          onClick={() => act("cancelled")}
          disabled={pending}
        >
          <X className="size-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
