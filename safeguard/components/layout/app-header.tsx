import Link from "next/link";
import { UserMenu } from "./user-menu";

export function AppHeader({
  email,
  fullName,
  isAdmin,
}: {
  email: string | null;
  fullName: string | null;
  isAdmin: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur-xl">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 md:hidden"
        aria-label="Dashboard"
      >
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_16px_var(--brand-pink)]" />
        <span className="font-heading text-base font-bold tracking-tight">
          SafeGuard
        </span>
      </Link>

      <div className="hidden md:block flex-1" />

      <div className="flex items-center gap-2">
        <UserMenu email={email} fullName={fullName} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
