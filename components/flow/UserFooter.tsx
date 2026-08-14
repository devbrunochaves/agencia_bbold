"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Moon } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function UserFooter({
  name,
  email,
  roleName,
}: {
  name: string;
  email: string;
  roleName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const initials = (name || email)
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="border-t border-flow-border p-3">
      <div className="mb-2 flex items-center justify-end gap-1">
        <button
          type="button"
          disabled
          title="Tema — em breve"
          className="cursor-not-allowed rounded-md p-1.5 text-flow-text-muted/50"
        >
          <Moon size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          disabled
          title="Notificações — em breve"
          className="cursor-not-allowed rounded-md p-1.5 text-flow-text-muted/50"
        >
          <Bell size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          title="Sair"
          className="rounded-md p-1.5 text-flow-text-muted transition-colors hover:bg-flow-panel-alt hover:text-flow-danger disabled:opacity-50"
        >
          <LogOut size={16} strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-flow-yellow text-xs font-semibold text-black">
          {initials || "?"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-flow-text-primary">{name || email}</p>
          <p className="truncate text-xs capitalize text-flow-text-muted">{roleName}</p>
        </div>
      </div>
    </div>
  );
}
