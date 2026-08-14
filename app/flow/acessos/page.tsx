import type { Metadata } from "next";
import { listMembers, listRoles, listPermissions, requirePermission } from "@/modules/identity";
import { listClients } from "@/modules/clients";
import AccessDenied from "@/components/flow/AccessDenied";
import AcessosView from "./AcessosView";

export const metadata: Metadata = {
  title: "Acessos — BBOLD Flow",
  robots: { index: false, follow: false },
};

export default async function AcessosPage() {
  const check = await requirePermission("members.view");
  if (!check.ok) return <AccessDenied />;

  const canManage = check.context.currentMembership!.permissions.has("members.manage");

  const [members, roles, permissions, clients] = await Promise.all([
    listMembers(),
    listRoles(),
    listPermissions(),
    listClients(),
  ]);

  return (
    <AcessosView
      members={members}
      roles={roles}
      permissions={permissions}
      clients={clients}
      canManage={canManage}
      currentUserId={check.context.user.id}
    />
  );
}
