import { Share2 } from "lucide-react";
import { requireUser } from "@/lib/auth/admin-guard";
import { createClient } from "@/lib/supabase/server";
import {
  PageContainer,
  PageHeader,
} from "@/components/layout/page-header";
import { CreateTrackingDialog } from "./create-dialog";
import { LinkRow } from "./link-row";

export const dynamic = "force-dynamic";

export default async function TrackingPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("tracking_links")
    .select(
      "id, token, passcode_hash, expires_at, revoked_at, view_count, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <PageContainer>
      <PageHeader
        icon={Share2}
        title="Share live location"
        description="Generate a link anyone can open to watch your live location. Passcode-gated, time-limited, and revocable."
        actions={<CreateTrackingDialog />}
      />

      {!links || links.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground text-sm">
          No tracking links yet. Create one above to share your live location
          with someone.
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((l) => (
            <LinkRow
              key={l.id}
              id={l.id}
              token={l.token}
              hasPasscode={!!l.passcode_hash}
              expiresAt={l.expires_at}
              viewCount={l.view_count}
              revokedAt={l.revoked_at}
            />
          ))}
        </div>
      )}

      <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 text-xs">
        <strong className="text-warning">Security.</strong> Tokens are 32-byte
        random. Passcodes are bcrypt-hashed. Five failed passcode attempts
        lock the link for 15 minutes. Revoke anytime — it stops working
        instantly.
      </div>
    </PageContainer>
  );
}
