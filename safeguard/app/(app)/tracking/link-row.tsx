"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Check, Trash2, Lock } from "lucide-react";
import { revokeTrackingLink } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LinkRow({
  id,
  token,
  hasPasscode,
  expiresAt,
  viewCount,
  revokedAt,
}: {
  id: string;
  token: string;
  hasPasscode: boolean;
  expiresAt: string;
  viewCount: number;
  revokedAt: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/track/${token}`
      : `/track/${token}`;
  const expired = new Date(expiresAt).getTime() < Date.now();
  const status = revokedAt
    ? "revoked"
    : expired
      ? "expired"
      : "active";

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={`capitalize ${
              status === "active"
                ? "bg-success/20 text-success border-success/40"
                : status === "expired"
                  ? "bg-muted text-muted-foreground border-border"
                  : "bg-destructive/20 text-destructive border-destructive/40"
            }`}
          >
            {status}
          </Badge>
          {hasPasscode ? (
            <Badge className="bg-primary/15 text-primary border-primary/30">
              <Lock className="size-3" />
              Passcode
            </Badge>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {viewCount} view{viewCount === 1 ? "" : "s"}
          </span>
        </div>
        <time className="text-xs text-muted-foreground shrink-0">
          Expires {new Date(expiresAt).toLocaleString()}
        </time>
      </div>

      <div className="flex gap-2 items-center">
        <code className="flex-1 text-xs font-mono bg-muted/50 rounded px-2 py-1.5 truncate">
          {url}
        </code>
        {status === "active" ? (
          <>
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await revokeTrackingLink(id);
                  if (res.ok) toast.success("Link revoked.");
                  else toast.error(res.error ?? "Failed.");
                })
              }
            >
              <Trash2 className="size-4" />
              Revoke
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
