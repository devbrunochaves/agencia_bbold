"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, UserPlus, Users } from "lucide-react";
import PageHeader from "@/components/flow/PageHeader";
import { Avatar, Badge, Button, EmptyState, MetricCard, PageContainer, StatusBadge } from "@/components/flow/ui";
import type { Member } from "@/modules/identity/domain/members";
import type { RoleWithPermissions, Permission } from "@/modules/identity/domain/roles";
import type { Client } from "@/modules/clients/domain/types";
import InviteDrawer from "./InviteDrawer";
import MemberDrawer from "./MemberDrawer";
import RolesDrawer from "./RolesDrawer";

export default function AcessosView({
  members,
  roles,
  permissions,
  clients,
  canManage,
  currentUserId,
}: {
  members: Member[];
  roles: RoleWithPermissions[];
  permissions: Permission[];
  clients: Client[];
  canManage: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const activeCount = members.filter((m) => m.status === "active").length;
  const invitedCount = members.filter((m) => m.status === "invited").length;

  function refresh() {
    setSelectedMember(null);
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title="Acessos"
        subtitle="Equipe e permissões"
        actions={
          canManage ? (
            <>
              <Button variant="secondary" icon={<Settings2 size={16} strokeWidth={2} />} onClick={() => setRolesOpen(true)}>
                Gerenciar papéis
              </Button>
              <Button icon={<UserPlus size={16} strokeWidth={2} />} onClick={() => setInviteOpen(true)}>
                Convidar pessoa
              </Button>
            </>
          ) : undefined
        }
      />

      <PageContainer>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Membros" value={String(members.length)} />
          <MetricCard label="Ativos" value={String(activeCount)} tone="success" />
          <MetricCard label="Convites pendentes" value={String(invitedCount)} tone="waiting" />
          <MetricCard label="Papéis" value={String(roles.length)} tone="neutral" />
        </div>

        <div className="mt-6">
          {members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum membro ainda"
              description="Convide a primeira pessoa para a organização."
              action={canManage ? <Button onClick={() => setInviteOpen(true)}>+ Convidar pessoa</Button> : undefined}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {members.map((member) => (
                <button
                  key={member.membershipId}
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className="flex flex-col gap-4 rounded-2xl border border-flow-border bg-flow-panel p-5 text-left transition-colors hover:border-flow-border-strong sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} />
                    <div>
                      <p className="text-sm font-medium text-flow-text-primary">
                        {member.name}
                        {member.userId === currentUserId && (
                          <span className="ml-2 text-xs text-flow-text-muted">(você)</span>
                        )}
                      </p>
                      <p className="text-xs text-flow-text-muted">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge tone={member.roleKey === "owner" ? "warning" : "neutral"}>{member.roleName}</Badge>
                    <StatusBadge status={member.status} />
                  </div>

                  <div className="text-xs text-flow-text-muted sm:text-right">
                    {member.clientAccessMode === "all"
                      ? "Todos os clientes"
                      : `${member.allowedClientIds.length} cliente(s) selecionado(s)`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PageContainer>

      <InviteDrawer
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={() => router.refresh()}
        roles={roles}
        clients={clients}
      />

      <MemberDrawer
        open={selectedMember !== null}
        onClose={() => setSelectedMember(null)}
        onChanged={refresh}
        member={selectedMember}
        roles={roles}
        clients={clients}
        canManage={canManage}
        isSelf={selectedMember?.userId === currentUserId}
      />

      <RolesDrawer
        open={rolesOpen}
        onClose={() => setRolesOpen(false)}
        onChanged={() => router.refresh()}
        roles={roles}
        canManage={canManage}
      />
    </>
  );
}
