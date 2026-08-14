import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/modules/identity";
import AppShell from "@/components/flow/AppShell";
import FullScreenMessage from "@/components/flow/FullScreenMessage";

export default async function FlowLayout({ children }: { children: ReactNode }) {
  const context = await getCurrentUserContext();

  // Middleware already blocks signed-out requests; this is the defensive
  // fallback if the session expired between the middleware check and here.
  if (!context) {
    redirect("/login");
  }

  if (!context.currentMembership) {
    switch (context.accountStatus) {
      case "suspended":
        return (
          <FullScreenMessage title="Acesso suspenso">
            Seu acesso à organização está suspenso. Fale com um administrador para reativá-lo.
          </FullScreenMessage>
        );
      case "removed":
        return (
          <FullScreenMessage title="Acesso removido">
            Seu acesso a esta organização foi removido. Fale com um administrador se isso for um
            engano.
          </FullScreenMessage>
        );
      case "invited_only":
        return (
          <FullScreenMessage title="Convite pendente">
            Você tem um convite pendente para esta organização, mas ainda não foi ativado. Fale com
            quem te convidou.
          </FullScreenMessage>
        );
      default:
        return (
          <FullScreenMessage title="Nenhuma organização disponível">
            Sua conta está autenticada, mas não possui um vínculo ativo com nenhuma organização do
            BBOLD Flow. Peça a um administrador para te convidar.
          </FullScreenMessage>
        );
    }
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
