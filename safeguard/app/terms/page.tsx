import Link from "next/link";

export const metadata = {
  title: "Terms — SafeGuard",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 space-y-8">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back
      </Link>

      <div>
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toISOString().slice(0, 10)}
        </p>
      </div>

      <section className="space-y-4 text-muted-foreground leading-relaxed">
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 text-base text-foreground">
          <strong className="text-warning">Critical disclaimer.</strong>{" "}
          SafeGuard is <strong>not</strong> a replacement for emergency
          services. Always call 112 (IN/EU), 911 (US), or 1091 (Indian
          women&apos;s helpline) in a life-threatening emergency. SafeGuard
          does not guarantee delivery, timing, or reliability of any
          notification.
        </div>

        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Eligibility
        </h2>
        <p>
          You must be at least 18 years old to use SafeGuard. By creating an
          account you represent that you are.
        </p>

        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Acceptable use
        </h2>
        <p>
          Do not use SafeGuard to track people without their consent, to send
          false emergency alerts, or to harass anyone. We will terminate
          accounts that abuse the service.
        </p>

        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Rate limits
        </h2>
        <p>
          To protect our infrastructure and prevent abuse, SafeGuard enforces:
          a maximum of one active alert per user at a time; a maximum of five
          SOS triggers per user per hour; and lockout after five failed
          passcode attempts on a shared tracking link.
        </p>

        <h2 className="font-heading text-2xl font-semibold text-foreground">
          No warranty
        </h2>
        <p>
          SafeGuard is provided &quot;as is&quot; without warranty of any
          kind. We do not guarantee uninterrupted availability, delivery of
          notifications, or accuracy of location data. You accept that
          internet, device, and push-notification infrastructure can fail.
        </p>

        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Changes
        </h2>
        <p>
          We may update these terms. Continued use after changes constitutes
          acceptance.
        </p>
      </section>
    </main>
  );
}
