import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({
  children,
  userName,
  userEmail,
  roleName,
  permissions,
}: {
  children: ReactNode;
  userName: string;
  userEmail: string;
  roleName: string;
  permissions: string[];
}) {
  return (
    <div className="flex h-screen min-w-[1024px] overflow-x-auto overflow-y-hidden bg-flow-bg text-flow-text-primary">
      <Sidebar
        permissions={permissions}
        userName={userName}
        userEmail={userEmail}
        roleName={roleName}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
