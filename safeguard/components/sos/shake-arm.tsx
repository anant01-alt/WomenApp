"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Smartphone, X } from "lucide-react";
import { triggerSos } from "@/app/(app)/sos/actions";
import { Button } from "@/components/ui/button";
import { SPRING } from "@/components/fx/motion-primitives";
import { cn } from "@/lib/utils";

/**
 * Arms DeviceMotionEvent listener. When the user shakes the phone 3+ times
 * in <2s at >15 m/s² peak magnitude, we show a 5-second cancel modal.
 * If not cancelled, we trigger the same SOS server action the hold-button
 * uses. All parameters are intentionally tunable in case real users tell
 * us the threshold is wrong.
 */
const SHAKE_THRESHOLD_MS2 = 15;
const SHAKE_COUNT_NEEDED = 3;
const SHAKE_WINDOW_MS = 2000;
const CANCEL_WINDOW_S = 5;

type IosMotionCtor = {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function ShakeArm() {
  const [armed, setArmed] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState<number | null>(null);
  const shakeStampsRef = useRef<number[]>([]);
  const lastTriggerRef = useRef(0);
  const handlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

  const fireSos = useCallback(async () => {
    const now = Date.now();
    if (now - lastTriggerRef.current < 60_000) return; // cooldown
    lastTriggerRef.current = now;

    // Try to grab a quick location fix before firing.
    let lat = 0,
      lng = 0;
    await new Promise<void>((resolve) => {
      if (!navigator.geolocation) return resolve();
      navigator.geolocation.getCurrentPosition(
        (p) => {
          lat = p.coords.latitude;
          lng = p.coords.longitude;
          resolve();
        },
        () => resolve(),
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 30_000 },
      );
    });

    const res = await triggerSos({
      location_lat: lat,
      location_lng: lng,
      triggered_by: "shake",
    });
    if (res.ok) {
      toast.success("Shake detected — SOS sent to contacts.");
    } else {
      toast.error(res.error ?? "SOS failed.");
    }
  }, []);

  const onMotion = useCallback(
    (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt(
        (a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2,
      );
      // Subtract 9.8 gravity to get true shake magnitude.
      const shake = Math.abs(mag - 9.8);
      if (shake < SHAKE_THRESHOLD_MS2) return;

      const now = Date.now();
      shakeStampsRef.current = shakeStampsRef.current.filter(
        (t) => now - t < SHAKE_WINDOW_MS,
      );
      shakeStampsRef.current.push(now);

      if (shakeStampsRef.current.length >= SHAKE_COUNT_NEEDED) {
        shakeStampsRef.current = [];
        startCancelCountdown();
      }
    },
    [],
  );

  function startCancelCountdown() {
    setCancelCountdown(CANCEL_WINDOW_S);
  }

  // Cancel countdown tick
  useEffect(() => {
    if (cancelCountdown === null) return;
    if (cancelCountdown === 0) {
      setCancelCountdown(null);
      fireSos();
      return;
    }
    const t = setTimeout(
      () => setCancelCountdown((c) => (c === null ? null : c - 1)),
      1000,
    );
    return () => clearTimeout(t);
  }, [cancelCountdown, fireSos]);

  async function arm() {
    if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) {
      toast.error(
        "Your browser doesn't expose motion data. Try on a mobile device.",
      );
      return;
    }

    // iOS 13+ requires explicit permission request from a user gesture.
    const iosCtor = DeviceMotionEvent as unknown as IosMotionCtor;
    if (typeof iosCtor.requestPermission === "function") {
      try {
        const perm = await iosCtor.requestPermission!();
        if (perm !== "granted") {
          toast.error("Motion permission denied.");
          return;
        }
      } catch {
        toast.error("Couldn't request motion permission.");
        return;
      }
    }

    handlerRef.current = onMotion;
    window.addEventListener("devicemotion", onMotion);
    setArmed(true);
    toast.success("Shake detection armed. Shake phone 3× to trigger SOS.");
  }

  function disarm() {
    if (handlerRef.current) {
      window.removeEventListener("devicemotion", handlerRef.current);
      handlerRef.current = null;
    }
    shakeStampsRef.current = [];
    setArmed(false);
    toast.info("Shake detection off.");
  }

  useEffect(() => () => disarm(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <motion.button
        type="button"
        onClick={armed ? disarm : arm}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={SPRING.snap}
        className={cn(
          "flex items-center justify-center gap-2 h-14 w-full rounded-2xl font-medium text-base",
          armed
            ? "bg-success/15 text-success border border-success/40"
            : "bg-card border border-border",
        )}
      >
        <Smartphone className="size-5" />
        {armed ? "Shake armed — tap to disarm" : "Arm shake-to-SOS"}
      </motion.button>

      {cancelCountdown !== null ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-6"
        >
          <div className="max-w-sm w-full rounded-2xl border border-destructive/40 bg-card p-6 md:p-8 space-y-5 text-center">
            <div className="font-heading text-5xl font-bold text-destructive animate-pulse">
              {cancelCountdown}
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">
                Shake detected
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                SOS fires in {cancelCountdown} second{cancelCountdown === 1 ? "" : "s"}.
                Tap Cancel if this was an accident.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => {
                setCancelCountdown(null);
                toast.info("Cancelled. No SOS sent.");
              }}
            >
              <X className="size-4" />
              Cancel SOS
            </Button>
          </div>
        </motion.div>
      ) : null}
    </>
  );
}
