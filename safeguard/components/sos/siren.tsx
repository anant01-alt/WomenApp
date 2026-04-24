"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { SPRING } from "@/components/fx/motion-primitives";
import { cn } from "@/lib/utils";

/**
 * A LOUD alarm siren generated entirely via Web Audio — no audio asset needed.
 * Plays a classic two-tone emergency sweep (700Hz ↔ 1000Hz, 0.5s each) through
 * a square oscillator piped through a gain node. Useful for:
 *   - Scaring off an attacker in public
 *   - Attracting attention from passers-by
 *   - Proving to a contact on speakerphone that the user is in real distress
 *
 * Respects iOS "Silent mode" — only plays after a user gesture (button tap).
 */
export function Siren() {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const toneTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => stop(), []);

  function start() {
    try {
      const AC = window.AudioContext ?? (window as any).webkitAudioContext;
      const ctx: AudioContext = ctxRef.current ?? new AC();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      osc.connect(gain).connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;

      // Two-tone sweep: toggle between 700Hz and 1000Hz every 500ms.
      let hi = false;
      toneTimerRef.current = setInterval(() => {
        hi = !hi;
        osc.frequency.linearRampToValueAtTime(
          hi ? 1000 : 700,
          ctx.currentTime + 0.05,
        );
      }, 500);

      setPlaying(true);
    } catch {
      /* WebAudio blocked or unsupported — silently fail */
    }
  }

  function stop() {
    if (toneTimerRef.current) {
      clearInterval(toneTimerRef.current);
      toneTimerRef.current = null;
    }
    if (oscRef.current) {
      try {
        oscRef.current.stop();
      } catch {
        /* already stopped */
      }
      oscRef.current.disconnect();
      oscRef.current = null;
    }
    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }
    setPlaying(false);
  }

  return (
    <motion.button
      type="button"
      onClick={playing ? stop : start}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={SPRING.snap}
      className={cn(
        "flex items-center justify-center gap-2 h-14 w-full rounded-2xl font-medium text-base",
        playing
          ? "bg-warning text-warning-foreground animate-pulse"
          : "bg-card border border-border text-foreground",
      )}
    >
      {playing ? (
        <>
          <Volume2 className="size-5" />
          Siren blaring — tap to stop
        </>
      ) : (
        <>
          <VolumeX className="size-5" />
          Sound siren to attract attention
        </>
      )}
    </motion.button>
  );
}
