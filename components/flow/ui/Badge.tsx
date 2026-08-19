import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "success" | "danger" | "warning" | "info" | "waiting";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-flow-panel-alt text-flow-text-secondary border-flow-border",
  success: "bg-flow-success/10 text-flow-success border-flow-success/25",
  danger: "bg-flow-danger/10 text-flow-danger border-flow-danger/25",
  warning: "bg-flow-warning/10 text-flow-warning border-flow-warning/25",
  info: "bg-flow-info/10 text-flow-info border-flow-info/25",
  waiting: "bg-flow-waiting/10 text-flow-waiting border-flow-waiting/25",
};

export default function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
