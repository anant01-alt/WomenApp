"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Siren,
  ChevronRight,
  Users,
  MapIcon,
  Clock,
  Share2,
  BellRing,
  type LucideIcon,
} from "lucide-react";
import { SPRING } from "@/components/fx/motion-primitives";
import { cn } from "@/lib/utils";

export function SosHero() {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.92 }}
      animate={{
        boxShadow: [
          "0 0 24px var(--brand-pink)",
          "0 0 44px var(--brand-pink)",
          "0 0 24px var(--brand-pink)",
        ],
      }}
      transition={{
        boxShadow: { repeat: Infinity, duration: 2.6 },
        scale: SPRING.bounce,
      }}
      className="inline-block rounded-full"
    >
      <Link
        href="/sos"
        className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-primary-foreground font-heading font-semibold text-base"
      >
        <Siren className="size-4" />
        SOS
      </Link>
    </motion.div>
  );
}

export function Stat({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  hint: string;
  href: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={SPRING.snap}
      style={{ transformPerspective: 800 }}
    >
      <Link
        href={href}
        className="block rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 hover:border-primary/40 transition-colors"
      >
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-heading text-4xl font-bold mt-1 tracking-tight">
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-2">{hint}</div>
      </Link>
    </motion.div>
  );
}

type QuickItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  accent?: boolean;
};

const QUICK_ACTIONS: QuickItem[] = [
  { href: "/sos", label: "Trigger SOS", icon: Siren, accent: true },
  { href: "/checkin", label: "Set safety timer", icon: Clock },
  { href: "/tracking", label: "Share live location", icon: Share2 },
  { href: "/contacts", label: "Manage contacts", icon: Users },
  { href: "/map", label: "Open map", icon: MapIcon },
  { href: "/settings", label: "Enable push alerts", icon: BellRing },
];

export function QuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {QUICK_ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <motion.div
            key={a.href}
            whileHover={{ x: 2, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING.snap}
          >
            <Link
              href={a.href}
              className={cn(
                "group flex items-center justify-between rounded-2xl border border-border bg-card/60 backdrop-blur-sm px-5 py-4 transition-colors",
                a.accent
                  ? "hover:border-primary/40 hover:bg-primary/5"
                  : "hover:border-border/60 hover:bg-card",
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex items-center justify-center size-10 rounded-xl shrink-0",
                    a.accent
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="font-medium">{a.label}</span>
              </span>
              <motion.span
                className="text-muted-foreground group-hover:text-foreground"
                whileHover={{ x: 3 }}
                transition={SPRING.snap}
              >
                <ChevronRight className="size-4" />
              </motion.span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

