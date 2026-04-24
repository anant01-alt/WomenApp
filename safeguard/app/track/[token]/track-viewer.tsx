"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Lock, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const LeafletMap = dynamic(
  () => import("@/components/map/leaflet-map").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] md:h-[560px] rounded-2xl" />,
  },
);

type Log = {
  location_lat: number;
  location_lng: number;
  recorded_at: string;
  is_emergency: boolean;
};

type State =
  | { phase: "prompt" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "viewing"; userName: string; logs: Log[] };

const POLL_MS = 5_000;

export function TrackViewer({ token }: { token: string }) {
  const [state, setState] = useState<State>({ phase: "prompt" });
  const [passcode, setPasscode] = useState("");

  async function load(pc: string | null) {
    setState({ phase: "loading" });
    try {
      const res = await fetch(`/api/track/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: pc || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: "error", message: data.error ?? "Unknown error." });
        return;
      }
      setState({
        phase: "viewing",
        userName: data.userName,
        logs: data.logs,
      });
    } catch (e) {
      setState({ phase: "error", message: (e as Error).message });
    }
  }

  // Poll while viewing
  useEffect(() => {
    if (state.phase !== "viewing") return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/track/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passcode: passcode || null }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setState({ phase: "viewing", userName: data.userName, logs: data.logs });
      } catch {}
    }, POLL_MS);
    return () => clearInterval(t);
  }, [state.phase, token, passcode]);

  if (state.phase === "prompt") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center size-12 rounded-2xl bg-primary/15 text-primary mb-4">
              <Lock className="size-5" />
            </div>
            <h1 className="font-heading text-2xl font-bold">
              Watch live location
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the 4-digit passcode. Leave blank if this link has no
              passcode.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              load(passcode);
            }}
            className="space-y-3"
          >
            <Label htmlFor="passcode" className="sr-only">
              Passcode
            </Label>
            <Input
              id="passcode"
              value={passcode}
              onChange={(e) =>
                setPasscode(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              placeholder="••••"
              className="text-center text-2xl tracking-[0.6em] h-14"
              autoFocus
            />
            <Button type="submit" className="w-full h-11" size="lg">
              Open
            </Button>
          </form>
        </div>
      </main>
    );
  }

  if (state.phase === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </main>
    );
  }

  if (state.phase === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="font-heading text-2xl font-bold">Can&apos;t open</h1>
          <p className="text-muted-foreground text-sm">{state.message}</p>
          <Button
            onClick={() => setState({ phase: "prompt" })}
            variant="outline"
          >
            Try again
          </Button>
        </div>
      </main>
    );
  }

  const latest = state.logs[0];
  const center = latest
    ? { lat: latest.location_lat, lng: latest.location_lng }
    : { lat: 0, lng: 0 };

  return (
    <main className="min-h-screen p-4 md:p-8 space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Live location of
          </p>
          <h1 className="font-heading text-xl md:text-2xl font-bold">
            {state.userName}
          </h1>
        </div>
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block size-2 rounded-full bg-success animate-pulse" />
          Updating every {POLL_MS / 1000}s
        </div>
      </header>

      {latest ? (
        <>
          <LeafletMap
            center={center}
            places={[]}
            emergencyRadiusM={latest.is_emergency ? 200 : null}
          />
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3" />
              {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
            </span>
            <span>
              Last update: {new Date(latest.recorded_at).toLocaleTimeString()}
            </span>
            {latest.is_emergency ? (
              <span className="text-destructive font-medium">
                Emergency session
              </span>
            ) : null}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          Waiting for the first location point…
        </div>
      )}
    </main>
  );
}
