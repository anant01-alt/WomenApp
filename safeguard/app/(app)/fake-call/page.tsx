import { Phone } from "lucide-react";
import {
  PageContainer,
  PageHeader,
} from "@/components/layout/page-header";
import { FakeCallSimulator } from "./fake-call-simulator";

export default function FakeCallPage() {
  return (
    <PageContainer>
      <PageHeader
        icon={Phone}
        title="Fake call"
        description="A convincing incoming-call screen to help you exit uncomfortable situations. No data leaves your device."
      />

      <FakeCallSimulator />

      <div className="rounded-xl border border-border bg-card/40 p-4 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Tip.</strong> Start the call, then
        lock your phone. When you unlock, the call screen is waiting. Pretend
        to answer, walk away, hang up when it&apos;s safe.
      </div>
    </PageContainer>
  );
}
