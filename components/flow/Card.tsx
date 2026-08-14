import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-flow-border bg-flow-panel p-6 ${className}`}
    >
      {children}
    </div>
  );
}
