"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Siren } from "lucide-react";
import { triggerSos } from "./actions";
import { Button } from "@/components/ui/button";

const HOLD_DURATION_MS = 3000;
const TICK_MS = 50;

export function SosButton({ disabled }: { disabled?: boolean }) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const [pending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const posRef = useRef<GeolocationPosition | null>(null);
  const router = useRouter();

  // Get location once the user presses down — faster response at trigger time.
  function requestPosition() {
    if (!navigator.geolocation) {
      toast.error("Geolocation isn't available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => (posRef.current = p),
      () => toast.error("Couldn't get your location. Check permissions."),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  }

  function start() {
    if (disabled || pending) return;
    requestPosition();
    setHolding(true);
    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.min(1, elapsed / HOLD_DURATION_MS));
      if (elapsed >= HOLD_DURATION_MS) fire();
    }, TICK_MS);
  }

  function cancel() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setHolding(false);
    setProgress(0);
  }

  function fire() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setHolding(false);
    setProgress(1);

    const pos = posRef.current;
    const lat = pos?.coords.latitude ?? 0;
    const lng = pos?.coords.longitude ?? 0;

    startTransition(async () => {
      if (!pos) {
        toast.error(
          "Location unavailable — alert created without coordinates. Allow GPS and try again.",
        );
      }
      const res = await triggerSos({
        location_lat: lat,
        location_lng: lng,
        triggered_by: "manual",
      });
      if (res.ok) {
        toast.success("SOS triggered. Contacts are being notified.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to trigger SOS.");
      }
      setProgress(0);
    });
  }

  useEffect(() => () => cancel(), []);

  const pct = Math.round(progress * 100);

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        type="button"
        aria-label="Hold 3 seconds to trigger SOS"
        onMouseDown={start}
        onTouchStart={start}
        onMouseUp={cancel}
        onMouseLeave={cancel}
        onTouchEnd={cancel}
        onTouchCancel={cancel}
        disabled={disabled || pending}
        className={`relative flex items-center justify-center size-56 md:size-64 rounded-full bg-destructive/10 text-destructive font-heading text-3xl font-bold tracking-wider transition-transform active:scale-95 disabled:opacity-60 disabled:pointer-events-none`}
        style={{
          background: `conic-gradient(var(--brand-pink) ${pct}%, color-mix(in oklch, var(--destructive) 15%, transparent) 0)`,
        }}
      >
        <span className="absolute inset-3 rounded-full bg-background flex flex-col items-center justify-center gap-1.5">
          <Siren className="size-10 text-primary drop-shadow-[0_0_16px_var(--brand-pink)]" />
          <span className="text-foreground">
            {holding ? "Hold…" : pending ? "Sending…" : "SOS"}
          </span>
          {!holding && !pending ? (
            <span className="text-xs font-normal tracking-normal text-muted-foreground">
              Hold 3 seconds
            </span>
          ) : null}
        </span>
      </button>

      <p className="max-w-xs text-center text-sm text-muted-foreground">
        Releasing before 3 seconds cancels. We capture your location and notify
        every trusted contact.
      </p>
    </div>
  );
}
