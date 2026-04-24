import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function EmergencyBanner() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: active } = await supabase
    .from("alerts")
    .select("id, created_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!active) return null;

  return (
    <Link
      href="/sos"
      className="flex items-center gap-3 px-4 py-2.5 bg-destructive text-destructive-foreground text-sm border-b border-destructive/40 hover:brightness-110 transition"
    >
      <AlertTriangle className="size-4 shrink-0 animate-pulse" />
      <span className="font-medium">SOS active</span>
      <span className="text-destructive-foreground/80 truncate">
        — triggered {new Date(active.created_at).toLocaleTimeString()}. Tap to
        manage.
      </span>
    </Link>
  );
}
