"use client";

import { useState, type FormEvent } from "react";
import { Button, Checkbox, Drawer, Input, Select } from "@/components/flow/ui";
import { InviteMemberSchema, type InviteMemberInput } from "@/modules/identity/domain/schemas";
import type { ClientAccessMode } from "@/modules/identity/domain/types";
import type { RoleWithPermissions } from "@/modules/identity/domain/roles";
import type { Client } from "@/modules/clients/domain/types";
import { inviteMemberAction } from "./actions";

export default function InviteDrawer({
  open,
  onClose,
  onInvited,
  roles,
  clients,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
  roles: RoleWithPermissions[];
  clients: Client[];
}) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(roles.find((r) => r.key === "member")?.id ?? roles[0]?.id ?? "");
  const [accessMode, setAccessMode] = useState<ClientAccessMode>("all");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleClient(clientId: string) {
    setSelectedClientIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  }

  function reset() {
    setEmail("");
    setAccessMode("all");
    setSelectedClientIds([]);
    setErrors({});
    setSubmitError(null);
    setResultMessage(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    const payload: InviteMemberInput = {
      email,
      roleId,
      clientAccessMode: accessMode,
      clientIds: accessMode === "restricted" ? selectedClientIds : [],
    };

    const parsed = InviteMemberSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setLoading(true);
    const result = await inviteMemberAction(parsed.data);
    setLoading(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    setResultMessage(
      result.data.emailSent
        ? "Convite criado e e-mail enviado."
        : "Convite pendente criado. O envio automático de e-mail não está configurado nesta sessão — compartilhe o acesso manualmente com a pessoa por enquanto."
    );
    onInvited();
  }

  return (
    <Drawer
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Convidar pessoa"
      footer={
        resultMessage ? (
          <Button
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Fechar
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" form="invite-member-form" disabled={loading}>
              {loading ? "Enviando..." : "Convidar"}
            </Button>
          </>
        )
      }
    >
      {resultMessage ? (
        <p className="text-sm text-flow-text-secondary">{resultMessage}</p>
      ) : (
        <form id="invite-member-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-flow-text-muted">E-mail</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@agenciabbold.com.br" />
            {errors.email && <p className="text-xs text-flow-danger">{errors.email}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-flow-text-muted">Papel</label>
            <Select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
            {errors.roleId && <p className="text-xs text-flow-danger">{errors.roleId}</p>}
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-flow-text-muted">Acesso aos clientes</label>
            <div className="flex flex-col gap-2 rounded-lg border border-flow-border p-3">
              <label className="flex items-center gap-2 text-sm text-flow-text-primary">
                <input
                  type="radio"
                  name="access-mode"
                  checked={accessMode === "all"}
                  onChange={() => setAccessMode("all")}
                  className="accent-flow-yellow"
                />
                Todos os clientes
              </label>
              <label className="flex items-center gap-2 text-sm text-flow-text-primary">
                <input
                  type="radio"
                  name="access-mode"
                  checked={accessMode === "restricted"}
                  onChange={() => setAccessMode("restricted")}
                  className="accent-flow-yellow"
                />
                Somente selecionados
              </label>
            </div>

            {accessMode === "restricted" && (
              <div className="flex max-h-52 flex-col gap-1.5 overflow-y-auto rounded-lg border border-flow-border p-3">
                {clients.length === 0 ? (
                  <p className="text-xs text-flow-text-muted">Nenhum cliente cadastrado ainda.</p>
                ) : (
                  clients.map((client) => (
                    <Checkbox
                      key={client.id}
                      id={`invite-client-${client.id}`}
                      label={client.name}
                      checked={selectedClientIds.includes(client.id)}
                      onChange={() => toggleClient(client.id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {submitError && (
            <p role="alert" className="text-sm text-flow-danger">
              {submitError}
            </p>
          )}
        </form>
      )}
    </Drawer>
  );
}
