"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SPRING } from "@/components/fx/motion-primitives";
import { navItems } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-sidebar/95 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-border">
        <span className="relative inline-block size-2.5">
          <span className="absolute inset-0 rounded-full bg-primary" />
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
        </span>
        <span className="font-heading text-lg font-bold tracking-tight">
          SafeGuard
        </span>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING.snap}
            >
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                  "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                  active && "text-sidebar-foreground",
                  item.accent && "text-primary hover:text-primary",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="sidebar-active"
                    className={cn(
                      "absolute inset-0 z-0 rounded-lg",
                      item.accent ? "bg-primary/15" : "bg-sidebar-accent",
                    )}
                    transition={SPRING.soft}
                  />
                ) : null}
                <Icon className="relative z-10 size-4 shrink-0" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
      <div className="px-6 py-4 text-[0.7rem] text-muted-foreground border-t border-border">
        Not a replacement for emergency services. Call{" "}
        <span className="text-foreground">112 / 911 / 1091</span> in a
        life-threatening situation.
      </div>
    </aside>
  );
}
