import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthedUser = {
  id: string;
  email: string | null;
  isAdmin: boolean;
};

export async function requireUser(): Promise<AuthedUser> {
  // Without Supabase env vars, all authed pages would throw. Redirect the user
  // to the setup-aware sign-in screen instead of showing a 500.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    redirect("/sign-in?setup=1");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const role = (user.app_metadata as { role?: string } | null)?.role ?? "user";
  return {
    id: user.id,
    email: user.email ?? null,
    isAdmin: role === "admin",
  };
}

export async function requireAdmin(): Promise<AuthedUser> {
  const u = await requireUser();
  if (!u.isAdmin) redirect("/dashboard");
  return u;
}
