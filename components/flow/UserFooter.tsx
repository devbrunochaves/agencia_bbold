"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Moon } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import Avatar from "./ui/Avatar";
import Tooltip from "./ui/Tooltip";

export default function UserFooter({
  name,
  email,
  roleName,
  collapsed = false,
}: {
  name: string;
  email: string;
  roleName: string;
  collapsed?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const logoutButton = (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label="Sair"
      className="rounded-md p-1.5 text-flow-text-muted transition-colors hover:bg-flow-panel-alt hover:text-flow-danger disabled:opacity-50"
    >
      <LogOut size={16} strokeWidth={1.75} />
    </button>
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-3 border-t border-flow-border p-3">
        <Tooltip label={`${name} — ${roleName}`}>
          <Avatar name={name || email} size="sm" />
        </Tooltip>
        <Tooltip label="Sair">{logoutButton}</Tooltip>
      </div>
    );
  }

  return (
    <div className="border-t border-flow-border p-3">
      <div className="mb-2 flex items-center justify-end gap-1">
        <button
          type="button"
          disabled
          aria-label="Tema — em breve"
          title="Tema — em breve"
          className="cursor-not-allowed rounded-md p-1.5 text-flow-text-muted/50"
        >
          <Moon size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          disabled
          aria-label="Notificações — em breve"
          title="Notificações — em breve"
          className="cursor-not-allowed rounded-md p-1.5 text-flow-text-muted/50"
        >
          <Bell size={16} strokeWidth={1.75} />
        </button>
        {logoutButton}
      </div>

      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <Avatar name={name || email} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-flow-text-primary">{name || email}</p>
          <p className="truncate text-xs capitalize text-flow-text-muted">{roleName}</p>
        </div>
      </div>
    </div>
  );
}
