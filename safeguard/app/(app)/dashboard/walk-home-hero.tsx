"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Footprints,
  Copy,
  Check,
  Lock,
  Clock,
  Share2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SPRING } from "@/components/fx/motion-primitives";
import { startWalkHome } from "@/app/(app)/_actions/walk-home";

export function WalkHomeHero({ hasContacts }: { hasContacts: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [interval, setIntervalMin] = useState(30);
  const [passcode, setPasscode] = useState("");
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function submit() {
    startTransition(async () => {
      const res = await startWalkHome({
        interval_minutes: interval,
        share_link: true,
        passcode: passcode || undefined,
      });
      if (res.ok) {
        toast.success(
          `Timer started. Auto-SOS in ${interval} min if you don't check in.`,
        );
        if (res.trackingUrl) setTrackingUrl(res.trackingUrl);
      } else {
        toast.error(res.error ?? "Failed to start.");
      }
    });
  }

  async function copy() {
    if (!trackingUrl) return;
    await navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    toast.success("Link copied — send it to someone you trust.");
    setTimeout(() => setCopied(false), 2500);
  }

  async function share() {
    if (!trackingUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Watch me get home safe",
          text: `I'm walking home with SafeGuard. Watch my live location here${
            passcode ? ` (passcode ${passcode})` : ""
          }:`,
          url: trackingUrl,
        });
      } catch {
        /* user cancelled share sheet */
      }
    } else {
      copy();
    }
  }

  function reset() {
    setTrackingUrl(null);
    setCopied(false);
    setPasscode("");
    setOpen(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.soft}
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-linear-to-br from-primary/10 via-card/80 to-card/80 p-5 md:p-6"
    >
      <div className="absolute -top-10 -right-10 size-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

      {!open && !trackingUrl ? (
        <div className="relative flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex items-start gap-3 flex-1">
            <span className="flex items-center justify-center size-11 rounded-2xl bg-primary text-primary-foreground shrink-0 shadow-[0_0_24px_var(--brand-pink)]">
              <Footprints className="size-5" />
            </span>
            <div>
              <h2 className="font-heading text-lg md:text-xl font-bold">
                Walk with me
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                One tap arms a safety timer <em>and</em> generates a live-tracking
                link to share. Miss your check-in and SOS auto-fires.
              </p>
            </div>
          </div>
          <div className="flex gap-2 md:shrink-0">
            <Button
              onClick={() => setOpen(true)}
              disabled={!hasContacts}
              className="h-11 px-5 shadow-[0_0_24px_var(--brand-pink)]"
            >
              Start
            </Button>
          </div>
          {!hasContacts ? (
            <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-warning">
              Add at least one trusted contact first →{" "}
              <a href="/contacts" className="underline">
                contacts
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      <AnimatePresence>
        {open && !trackingUrl ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={SPRING.soft}
            className="relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-heading text-lg font-semibold">
                  Set your walk
                </h3>
                <p className="text-sm text-muted-foreground">
                  We'll create a timer + a shareable link in one shot.
                </p>
              </div>
              <button
                onClick={reset}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="wh-interval" className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  Check in every (minutes)
                </Label>
                <Input
                  id="wh-interval"
                  type="number"
                  min={5}
                  max={240}
                  step={5}
                  value={interval}
                  onChange={(e) => setIntervalMin(Number(e.target.value) || 30)}
                  disabled={pending}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wh-pass" className="inline-flex items-center gap-1.5">
                  <Lock className="size-3.5" />
                  Passcode (optional)
                </Label>
                <Input
                  id="wh-pass"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  placeholder="0000"
                  value={passcode}
                  onChange={(e) =>
                    setPasscode(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  disabled={pending}
                  className="h-11"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={reset} disabled={pending}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={pending}>
                {pending ? "Starting…" : "Start walk"}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {trackingUrl ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING.soft}
            className="relative space-y-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center size-11 rounded-2xl bg-success/20 text-success shrink-0">
                <Check className="size-5" />
              </span>
              <div>
                <h2 className="font-heading text-lg md:text-xl font-bold">
                  You're covered
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Timer running. Share this link with someone you trust — they
                  can watch you get home on a map.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                readOnly
                value={trackingUrl}
                className="font-mono text-xs h-11"
              />
              <Button
                type="button"
                variant="outline"
                onClick={copy}
                className="h-11 shrink-0"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
              <Button
                type="button"
                onClick={share}
                className="h-11 shrink-0"
              >
                <Share2 className="size-4" />
                Share
              </Button>
            </div>

            {passcode ? (
              <p className="text-xs text-muted-foreground">
                Passcode: <span className="font-mono font-semibold text-foreground">{passcode}</span>
                {" "}— tell your contact separately.
              </p>
            ) : null}

            <div className="flex gap-2">
              <Button variant="ghost" onClick={reset}>
                Close
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
