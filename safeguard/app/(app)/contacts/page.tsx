import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/admin-guard";
import {
  PageContainer,
  PageHeader,
} from "@/components/layout/page-header";
import { ContactList } from "./contact-list";
import { AddContactDialog } from "./add-contact-dialog";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: contacts } = await supabase
    .from("emergency_contacts")
    .select("id, name, phone, email, relationship, is_primary")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  const list = contacts ?? [];
  const full = list.length >= 5;

  return (
    <PageContainer>
      <PageHeader
        icon={Users}
        title="Trusted contacts"
        description={`${list.length} of 5 added. These are the people SafeGuard will notify when you trigger SOS.`}
        actions={<AddContactDialog full={full} />}
      />

      <ContactList contacts={list} />

      <div className="text-xs text-muted-foreground border-t border-border pt-4">
        Push reaches contacts who have SafeGuard installed. All contacts with
        an email will also receive an email notification (Wave 2).
      </div>
    </PageContainer>
  );
}
