import type { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-border">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-1 flex items-center justify-center size-10 rounded-xl bg-primary/15 text-primary shrink-0">
            <Icon className="size-5" />
          </span>
        ) : null}
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold leading-tight tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="text-sm md:text-base text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-10 space-y-8">
      {children}
    </div>
  );
}

export function Section({
  title,
  description,
  children,
  action,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      {title ? (
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold">{title}</h2>
            {description ? (
              <p className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
