import type { LucideIcon } from "lucide-react";

export function PageStub({
  title,
  wave,
  description,
  icon: Icon,
  bullets,
}: {
  title: string;
  wave: string;
  description: string;
  icon: LucideIcon;
  bullets: string[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-8 md:py-12 space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center size-11 rounded-2xl bg-primary/15 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {wave}
          </p>
          <h1 className="font-heading text-2xl md:text-3xl font-bold leading-tight">
            {title}
          </h1>
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed">{description}</p>

      <div className="rounded-2xl border border-border bg-card/60 p-6">
        <h2 className="font-heading text-base font-semibold mb-3">
          Lands in this wave
        </h2>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
