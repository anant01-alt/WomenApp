"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Star, StarOff, Trash2, Mail, Phone } from "lucide-react";
import { deleteContact, setPrimary } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  relationship: string;
  is_primary: boolean;
};

const RELATIONSHIP_EMOJI: Record<string, string> = {
  mother: "👩",
  father: "👨",
  sister: "👭",
  brother: "👬",
  spouse: "💕",
  friend: "🤝",
  colleague: "💼",
  other: "👤",
};

export function ContactList({ contacts }: { contacts: Contact[] }) {
  const [pending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!contacts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
        <p className="text-sm text-muted-foreground">
          No contacts yet. Add up to five trusted people who will be notified
          when you trigger SOS.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {contacts.map((c) => (
        <div
          key={c.id}
          className="rounded-2xl border border-border bg-card/60 p-5 hover:border-border/60"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl leading-none">
                {RELATIONSHIP_EMOJI[c.relationship] ?? "👤"}
              </span>
              <div>
                <div className="font-semibold leading-tight">{c.name}</div>
                <div className="text-xs text-muted-foreground capitalize mt-0.5">
                  {c.relationship}
                </div>
              </div>
            </div>
            {c.is_primary ? (
              <Badge className="bg-primary/20 text-primary border-primary/40 hover:bg-primary/20">
                Primary
              </Badge>
            ) : null}
          </div>

          <div className="space-y-1 text-sm">
            {c.phone ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-3.5" />
                <span className="font-mono">{c.phone}</span>
              </div>
            ) : null}
            {c.email ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-3.5" />
                <span className="truncate">{c.email}</span>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            {!c.is_primary ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await setPrimary(c.id);
                    if (res.ok) toast.success(`${c.name} is now primary.`);
                    else toast.error(res.error ?? "Failed.");
                  })
                }
              >
                <Star className="size-4" />
                Make primary
              </Button>
            ) : (
              <Button size="sm" variant="ghost" disabled className="opacity-60">
                <StarOff className="size-4" />
                Primary
              </Button>
            )}

            {confirmId === c.id ? (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await deleteContact(c.id);
                      if (res.ok) {
                        toast.success(`${c.name} removed.`);
                        setConfirmId(null);
                      } else toast.error(res.error ?? "Failed.");
                    })
                  }
                >
                  Confirm remove
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmId(null)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmId(c.id)}
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
