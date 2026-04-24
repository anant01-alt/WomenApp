"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SPRING } from "@/components/fx/motion-primitives";
import { cn } from "@/lib/utils";

/**
 * A pill-shaped link styled as a button that squishes on click (jiggle physics)
 * and lifts on hover. Mimics iOS app-icon feedback — overshoots then settles.
 */
export function JigglyCTA({
  href,
  children,
  primary,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full text-sm font-medium transition-colors";
  const palette = primary
    ? "bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_32px_color-mix(in_oklch,var(--brand-pink)_35%,transparent)]"
    : "border border-border bg-card/60 text-foreground hover:bg-card backdrop-blur-sm";

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.03 }}
      whileTap={{ scale: 0.93, y: 0 }}
      transition={SPRING.bounce}
      className="inline-block"
    >
      <Link href={href} className={cn(base, palette)}>
        {children}
      </Link>
    </motion.div>
  );
}
