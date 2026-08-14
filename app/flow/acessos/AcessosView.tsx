"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import PageHeader from "@/components/flow/PageHeader";
import { Avatar, Badge, Button, Input, PageContainer, Select } from "@/components/flow/ui";
import { demoMembers } from "@/data/flow-demo/members";

const roleTone = {
  Owner: "warning",
  Admin: "info",
  Member: "neutral",
} as const;

export default function AcessosView() {
  const [invited, setInvited] = useState(false);

  return (
    <>
      <PageHeader title="Acessos" subtitle="Equipe e permissões" />

      <PageContainer>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
            <h2 className="text-sm font-semibold text-flow-text-primary">Convidar pessoa</h2>
            <form
              className="mt-4 flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                setInvited(true);
              }}
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="invite-email" className="text-xs font-medium text-flow-text-muted">
                  E-mail
                </label>
                <Input id="invite-email" type="email" placeholder="pessoa@agenciabbold.com.br" required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="invite-role" className="text-xs font-medium text-flow-text-muted">
                  Papel
                </label>
                <Select id="invite-role" defaultValue="member">
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="invite-expiry" className="text-xs font-medium text-flow-text-muted">
                  Validade do convite
                </label>
                <Select id="invite-expiry" defaultValue="7">
                  <option value="7">7 dias</option>
                  <option value="14">14 dias</option>
                  <option value="30">30 dias</option>
                </Select>
              </div>

              <Button type="submit" icon={<UserPlus size={16} strokeWidth={2} />}>
                Enviar convite
              </Button>

              {invited && (
                <p className="text-xs text-flow-text-muted">
                  Convites reais chegam na fase 7 — este formulário ainda não grava no banco.
                </p>
              )}
            </form>
          </div>

          <div className="flex flex-col gap-3">
            {demoMembers.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-4 rounded-2xl border border-flow-border bg-flow-panel p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} />
                  <div>
                    <p className="text-sm font-medium text-flow-text-primary">{member.name}</p>
                    <p className="text-xs text-flow-text-muted">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge tone={roleTone[member.role]}>{member.role}</Badge>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:max-w-xs sm:justify-end">
                  {["Dashboard", "Demandas", "Financeiro", "Contratos", "Clientes"].map((module) => (
                    <span
                      key={module}
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${
                        member.permissions.includes(module)
                          ? "border-flow-yellow/30 bg-flow-yellow/10 text-flow-yellow"
                          : "border-flow-border text-flow-text-muted/50"
                      }`}
                    >
                      {module}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
