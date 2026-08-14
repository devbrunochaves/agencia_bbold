"use client";

import { useState, type FormEvent } from "react";
import { Badge, Button, Checkbox, Drawer, Input } from "@/components/flow/ui";
import { PERMISSION_GROUPS } from "@/modules/identity/domain/access";
import type { RoleWithPermissions } from "@/modules/identity/domain/roles";
import { createRoleAction, updateRolePermissionsAction } from "./actions";

function RolePermissionsEditor({
  role,
  editable,
  onSaved,
}: {
  role: RoleWithPermissions;
  editable: boolean;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(role.permissionKeys));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSave() {
    setLoading(true);
    setMessage(null);
    const result = await updateRolePermissionsAction({ roleId: role.id, permissionKeys: [...selected] });
    setLoading(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage("Salvo.");
    onSaved();
  }

  return (
    <div className="rounded-xl border border-flow-border bg-flow-panel-alt p-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-flow-text-primary">{role.name}</p>
          {role.isSystem && <Badge tone="neutral">Sistema</Badge>}
        </div>
        <span className="text-xs text-flow-text-muted">{role.permissionKeys.length} permissões</span>
      </button>

      {expanded && (
        <div className="mt-4 flex flex-col gap-4">
          {role.isSystem ? (
            <p className="text-xs text-flow-text-muted">
              Papéis do sistema (Owner, Admin, Member) não podem ser editados.
            </p>
          ) : (
            <>
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-flow-text-muted/70">
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {group.permissions.map((p) => (
                      <Checkbox
                        key={p.key}
                        id={`role-${role.id}-${p.key}`}
                        label={p.label}
                        checked={selected.has(p.key)}
                        onChange={() => toggle(p.key)}
                        disabled={!editable}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {editable && (
                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={handleSave} disabled={loading}>
                    {loading ? "Salvando..." : "Salvar permissões"}
                  </Button>
                  {message && <span className="text-xs text-flow-text-muted">{message}</span>}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function RolesDrawer({
  open,
  onClose,
  onChanged,
  roles,
  canManage,
}: {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
  roles: RoleWithPermissions[];
  canManage: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [permissionKeys, setPermissionKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleNewPermission(key: string) {
    setPermissionKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    setError(null);
    const result = await createRoleAction({ name: name.trim(), permissionKeys: [...permissionKeys] });
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setName("");
    setPermissionKeys(new Set());
    setCreating(false);
    onChanged();
  }

  return (
    <Drawer open={open} onClose={onClose} title="Gerenciar papéis">
      <div className="flex flex-col gap-4">
        {roles.map((role) => (
          <RolePermissionsEditor key={role.id} role={role} editable={canManage} onSaved={onChanged} />
        ))}

        {canManage && (
          <div className="border-t border-flow-border pt-4">
            {!creating ? (
              <Button variant="secondary" onClick={() => setCreating(true)}>
                + Novo papel
              </Button>
            ) : (
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-flow-text-muted">Nome</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Designer" />
                </div>
                <div className="flex flex-col gap-4">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-flow-text-muted/70">
                        {group.label}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {group.permissions.map((p) => (
                          <Checkbox
                            key={p.key}
                            id={`new-role-${p.key}`}
                            label={p.label}
                            checked={permissionKeys.has(p.key)}
                            onChange={() => toggleNewPermission(p.key)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {error && <p className="text-xs text-flow-danger">{error}</p>}
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setCreating(false)} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Criando..." : "Criar papel"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
