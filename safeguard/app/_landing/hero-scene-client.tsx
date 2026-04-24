"use client";

import dynamic from "next/dynamic";

// Lazy-load the Three.js scene in the browser only. Fallback is a glowing blur.
const HeroScene = dynamic(
  () => import("@/components/fx/hero-scene").then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-64 rounded-full bg-linear-to-br from-primary/40 to-primary/5 blur-3xl animate-pulse" />
      </div>
    ),
  },
);

export function HeroSceneClient() {
  return <HeroScene />;
}
