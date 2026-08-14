"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export default function Accordion({
  title,
  subtitle,
  total,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  total?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-flow-border bg-flow-panel-alt">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-flow-surface-hover"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-flow-text-primary">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-flow-text-muted">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {total && <span className="text-sm font-semibold text-flow-text-primary">{total}</span>}
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className={`text-flow-text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open && <div className="border-t border-flow-border px-5 py-4">{children}</div>}
    </div>
  );
}
