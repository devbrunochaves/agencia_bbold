"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Button, Drawer, Input, Select, Textarea } from "@/components/flow/ui";
import { TaskFormSchema, type TaskFormInput } from "@/modules/tasks/domain/schemas";
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from "@/modules/tasks/domain/types";
import type { Client } from "@/modules/clients/domain/types";
import type { OrganizationMember } from "@/modules/identity/domain/member";
import { createTaskAction, updateTaskAction } from "./actions";

const emptyForm: TaskFormInput = {
  title: "",
  description: null,
  clientId: "",
  serviceId: null,
  assigneeId: null,
  status: "backlog",
  priority: "normal",
  dueDate: null,
};

function taskToFormInput(task: Task): TaskFormInput {
  return {
    title: task.title,
    description: task.description,
    clientId: task.clientId,
    serviceId: task.serviceId,
    assigneeId: task.assignee?.id ?? null,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
  };
}

export default function TaskDrawer({
  open,
  onClose,
  onSaved,
  clients,
  members,
  task,
  defaultClientId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  clients: Client[];
  members: OrganizationMember[];
  task: Task | null;
  defaultClientId?: string | null;
}) {
  const [form, setForm] = useState<TaskFormInput>(
    task ? taskToFormInput(task) : { ...emptyForm, clientId: defaultClientId ?? "" }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(task ? taskToFormInput(task) : { ...emptyForm, clientId: defaultClientId ?? "" });
      setErrors({});
      setSubmitError(null);
    }
  }, [open, task, defaultClientId]);

  const selectedClient = clients.find((c) => c.id === form.clientId) ?? null;
  const availableServices = useMemo(
    () => selectedClient?.services.filter((s) => s.status !== "ended") ?? [],
    [selectedClient]
  );

  function updateField<K extends keyof TaskFormInput>(key: K, value: TaskFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClientChange(clientId: string) {
    setForm((prev) => ({ ...prev, clientId, serviceId: null }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    const parsed = TaskFormSchema.safeParse(form);
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

    const result = task
      ? await updateTaskAction(task.id, parsed.data)
      : await createTaskAction(parsed.data);

    setLoading(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    onSaved();
  }

  const eligibleClients = clients.filter((c) => c.status === "active" || c.status === "paused");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={task ? "Editar demanda" : "Nova demanda"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="task-form" disabled={loading}>
            {loading ? "Salvando..." : task ? "Salvar alterações" : "Criar demanda"}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-7">
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
            Informações
          </h3>
          <Field label="Título" error={errors.title}>
            <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} />
          </Field>
          <Field label="Descrição" error={errors.description}>
            <Textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
            Relacionamento
          </h3>
          <Field label="Cliente" error={errors.clientId}>
            <Select value={form.clientId} onChange={(e) => handleClientChange(e.target.value)}>
              <option value="">Selecione um cliente</option>
              {eligibleClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Serviço" error={errors.serviceId}>
            <Select
              value={form.serviceId ?? ""}
              onChange={(e) => updateField("serviceId", e.target.value || null)}
              disabled={!form.clientId}
            >
              <option value="">Sem serviço</option>
              {availableServices.map((service) => (
                <option key={service.serviceId} value={service.serviceId}>
                  {service.serviceName}
                </option>
              ))}
            </Select>
          </Field>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
            Execução
          </h3>
          <Field label="Responsável" error={errors.assigneeId}>
            <Select
              value={form.assigneeId ?? ""}
              onChange={(e) => updateField("assigneeId", e.target.value || null)}
            >
              <option value="">Sem responsável</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name} — {member.roleName}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prioridade" error={errors.priority}>
              <Select
                value={form.priority}
                onChange={(e) => updateField("priority", e.target.value as TaskFormInput["priority"])}
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status" error={errors.status}>
              <Select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value as TaskFormInput["status"])}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">Prazo</h3>
          <Field label="Data de entrega" error={errors.dueDate}>
            <Input
              type="date"
              value={form.dueDate ?? ""}
              onChange={(e) => updateField("dueDate", e.target.value)}
            />
          </Field>
        </section>

        {submitError && (
          <p role="alert" className="text-sm text-flow-danger">
            {submitError}
          </p>
        )}
      </form>
    </Drawer>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-flow-text-muted">{label}</label>
      {children}
      {error && <p className="text-xs text-flow-danger">{error}</p>}
    </div>
  );
}
