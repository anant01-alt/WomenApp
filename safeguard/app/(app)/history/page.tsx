import { History, MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth/admin-guard";
import { createClient } from "@/lib/supabase/server";
import {
  PageContainer,
  PageHeader,
} from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  active: "bg-destructive/20 text-destructive border-destructive/40",
  resolved: "bg-success/20 text-success border-success/40",
  cancelled: "bg-muted text-muted-foreground border-border",
  false_alarm: "bg-warning/20 text-warning border-warning/40",
};

export default async function HistoryPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: alerts } = await supabase
    .from("alerts")
    .select(
      "id, type, status, triggered_by, message, location_lat, location_lng, location_address, audio_url, created_at, resolved_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const list = alerts ?? [];

  return (
    <PageContainer>
      <PageHeader
        icon={History}
        title="Incident history"
        description={`${list.length} alert${list.length === 1 ? "" : "s"} · most recent 50 shown.`}
      />

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground text-sm">
          No alerts yet. When you trigger SOS, it&apos;ll show up here.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-border bg-card/60 p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Badge
                    className={`capitalize ${STATUS_COLOR[a.status] ?? ""}`}
                  >
                    {a.status.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground capitalize">
                    {a.type.replace("_", " ")} · {a.triggered_by.replace("_", " ")}
                  </span>
                </div>
                <time className="text-xs text-muted-foreground shrink-0">
                  {new Date(a.created_at).toLocaleString()}
                </time>
              </div>

              {a.message ? (
                <p className="text-sm mb-2">{a.message}</p>
              ) : null}

              {a.location_lat !== null && a.location_lng !== null ? (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${a.location_lat}&mlon=${a.location_lng}#map=17/${a.location_lat}/${a.location_lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <MapPin className="size-3" />
                  {a.location_address ?? `${a.location_lat?.toFixed(4)}, ${a.location_lng?.toFixed(4)}`}
                </a>
              ) : null}

              {a.resolved_at ? (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                  Resolved {new Date(a.resolved_at).toLocaleString()}
                </p>
              ) : null}

              {a.audio_url ? (
                <audio
                  controls
                  src={a.audio_url}
                  className="w-full mt-3 h-10"
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
