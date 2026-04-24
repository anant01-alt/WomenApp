"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Copy, Check } from "lucide-react";
import { createTrackingLink, type CreateResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateTrackingDialog() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState<
    CreateResult | undefined,
    FormData
  >(createTrackingLink, undefined);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  const publicUrl = state?.token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/track/${state.token}`
    : null;

  async function copy() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Link copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setCopied(false);
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="size-4" />
            Create link
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share your live location</DialogTitle>
          <DialogDescription>
            Anyone with this link can watch your location on a map until it
            expires or you revoke it.
          </DialogDescription>
        </DialogHeader>

        {state?.ok && publicUrl ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Share this URL</Label>
              <div className="flex gap-2">
                <Input readOnly value={publicUrl} className="font-mono text-xs" />
                <Button type="button" onClick={copy} variant="outline">
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button onClick={() => setOpen(false)} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="expires_in_hours">Expires in</Label>
              <select
                id="expires_in_hours"
                name="expires_in_hours"
                defaultValue={6}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={24}>24 hours</option>
                <option value={72}>3 days</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="passcode">Passcode (optional, 4 digits)</Label>
              <Input
                id="passcode"
                name="passcode"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                placeholder="0000"
              />
              <p className="text-xs text-muted-foreground">
                Protects the link against leaks. Viewer needs this code to see
                your location. Locks out after 5 wrong attempts.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create link"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
