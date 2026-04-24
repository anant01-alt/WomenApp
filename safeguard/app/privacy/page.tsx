import Link from "next/link";

export const metadata = {
  title: "Privacy — SafeGuard",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toISOString().slice(0, 10)}
        </p>
      </div>

      <section className="space-y-4 text-muted-foreground leading-relaxed">
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          What we collect
        </h2>
        <p>
          Your email (for authentication), your name, trusted-contact names and
          phone/email, your GPS location while you have the app open or an
          active SOS/check-in, alert history, and optional voice SOS audio
          clips. We do not track you when no SOS or check-in is active.
        </p>

        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Why we collect it
        </h2>
        <p>
          To notify your chosen emergency contacts when you trigger an SOS, to
          show you your own incident history, and to improve the app. Location
          data is never sold, shared with advertisers, or used for any purpose
          other than the safety features you explicitly use.
        </p>

        <h2 className="font-heading text-2xl font-semibold text-foreground">
          How long we keep it
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Non-emergency location logs: <strong>30 days</strong>, then auto-deleted.
          </li>
          <li>
            Alerts and incident history: <strong>1 year</strong>, or until you
            delete your account.
          </li>
          <li>
            Voice SOS clips: <strong>90 days</strong>, then auto-deleted.
          </li>
          <li>
            Audit log: <strong>1 year</strong> (for security and incident
            investigation).
          </li>
        </ul>

        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Your rights
        </h2>
        <p>
          Under GDPR (if you&apos;re in the EU) and DPDP 2023 (if you&apos;re in India),
          you have the right to: (a) export all your data as JSON, (b) delete
          your account along with all associated data, (c) correct any
          inaccurate personal information. Both actions are available from the{" "}
          <Link href="/settings" className="text-primary hover:underline">
            Settings page
          </Link>{" "}
          once you&apos;re signed in.
        </p>

        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Emergency-contact consent
        </h2>
        <p>
          By adding a trusted contact, you confirm that you have their
          permission to notify them in an emergency. The first notification
          they receive includes an opt-out link.
        </p>

        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Not an emergency service
        </h2>
        <p>
          SafeGuard is not a substitute for emergency services. In a
          life-threatening situation, always call 112 (India / EU), 911 (US),
          or 1091 (Indian women&apos;s helpline). We do not guarantee delivery
          of any SOS notification.
        </p>

        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Contact
        </h2>
        <p>
          Privacy questions:{" "}
          <a
            href="mailto:anantkesarwani01@gmail.com"
            className="text-primary hover:underline"
          >
            anantkesarwani01@gmail.com
          </a>
        </p>
      </section>
    </main>
  );
}
