"use client";

import { Phone } from "lucide-react";
import { motion } from "framer-motion";
import { SPRING } from "@/components/fx/motion-primitives";

/**
 * Big "Call emergency services" button. Uses tel: link — works on phones,
 * falls back to a visual-only button on desktops.
 *
 * India default: 112 (unified pan-India emergency number since 2019).
 * Also exposes 1091 (women's helpline) as a secondary tap.
 */
export function EmergencyDial() {
  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3">
      <motion.a
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={SPRING.snap}
        href="tel:112"
        className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-destructive text-destructive-foreground font-heading font-bold text-base tracking-wide shadow-[0_0_24px_oklch(0.63_0.24_25/0.4)]"
      >
        <Phone className="size-5" />
        Call 112
      </motion.a>
      <motion.a
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={SPRING.snap}
        href="tel:1091"
        className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-card border border-border font-medium text-base"
      >
        <Phone className="size-5" />
        Women&apos;s helpline 1091
      </motion.a>
    </div>
  );
}
