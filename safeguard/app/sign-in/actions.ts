"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function getOrigin() {
  const hdrs = await headers();
  return (
    hdrs.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

function ensureEnv() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return "Supabase is not configured. Add keys to .env.local and restart the dev server.";
  }
  return null;
}

// ─── Google OAuth ────────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  const envErr = ensureEnv();
  if (envErr) {
    redirect(`/sign-in?error=${encodeURIComponent(envErr)}`);
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }
  if (!data?.url) {
    redirect(
      `/sign-in?error=${encodeURIComponent("Google OAuth is not enabled in Supabase. See setup instructions in chat.")}`,
    );
  }
  redirect(data.url);
}

// ─── Email + password ────────────────────────────────────────────────────────
const CredentialSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password too long."),
});

const SignUpSchema = CredentialSchema.extend({
  full_name: z
    .string()
    .trim()
    .min(2, "Enter your full name (at least 2 characters).")
    .max(120, "Name too long."),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +919876543210")
    .optional()
    .or(z.literal("")),
  age_confirmed_18: z
    .preprocess((v) => v === "on" || v === true, z.boolean())
    .refine((v) => v === true, {
      message: "You must be 18 or older to use SafeGuard.",
    }),
});

export type PasswordState = {
  error?: string;
  needsConfirmEmail?: boolean;
  email?: string;
};

export async function signInWithPassword(
  _prev: PasswordState | undefined,
  formData: FormData,
): Promise<PasswordState> {
  const envErr = ensureEnv();
  if (envErr) return { error: envErr };

  const parsed = CredentialSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signUpWithPassword(
  _prev: PasswordState | undefined,
  formData: FormData,
): Promise<PasswordState> {
  const envErr = ensureEnv();
  if (envErr) return { error: envErr };

  const parsed = SignUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
    phone: formData.get("phone") || "",
    age_confirmed_18: formData.get("age_confirmed_18"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      // raw_user_meta_data.full_name is read by the on_auth_user_created
      // trigger to seed the profile row automatically.
      data: {
        full_name: parsed.data.full_name,
        phone: parsed.data.phone || null,
      },
    },
  });

  if (error) return { error: error.message };

  // Upsert profile row immediately so we don't rely on the trigger having run
  // (trigger may not exist yet for repos where SQL migrations haven't all applied).
  if (data.user) {
    await supabase
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          full_name: parsed.data.full_name,
          phone: parsed.data.phone || null,
          age_confirmed_18: true,
        },
        { onConflict: "id" },
      );
  }

  // If "Confirm email" is OFF in Supabase, signUp returns a live session.
  if (data.session) {
    redirect("/dashboard");
  }

  // Otherwise, the user has to click the confirmation link in their email.
  return { needsConfirmEmail: true, email: parsed.data.email };
}
