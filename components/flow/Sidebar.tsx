"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { flowNavItems } from "./nav-items";
import UserFooter from "./UserFooter";

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

  const items = flowNavItems.filter(
    (item) => item.permission === null || permissionSet.has(item.permission)
  );

  return (
    <nav
      aria-label="Navegação principal"
      className="flex h-full w-60 shrink-0 flex-col border-r border-flow-border bg-flow-panel"
    >
      <div className="px-5 pb-6 pt-7">
        <p className="text-xs font-semibold tracking-[0.3em] text-flow-yellow">BBOLD</p>
        <p className="text-lg font-semibold leading-tight text-flow-text-primary">Flow</p>
      </div>

      <ul className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const isActive =
            item.href === "/flow" ? pathname === "/flow" : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.comingSoon) {
            return (
              <li key={item.key}>
                <div
                  className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2.5 text-sm text-flow-text-muted/60"
                  title="Em breve"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} strokeWidth={1.75} />
                    {item.label}
                  </span>
                  <span className="rounded-full border border-flow-border px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    Em breve
                  </span>
                </div>
              </li>
            );
          }

          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-flow-yellow text-black"
                    : "text-flow-text-primary hover:bg-flow-panel-alt"
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <UserFooter name={userName} email={userEmail} roleName={roleName} />
    </nav>
  );
}
