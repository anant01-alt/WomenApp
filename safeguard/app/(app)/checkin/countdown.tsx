"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { cancelCheckin, tickCheckin } from "./actions";
import { Button } from "@/components/ui/button";

export function Countdown({
  id,
  nextCheckAt,
  intervalMinutes,
}: {
  id: string;
  nextCheckAt: string;
  intervalMinutes: number;
}) {
  const [now, setNow] = useState(Date.now());
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = new Date(nextCheckAt).getTime();
  const totalMs = intervalMinutes * 60_000;
  const remainingMs = target - now;
  const overdue = remainingMs <= 0;
  const pct =
    remainingMs >= totalMs
      ? 1
      : Math.max(0, Math.min(1, remainingMs / totalMs));

  const mm = Math.abs(Math.floor(remainingMs / 60_000));
  const ss = Math.abs(Math.floor((remainingMs % 60_000) / 1000));

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-6 md:p-8 text-center space-y-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {overdue ? "Overdue — act now" : "Next check-in in"}
      </div>
      <div
        className={`font-heading font-extrabold tracking-tight text-6xl md:text-7xl ${overdue ? "text-destructive" : "text-foreground"}`}
      >
        {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
      </div>
      <div className="relative h-1.5 rounded-full bg-muted overflow-hidden max-w-sm mx-auto">
        <div
          className={`absolute inset-y-0 left-0 ${overdue ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await tickCheckin(id);
              if (res.ok) {
                toast.success("Check-in confirmed. Timer reset.");
                router.refresh();
              } else toast.error(res.error ?? "Failed.");
            })
          }
        >
          <Check className="size-4" />
          I&apos;m safe
        </Button>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await cancelCheckin(id);
              if (res.ok) {
                toast.success("Timer cancelled.");
                router.refresh();
              } else toast.error(res.error ?? "Failed.");
            })
          }
        >
          <X className="size-4" />
          Cancel timer
        </Button>
      </div>
    </div>
  );
}
