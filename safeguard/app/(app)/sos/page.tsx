import { Siren as SirenIcon } from "lucide-react";
import { requireUser } from "@/lib/auth/admin-guard";
import { createClient } from "@/lib/supabase/server";
import {
  PageContainer,
  PageHeader,
  Section,
} from "@/components/layout/page-header";
import { SosButton } from "./sos-button";
import { ActiveAlertPanel } from "./active-alert-panel";
import { EmergencyDial } from "@/components/sos/emergency-dial";
import { Siren } from "@/components/sos/siren";
import { ShakeArm } from "@/components/sos/shake-arm";

export const dynamic = "force-dynamic";

export default async function SosPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: active } = await supabase
    .from("alerts")
    .select("id, created_at, message, location_lat, location_lng")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: contactsCount } = await supabase
    .from("emergency_contacts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const hasContacts = (contactsCount ?? 0) > 0;

  return (
    <PageContainer>
      <PageHeader
        icon={SirenIcon}
        title="SOS"
        description="Hold the button for three seconds. We notify your contacts, capture your live location, and stay connected until you mark yourself safe."
      />

      {/* Emergency services dial is ALWAYS visible — this is a safety app,
          a phone number that reaches real police is more important than any
          feature we can build ourselves. */}
      <Section
        title="Emergency services"
        description="Tapping calls these numbers on a phone. Works regardless of SafeGuard's state."
      >
        <EmergencyDial />
      </Section>

      {active ? (
        <ActiveAlertPanel
          alertId={active.id}
          createdAt={active.created_at}
          message={active.message}
          lat={active.location_lat}
          lng={active.location_lng}
        />
      ) : (
        <Section
          title="Trigger SOS"
          description="Hold 3 seconds to send your live location + alert to every trusted contact."
        >
          <div className="flex flex-col items-center py-4 md:py-6">
            <SosButton disabled={!hasContacts} />
            {!hasContacts ? (
              <p className="mt-6 text-sm text-warning text-center max-w-md">
                Add at least one trusted contact first — SOS has no one to
                notify without them.
              </p>
            ) : null}
          </div>
        </Section>
      )}

      <Section
        title="Tools that buy you seconds"
        description="Each of these works independently of the SOS button."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Siren />
          <ShakeArm />
        </div>
      </Section>

      <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm">
        <strong className="text-warning">Remember:</strong> SafeGuard is not a
        substitute for emergency services. Call 112 / 911 / 1091 for
        life-threatening situations.
      </div>
    </PageContainer>
  );
}
