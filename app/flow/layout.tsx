import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/modules/identity";
import AppShell from "@/components/flow/AppShell";

export default async function FlowLayout({ children }: { children: ReactNode }) {
  const context = await getCurrentUserContext();

  // Middleware already blocks signed-out requests; this is the defensive
  // fallback if the session expired between the middleware check and here.
  if (!context) {
    redirect("/login");
  }

  if (!context.currentMembership) {
    return (
      <div className="dark flex h-screen items-center justify-center bg-flow-bg px-4 text-center text-flow-text-primary">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-flow-yellow">BBOLD</p>
          <h1 className="mt-1 text-xl font-semibold">Sem acesso a nenhuma organização</h1>
          <p className="mt-2 max-w-sm text-sm text-flow-text-muted">
            Sua conta está autenticada, mas ainda não possui um convite ativo em nenhuma
            organização do BBOLD Flow. Peça a um administrador para te convidar.
          </p>
        </div>
      </div>
    );
  }

  const { user, currentMembership } = context;

  return (
    <AppShell
      userName={user.fullName ?? user.email}
      userEmail={user.email}
      roleName={currentMembership.role.name}
      permissions={Array.from(currentMembership.permissions)}
    >
      {children}
    </AppShell>
  );
}
