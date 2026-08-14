import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-flow-border px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-flow-panel-alt text-flow-text-muted">
          <Icon size={20} strokeWidth={1.75} />
        </div>
      )}
      <p className="text-sm font-medium text-flow-text-primary">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-flow-text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
