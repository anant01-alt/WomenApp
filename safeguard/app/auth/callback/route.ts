import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Handles two Supabase magic-link callback shapes:
 *   1. PKCE (default for @supabase/ssr): `?code=<pkce_code>`
 *   2. Legacy verify: `?token_hash=<hash>&type=email|magiclink|signup|recovery|invite`
 * On success → redirect to ?next= (default /dashboard).
 * On failure → /sign-in?error=<reason>.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "email"
    | "magiclink"
    | "recovery"
    | "invite"
    | "signup"
    | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  // ─── 1. PKCE flow ────────────────────────────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent(error.message)}`,
      );
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  // ─── 2. Legacy token_hash flow ───────────────────────────────────────────
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) {
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent(error.message)}`,
      );
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  // No recognised params — probably a stale/corrupt link.
  return NextResponse.redirect(
    `${origin}/sign-in?error=${encodeURIComponent("Invalid or expired sign-in link. Request a new code.")}`,
  );
}
