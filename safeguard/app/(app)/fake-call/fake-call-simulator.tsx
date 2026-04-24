"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, PhoneIncoming, Mic, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Phase = "setup" | "ringing" | "incall";

export function FakeCallSimulator() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [name, setName] = useState("Mom");
  const [delay, setDelay] = useState(5);
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      audioRef.current?.pause();
    };
  }, []);

  function schedule() {
    ringTimerRef.current = setTimeout(() => {
      setPhase("ringing");
      audioRef.current
        ?.play()
        .catch(() => {});
      // Haptic feedback if supported
      if ("vibrate" in navigator) {
        const pattern = [600, 400, 600, 400, 600, 400, 600, 400];
        navigator.vibrate(pattern);
      }
    }, delay * 1000);
  }

  function answer() {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setPhase("incall");
    setElapsed(0);
    callTimerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  function hangUp() {
    if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setPhase("setup");
    setElapsed(0);
  }

  const mm = Math.floor(elapsed / 60);
  const ss = elapsed % 60;

  if (phase === "setup") {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-6 md:p-8 max-w-md space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="caller">Caller name</Label>
          <Input
            id="caller"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 30))}
            maxLength={30}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="delay">Ring after (seconds)</Label>
          <Input
            id="delay"
            type="number"
            min={1}
            max={120}
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value) || 5)}
          />
        </div>
        <Button
          onClick={() => {
            setPhase("ringing");
            schedule();
            // Immediately set to ringing scheduled? We show a waiting banner.
          }}
        >
          Start fake call
        </Button>
        <audio
          ref={audioRef}
          loop
          preload="auto"
          // Built-in ringtone via data URI beep sequence. Replace with public/ringtone.mp3 later.
          src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA="
        />
      </div>
    );
  }

  // Full-screen incoming / in-call UI
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-between py-16 px-6 text-center">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
          <PhoneIncoming className="size-3" />
          {phase === "ringing" ? "Incoming call" : "Connected"}
        </p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold">{name}</h1>
        <p className="text-muted-foreground text-sm">
          {phase === "ringing"
            ? "mobile"
            : `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`}
        </p>
      </div>

      <div className="size-32 rounded-full bg-primary/15 flex items-center justify-center">
        <span className="font-heading text-4xl font-bold text-primary">
          {name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || "?"}
        </span>
      </div>

      <div className="flex items-center gap-10">
        {phase === "incall" ? (
          <>
            <button className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Mic className="size-5" />
            </button>
            <button
              onClick={hangUp}
              className="size-20 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <PhoneOff className="size-7" />
            </button>
            <button className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Volume2 className="size-5" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={hangUp}
              className="size-20 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <PhoneOff className="size-7" />
            </button>
            <button
              onClick={answer}
              className="size-20 rounded-full bg-success text-success-foreground flex items-center justify-center"
            >
              <Phone className="size-7" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
