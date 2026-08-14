import type { ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: string[];
}) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-flow-border px-6 py-6 lg:px-8">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <p className="mb-1.5 text-xs text-flow-text-muted">{breadcrumbs.join(" / ")}</p>
        )}
        <h1 className="text-xl font-semibold text-flow-text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-flow-text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
