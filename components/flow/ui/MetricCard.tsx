import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export type MetricTone = "neutral" | "success" | "danger" | "warning" | "info" | "waiting";

const iconToneClass: Record<MetricTone, string> = {
  neutral: "bg-flow-panel-alt text-flow-text-muted",
  success: "bg-flow-success/10 text-flow-success",
  danger: "bg-flow-danger/10 text-flow-danger",
  warning: "bg-flow-yellow/10 text-flow-yellow",
  info: "bg-flow-info/10 text-flow-info",
  waiting: "bg-flow-waiting/10 text-flow-waiting",
};

export default function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  helperText,
  tone = "neutral",
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  trend?: { direction: "up" | "down"; label: string };
  helperText?: string;
  tone?: MetricTone;
}) {
  return (
    <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
      <div className="flex items-start justify-between">
        <p className="text-sm text-flow-text-muted">{label}</p>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconToneClass[tone]}`}>
            <Icon size={16} strokeWidth={1.75} />
          </div>
        )}
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-flow-text-primary">{value}</p>

      {(trend || helperText) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                trend.direction === "up" ? "text-flow-success" : "text-flow-danger"
              }`}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight size={13} strokeWidth={2} />
              ) : (
                <ArrowDownRight size={13} strokeWidth={2} />
              )}
              {trend.label}
            </span>
          )}
          {helperText && <span className="text-flow-text-muted">{helperText}</span>}
        </div>
      )}
    </div>
  );
}
