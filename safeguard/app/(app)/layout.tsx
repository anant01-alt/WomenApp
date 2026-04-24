import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { AppHeader } from "@/components/layout/app-header";
import { EmergencyBanner } from "@/components/sos/emergency-banner";
import { RegisterServiceWorker } from "@/components/push/register-sw";

type UserContext = {
  email: string | null;
  fullName: string | null;
  isAdmin: boolean;
};

async function loadUser(): Promise<UserContext> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { email: null, fullName: null, isAdmin: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { email: null, fullName: null, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const role =
    (user.app_metadata as { role?: string } | null)?.role ?? "user";

  return {
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    isAdmin: role === "admin",
  };
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userCtx = await loadUser();

  return (
    <div className="flex min-h-screen w-full">
      <RegisterServiceWorker />
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-64">
        <AppHeader {...userCtx} />
        <EmergencyBanner />
        <main className="flex-1 pb-24 md:pb-10">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
