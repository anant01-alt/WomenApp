"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { addContact, type ActionState } from "./actions";
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

const RELATIONSHIPS = [
  "mother",
  "father",
  "sister",
  "brother",
  "spouse",
  "friend",
  "colleague",
  "other",
] as const;

export function AddContactDialog({ full }: { full: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    ActionState | undefined,
    FormData
  >(addContact, undefined);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Contact added.");
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" disabled={full}>
            <Plus className="size-4" />
            {full ? "Max 5 reached" : "Add contact"}
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a trusted contact</DialogTitle>
          <DialogDescription>
            They&apos;ll be notified when you trigger SOS. Phone or email is
            required.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required maxLength={120} autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="relationship">Relationship</Label>
              <select
                id="relationship"
                name="relationship"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm capitalize"
                defaultValue="mother"
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r} className="capitalize">
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                name="is_primary"
                className="accent-primary"
              />
              Make primary
            </label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone (international)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+919876543210"
              pattern="^\+[1-9]\d{7,14}$"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>

          <label className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-lg border border-border bg-muted/30">
            <input
              type="checkbox"
              name="consent_confirmed"
              required
              className="mt-0.5 accent-primary"
            />
            <span>
              I have this person&apos;s permission to notify them in an
              emergency. The first notification they receive will include an
              opt-out link.
            </span>
          </label>

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
              {pending ? "Saving…" : "Add contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
