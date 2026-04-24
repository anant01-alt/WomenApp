"use client";

import { motion } from "framer-motion";
import { Children, type ReactNode } from "react";
import { SPRING } from "@/components/fx/motion-primitives";

/**
 * Wraps each child in a motion item that fades + slides up in sequence as the
 * container enters the viewport. Cheaper than wrapping every feature card
 * manually in the parent markup.
 */
export function AnimatedStagger({
  children,
  className,
  gap = 0.07,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
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
      {Children.map(children, (child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 14 },
            show: { opacity: 1, y: 0, transition: SPRING.soft },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
