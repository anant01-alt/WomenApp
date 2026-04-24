"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

/**
 * Spring presets tuned to feel "real" — damped harmonic motion that
 * overshoots a touch and settles. Use `snap` for UI controls, `bounce` for
 * feedback (heart, save), `soft` for cards sliding in.
 */
export const SPRING = {
  snap: { type: "spring", stiffness: 400, damping: 28 } as const,
  bounce: { type: "spring", stiffness: 260, damping: 12 } as const,
  soft: { type: "spring", stiffness: 180, damping: 22 } as const,
};

/**
 * A button-shaped div that jiggles on hover/tap with spring physics.
 * Usage: wrap any child. Pointer-reactive, respects prefers-reduced-motion via motion's global config.
 */
export const Jiggle = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  function Jiggle({ children, ...props }, ref) {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale: 1.04, rotate: -1 }}
        whileTap={{ scale: 0.95, rotate: 1 }}
        transition={SPRING.bounce}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

/**
 * Fades + slides children up from 12px below, once they enter the viewport.
 * Good for reveal-on-scroll on landing sections.
 */
export function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...SPRING.soft, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered container — children rendered inside animate in sequence.
 */
export function Stagger({
  children,
  gap = 0.07,
  className,
}: {
  children: React.ReactNode;
  gap?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap } },
      }}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: SPRING.soft },
};

/**
 * A card that floats on hover with a subtle 3D tilt toward the cursor.
 * Lighter alternative to a full Three.js effect for every card.
 */
export function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
      transition={SPRING.snap}
      style={{ transformPerspective: 800 }}
    >
      {children}
    </motion.div>
  );
}
