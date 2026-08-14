"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { flowNavItems } from "./nav-items";
import UserFooter from "./UserFooter";
import Tooltip from "./ui/Tooltip";

const COLLAPSE_STORAGE_KEY = "bbold-flow:sidebar-collapsed";

export default function Sidebar({
  permissions,
  userName,
  userEmail,
  roleName,
}: {
  permissions: string[];
  userName: string;
  userEmail: string;
  roleName: string;
}) {
  const pathname = usePathname();
  const permissionSet = new Set(permissions);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const items = flowNavItems.filter(
    (item) => item.permission === null || permissionSet.has(item.permission)
  );

  return (
    <nav
      aria-label="Navegação principal"
      className={`flex h-full shrink-0 flex-col border-r border-flow-border bg-flow-panel transition-[width] duration-200 ${
        collapsed ? "w-[76px]" : "w-60"
      }`}
    >
      <div className={`flex items-center justify-between px-5 pb-6 pt-7 ${collapsed ? "px-0 justify-center" : ""}`}>
        {collapsed ? (
          <p className="text-lg font-bold text-flow-yellow">B</p>
        ) : (
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-flow-yellow">BBOLD</p>
            <p className="text-lg font-semibold leading-tight text-flow-text-primary">Flow</p>
          </div>
        )}
      </div>

      <ul className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const isActive =
            item.href === "/flow" ? pathname === "/flow" : pathname.startsWith(item.href);
          const Icon = item.icon;

          const link = (
            <Link
              href={item.href}
              aria-label={item.label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flow-yellow ${
                collapsed ? "justify-center px-0" : ""
              } ${
                isActive
                  ? "bg-flow-yellow text-black"
                  : "text-flow-text-primary hover:bg-flow-panel-alt"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              {!collapsed && item.label}
            </Link>
          );

          return (
            <li key={item.key}>{collapsed ? <Tooltip label={item.label}>{link}</Tooltip> : link}</li>
          );
        })}
      </ul>

      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-flow-text-muted transition-colors hover:bg-flow-panel-alt hover:text-flow-text-primary ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} strokeWidth={1.75} />
          ) : (
            <>
              <PanelLeftClose size={16} strokeWidth={1.75} />
              Recolher
            </>
          )}
        </button>
      </div>

      <UserFooter name={userName} email={userEmail} roleName={roleName} collapsed={collapsed} />
    </nav>
  );
}
