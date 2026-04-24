import { Settings, BellRing, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/admin-guard";
import {
  PageContainer,
  PageHeader,
  Section,
} from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "./profile-form";
import { PushToggle } from "./push-toggle";
import { deleteAccount } from "./actions";

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, address, timezone, age_confirmed_18")
    .eq("id", user.id)
    .maybeSingle();

  const { data: existing } = await supabase
    .from("push_subscriptions")
    .select("endpoint")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return (
    <PageContainer>
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Manage your profile, notifications, and account."
      />

      <Section
        title="Profile"
        description="Shown to your contacts when you send an alert."
      >
        <Card>
          <CardContent className="pt-6">
            <ProfileForm
              initial={{
                full_name: profile?.full_name ?? "",
                phone: profile?.phone ?? null,
                address: profile?.address ?? null,
                timezone: profile?.timezone ?? "UTC",
                age_confirmed_18: profile?.age_confirmed_18 ?? false,
              }}
            />
          </CardContent>
        </Card>
      </Section>

      <Section
        title="Notifications"
        description="Web push lets SafeGuard reach you and your contacts even when the app is closed."
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <BellRing className="size-4 text-primary" />
              Web push
            </CardTitle>
            <CardDescription>
              On iPhone, you must first &quot;Add to Home Screen&quot; before
              granting notifications (iOS 16.4+).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PushToggle
              vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
              initialEnabled={!!existing}
            />
          </CardContent>
        </Card>
      </Section>

      <Section
        title="Danger zone"
        description="Permanently delete your account and all associated data."
      >
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base text-destructive">
              <Trash2 className="size-4" />
              Delete account
            </CardTitle>
            <CardDescription>
              Cascades through alerts, contacts, location logs, and
              subscriptions. Cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={deleteAccount}>
              <Button type="submit" variant="destructive" size="sm">
                Delete my account
              </Button>
            </form>
          </CardContent>
        </Card>
      </Section>
    </PageContainer>
  );
}
