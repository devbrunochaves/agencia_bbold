"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface DropdownMenuItem {
  key: string;
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

interface MenuPosition {
  top: number;
  left: number;
}

const MENU_WIDTH = 180; // matches min-w-[180px] below — needed to flip off the right edge
const VIEWPORT_MARGIN = 8;

export default function DropdownMenu({
  trigger,
  items,
  align = "end",
}: {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Positioned against the viewport (fixed) from the trigger's own
  // getBoundingClientRect, then portaled to document.body — the menu never
  // lives inside the table's `overflow-x-auto` container, so it can't be
  // clipped by it or by any other ancestor's overflow/stacking context.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function computePosition() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? 0;

      const spaceBelow = window.innerHeight - rect.bottom;
      const flipUp = menuHeight > 0 && spaceBelow < menuHeight + VIEWPORT_MARGIN && rect.top > menuHeight;
      const top = flipUp ? rect.top - menuHeight - 4 : rect.bottom + 4;

      let left = align === "end" ? rect.right - MENU_WIDTH : rect.left;
      left = Math.min(Math.max(left, VIEWPORT_MARGIN), window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN);

      setPosition({ top, left });
    }

    computePosition();
    window.addEventListener("scroll", computePosition, true);
    window.addEventListener("resize", computePosition);
    return () => {
      window.removeEventListener("scroll", computePosition, true);
      window.removeEventListener("resize", computePosition);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // The menu is portaled to the end of <body>, so it sits outside the
  // trigger's natural Tab order — focus it explicitly on open, trap Tab
  // inside it while open, and hand focus back to the trigger on close so
  // keyboard navigation reads the same as a non-portaled menu would. The
  // wasOpen guard keeps this from stealing focus on initial mount, when
  // open starts false and there's nothing to return focus from.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open) {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    } else if (wasOpenRef.current) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleTab(event: KeyboardEvent) {
      if (event.key !== "Tab" || !menuRef.current) return;
      const items = menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]');
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              visibility: position ? "visible" : "hidden",
            }}
            className="z-40 min-w-[180px] rounded-xl border border-flow-border bg-flow-panel-alt p-1 shadow-flow-lg"
          >
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                }}
                className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-flow-surface-hover ${
                  item.danger ? "text-flow-danger" : "text-flow-text-primary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
