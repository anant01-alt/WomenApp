"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SPRING } from "@/components/fx/motion-primitives";
import { mobileBottomItems } from "./nav-items";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl"
      aria-label="Primary navigation"
    >
      <div className="grid grid-cols-5">
        {mobileBottomItems.map((item, i) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const isCenter = i === 2;

          if (isCenter) {
            return (
              <div
                key={item.href}
                className="flex items-start justify-center -mt-5"
              >
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.88 }}
                  animate={{
                    boxShadow: [
                      "0 0 20px var(--brand-pink)",
                      "0 0 40px var(--brand-pink)",
                      "0 0 20px var(--brand-pink)",
                    ],
                  }}
                  transition={{
                    boxShadow: { repeat: Infinity, duration: 2.4 },
                    scale: SPRING.bounce,
                  }}
                  className="rounded-full"
                >
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className="flex items-center justify-center size-14 rounded-full bg-primary text-primary-foreground ring-4 ring-background"
                  >
                    <Icon className="size-6" />
                  </Link>
                </motion.div>
              </div>
            );
          }

          return (
            <motion.div
              key={item.href}
              whileTap={{ scale: 0.9 }}
              transition={SPRING.snap}
            >
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[0.65rem] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <motion.span
                  animate={active ? { y: -2 } : { y: 0 }}
                  transition={SPRING.snap}
                  className="relative"
                >
                  <Icon
                    className={cn(
                      "size-5",
                      active &&
                        "text-primary drop-shadow-[0_0_6px_var(--brand-pink)]",
                    )}
                  />
                  {active ? (
                    <motion.span
                      layoutId="mobile-nav-dot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary"
                      transition={SPRING.soft}
                    />
                  ) : null}
                </motion.span>
                <span>{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
