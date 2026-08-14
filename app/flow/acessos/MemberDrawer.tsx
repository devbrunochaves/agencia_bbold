"use client";

import { useEffect, useState } from "react";
import { Avatar, Badge, Button, Checkbox, Drawer, Modal, Select, StatusBadge } from "@/components/flow/ui";
import { MEMBERSHIP_STATUS_ACTIONS, type Member, type MembershipStatusTarget } from "@/modules/identity/domain/members";
import { PERMISSION_GROUPS } from "@/modules/identity/domain/access";
import type { ClientAccessMode } from "@/modules/identity/domain/types";
import type { RoleWithPermissions } from "@/modules/identity/domain/roles";
import type { Client } from "@/modules/clients/domain/types";
import {
  changeMemberStatusAction,
  updateMemberClientAccessAction,
  updateMemberRoleAction,
} from "./actions";

const STATUS_ACTION_LABEL: Record<MembershipStatusTarget, string> = {
  active: "Reativar",
  suspended: "Suspender",
  removed: "Remover",
};

export default function MemberDrawer({
  open,
  onClose,
  onChanged,
  member,
  roles,
  clients,
  canManage,
  isSelf,
}: {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
  member: Member | null;
  roles: RoleWithPermissions[];
  clients: Client[];
  canManage: boolean;
  isSelf: boolean;
}) {
  const [roleId, setRoleId] = useState(member?.roleId ?? "");
  const [accessMode, setAccessMode] = useState<ClientAccessMode>(member?.clientAccessMode ?? "all");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(member?.allowedClientIds ?? []);
  const [savingAccess, setSavingAccess] = useState(false);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<MembershipStatusTarget | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setRoleId(member.roleId);
      setAccessMode(member.clientAccessMode);
      setSelectedClientIds(member.allowedClientIds);
      setAccessMessage(null);
      setStatusMessage(null);
    }
  }, [member]);

  if (!member) return null;

  const role = roles.find((r) => r.id === roleId);
  const effectivePermissions = new Set(role?.permissionKeys ?? []);

  function toggleClient(clientId: string) {
    setSelectedClientIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  }

  async function handleSave() {
    setSavingAccess(true);
    setAccessMessage(null);

    const roleResult = roleId !== member!.roleId ? await updateMemberRoleAction({ membershipId: member!.membershipId, roleId }) : { ok: true as const, data: null };
    const accessResult = await updateMemberClientAccessAction({
      membershipId: member!.membershipId,
      clientAccessMode: accessMode,
      clientIds: accessMode === "restricted" ? selectedClientIds : [],
    });

    setSavingAccess(false);

    if (!roleResult.ok) {
      setAccessMessage(roleResult.message);
      return;
    }
    if (!accessResult.ok) {
      setAccessMessage(accessResult.message);
      return;
    }

    setAccessMessage("Salvo.");
    onChanged();
  }

  async function confirmStatusChange() {
    if (!statusConfirm) return;
    setStatusBusy(true);
    const result = await changeMemberStatusAction({ membershipId: member!.membershipId, status: statusConfirm });
    setStatusBusy(false);
    setStatusConfirm(null);

    if (!result.ok) {
      setStatusMessage(result.message);
      return;
    }
    onChanged();
  }

  const availableStatusActions = MEMBERSHIP_STATUS_ACTIONS[member.status];

  return (
    <>
      <Drawer open={open} onClose={onClose} title={`Acesso de ${member.name}`} description={member.email}>
        <div className="flex flex-col gap-7">
          <section className="flex items-center gap-3">
            <Avatar name={member.name} size="lg" />
            <div>
              <p className="text-sm font-medium text-flow-text-primary">{member.name}</p>
              <p className="text-xs text-flow-text-muted">{member.email}</p>
              <div className="mt-1">
                <StatusBadge status={member.status} />
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">Papel</h3>
            <Select value={roleId} onChange={(e) => setRoleId(e.target.value)} disabled={!canManage}>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
              Acesso aos clientes
            </h3>
            <div className="flex flex-col gap-2 rounded-lg border border-flow-border p-3">
              <label className="flex items-center gap-2 text-sm text-flow-text-primary">
                <input
                  type="radio"
                  checked={accessMode === "all"}
                  onChange={() => setAccessMode("all")}
                  disabled={!canManage}
                  className="accent-flow-yellow"
                />
                Todos os clientes
              </label>
              <label className="flex items-center gap-2 text-sm text-flow-text-primary">
                <input
                  type="radio"
                  checked={accessMode === "restricted"}
                  onChange={() => setAccessMode("restricted")}
                  disabled={!canManage}
                  className="accent-flow-yellow"
                />
                Somente selecionados
              </label>
            </div>
            {accessMode === "restricted" && (
              <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-lg border border-flow-border p-3">
                {clients.map((client) => (
                  <Checkbox
                    key={client.id}
                    id={`member-client-${client.id}`}
                    label={client.name}
                    checked={selectedClientIds.includes(client.id)}
                    onChange={() => toggleClient(client.id)}
                    disabled={!canManage}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
              Permissões efetivas
            </h3>
            <div className="flex flex-col gap-4">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-flow-text-muted/70">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.permissions.map((p) => (
                      <Badge key={p.key} tone={effectivePermissions.has(p.key) ? "success" : "neutral"}>
                        {p.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {canManage && (
            <>
              {accessMessage && <p className="text-xs text-flow-text-muted">{accessMessage}</p>}
              <Button onClick={handleSave} disabled={savingAccess}>
                {savingAccess ? "Salvando..." : "Salvar"}
              </Button>

              {availableStatusActions.length > 0 && (
                <section className="flex flex-col gap-2 border-t border-flow-border pt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
                    Status do acesso
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availableStatusActions.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={status === "removed" ? "danger" : "secondary"}
                        onClick={() => setStatusConfirm(status)}
                      >
                        {STATUS_ACTION_LABEL[status]}
                      </Button>
                    ))}
                  </div>
                  {statusMessage && <p className="text-xs text-flow-danger">{statusMessage}</p>}
                  {isSelf && (
                    <p className="text-xs text-flow-text-muted">
                      Você está editando seu próprio acesso — o sistema impede remover/suspender o
                      último Owner ativo da organização.
                    </p>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </Drawer>

      <Modal
        open={statusConfirm !== null}
        onClose={() => setStatusConfirm(null)}
        title="Confirmar alteração"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusConfirm(null)} disabled={statusBusy}>
              Voltar
            </Button>
            <Button
              variant={statusConfirm === "removed" ? "danger" : "primary"}
              onClick={confirmStatusChange}
              disabled={statusBusy}
            >
              {statusBusy ? "Aplicando..." : "Confirmar"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-flow-text-secondary">
          {statusConfirm && (
            <>
              {STATUS_ACTION_LABEL[statusConfirm]} o acesso de <strong>{member.name}</strong>?
              {statusConfirm === "removed" && " O histórico é mantido — nada é apagado."}
            </>
          )}
        </p>
      </Modal>
    </>
  );
}
