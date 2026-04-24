"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateProfile, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COMMON_TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
];

export function ProfileForm({
  initial,
}: {
  initial: {
    full_name: string;
    phone: string | null;
    address: string | null;
    timezone: string | null;
    age_confirmed_18: boolean;
  };
}) {
  const [state, formAction, pending] = useActionState<
    ActionState | undefined,
    FormData
  >(updateProfile, undefined);

  useEffect(() => {
    if (state?.ok) toast.success("Profile saved.");
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <Field id="full_name" label="Full name">
        <Input
          id="full_name"
          name="full_name"
          defaultValue={initial.full_name}
          required
          maxLength={120}
        />
      </Field>

      <Field
        id="phone"
        label="Phone (international format)"
        hint="e.g. +919876543210"
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initial.phone ?? ""}
          placeholder="+919876543210"
          pattern="^\+[1-9]\d{7,14}$"
        />
      </Field>

      <Field id="address" label="Address (optional)">
        <Input
          id="address"
          name="address"
          defaultValue={initial.address ?? ""}
          maxLength={250}
        />
      </Field>

      <Field id="timezone" label="Timezone">
        <select
          id="timezone"
          name="timezone"
          defaultValue={initial.timezone ?? "UTC"}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-start gap-3 text-sm p-3 rounded-lg border border-border bg-card/60">
        <input
          type="checkbox"
          name="age_confirmed_18"
          defaultChecked={initial.age_confirmed_18}
          required
          className="mt-0.5 accent-primary"
        />
        <span className="text-muted-foreground">
          I confirm I am at least 18 years old. SafeGuard is an 18+ service.
        </span>
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
