"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createCheckin, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateForm() {
  const [state, formAction, pending] = useActionState<
    ActionState | undefined,
    FormData
  >(createCheckin, undefined);

  useEffect(() => {
    if (state?.ok) toast.success("Safety timer started.");
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="interval_minutes">
            Check in every (minutes)
          </Label>
          <Input
            id="interval_minutes"
            name="interval_minutes"
            type="number"
            min={5}
            max={720}
            step={5}
            required
            defaultValue={30}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="grace_period_minutes">Grace period (minutes)</Label>
          <Input
            id="grace_period_minutes"
            name="grace_period_minutes"
            type="number"
            min={0}
            max={60}
            step={1}
            defaultValue={2}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message_template">Message template (optional)</Label>
        <Input
          id="message_template"
          name="message_template"
          placeholder="Walking home alone — please check on me if I don't reply."
          maxLength={250}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Starting…" : "Start timer"}
      </Button>
    </form>
  );
}
