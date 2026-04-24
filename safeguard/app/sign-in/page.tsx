"use client";

import { useActionState, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, Eye, EyeOff, Mail } from "lucide-react";
import {
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  type PasswordState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}

function SignInInner() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [signInState, signInAction, signingIn] = useActionState<
    PasswordState | undefined,
    FormData
  >(signInWithPassword, undefined);

  const [signUpState, signUpAction, signingUp] = useActionState<
    PasswordState | undefined,
    FormData
  >(signUpWithPassword, undefined);

  const state = mode === "signIn" ? signInState : signUpState;
  const pending = mode === "signIn" ? signingIn : signingUp;
  const action = mode === "signIn" ? signInAction : signUpAction;

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_20px_var(--brand-pink)]" />
          <span className="font-heading text-lg font-bold tracking-tight">
            SafeGuard
          </span>
        </Link>

        {urlError ? (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5 p-3 flex items-start gap-2 text-sm">
            <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
            <span className="text-destructive">{urlError}</span>
          </div>
        ) : null}

        {signUpState?.needsConfirmEmail ? (
          <div className="mb-6 rounded-lg border border-success/40 bg-success/5 p-4 text-sm">
            <p className="font-medium text-success mb-1">
              Check your inbox
            </p>
            <p className="text-muted-foreground">
              We sent a confirmation link to{" "}
              <span className="text-foreground">{signUpState.email}</span>.
              Click it to finish creating your account, then come back and sign
              in.
            </p>
          </div>
        ) : null}

        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2">
          {mode === "signIn" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {mode === "signIn"
            ? "Continue with Google or enter your credentials below."
            : "Sign up with Google, or pick an email and password."}
        </p>

        {/* Google OAuth button */}
        <form action={signInWithGoogle}>
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="w-full h-11 gap-3 font-medium"
          >
            <GoogleIcon />
            Continue with Google
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            or
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted/40 rounded-lg mb-5">
          <button
            type="button"
            onClick={() => setMode("signIn")}
            className={cn(
              "py-2 text-sm font-medium rounded-md transition-colors",
              mode === "signIn"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signUp")}
            className={cn(
              "py-2 text-sm font-medium rounded-md transition-colors",
              mode === "signUp"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Create account
          </button>
        </div>

        <PasswordForm
          key={mode}
          mode={mode}
          action={action}
          pending={pending}
        />

        <p className="text-xs text-muted-foreground mt-10 leading-relaxed">
          By continuing you agree to SafeGuard&apos;s{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          . You must be 18 or older to use this service.
        </p>
      </div>
    </main>
  );
}

function PasswordForm({
  mode,
  action,
  pending,
}: {
  mode: "signIn" | "signUp";
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-4">
      {mode === "signUp" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="e.g. Asha Sharma"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              disabled={pending}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Phone{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (optional, international format)
              </span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+919876543210"
              pattern="^\+[1-9]\d{7,14}$"
              autoComplete="tel"
              disabled={pending}
              className="h-11"
            />
          </div>
        </>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            disabled={pending}
            className="h-11 pl-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">
          Password{" "}
          {mode === "signUp" ? (
            <span className="text-xs text-muted-foreground font-normal">
              (min 8 characters)
            </span>
          ) : null}
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            maxLength={72}
            autoComplete={
              mode === "signIn" ? "current-password" : "new-password"
            }
            disabled={pending}
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      {mode === "signUp" ? (
        <label className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            name="age_confirmed_18"
            required
            className="mt-0.5 accent-primary cursor-pointer"
            disabled={pending}
          />
          <span>
            I confirm I am at least 18 years old and have read the{" "}
            <a href="/terms" className="underline hover:text-foreground" target="_blank">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-foreground" target="_blank">
              Privacy Policy
            </a>
            .
          </span>
        </label>
      ) : null}

      <Button type="submit" className="w-full h-11" size="lg" disabled={pending}>
        {pending
          ? mode === "signIn"
            ? "Signing in…"
            : "Creating account…"
          : mode === "signIn"
            ? "Sign in"
            : "Create account"}
      </Button>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
