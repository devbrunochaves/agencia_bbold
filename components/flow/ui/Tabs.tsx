"use client";

import { useState, type ReactNode } from "react";

export interface TabItem {
  key: string;
  label: string;
  content: ReactNode;
}

export default function Tabs({
  items,
  defaultKey,
}: {
  items: TabItem[];
  defaultKey?: string;
}) {
  const [active, setActive] = useState(defaultKey ?? items[0]?.key);
  const activeItem = items.find((item) => item.key === active) ?? items[0];

  return (
    <div>
      <div role="tablist" className="flex items-center gap-1 border-b border-flow-border px-8">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={item.key === active}
            onClick={() => setActive(item.key)}
            className={`relative px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none ${
              item.key === active
                ? "text-flow-text-primary"
                : "text-flow-text-muted hover:text-flow-text-secondary"
            }`}
          >
            {item.label}
            {item.key === active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-flow-yellow" />
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel">{activeItem?.content}</div>
    </div>
  );
}
