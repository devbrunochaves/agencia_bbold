"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button, Checkbox, Drawer, Input, Select, Textarea } from "@/components/flow/ui";
import { ClientFormSchema, type ClientFormInput } from "@/modules/clients/domain/schemas";
import { CLIENT_STATUS_LABEL, CLIENT_TYPE_LABEL, type Client } from "@/modules/clients/domain/types";
import type { Service } from "@/modules/services/domain/types";
import { createClientAction, updateClientAction } from "./actions";

const emptyForm: ClientFormInput = {
  name: "",
  legalName: null,
  documentType: null,
  documentNumber: null,
  email: null,
  phone: null,
  website: null,
  status: "prospect",
  clientType: "project",
  startDate: null,
  notes: null,
  serviceIds: [],
};

function clientToFormInput(client: Client): ClientFormInput {
  return {
    name: client.name,
    legalName: client.legalName,
    documentType: client.documentType,
    documentNumber: client.documentNumber,
    email: client.email,
    phone: client.phone,
    website: client.website,
    status: client.status,
    clientType: client.clientType,
    startDate: client.startDate,
    notes: client.notes,
    serviceIds: client.services.map((s) => s.serviceId),
  };
}

export default function ClientDrawer({
  open,
  onClose,
  onSaved,
  services,
  client,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  services: Service[];
  client: Client | null;
}) {
  const [form, setForm] = useState<ClientFormInput>(client ? clientToFormInput(client) : emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(client ? clientToFormInput(client) : emptyForm);
      setErrors({});
      setSubmitError(null);
    }
  }, [open, client]);

  function updateField<K extends keyof ClientFormInput>(key: K, value: ClientFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleService(serviceId: string) {
    setForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    const parsed = ClientFormSchema.safeParse(form);
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

    const result = client
      ? await updateClientAction(client.id, parsed.data)
      : await createClientAction(parsed.data);

    setLoading(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    onSaved();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={client ? "Editar cliente" : "Novo cliente"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="client-form" disabled={loading}>
            {loading ? "Salvando..." : client ? "Salvar alterações" : "Criar cliente"}
          </Button>
        </>
      }
    >
      <form id="client-form" onSubmit={handleSubmit} className="flex flex-col gap-7">
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
            Dados principais
          </h3>
          <Field label="Nome" error={errors.name}>
            <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} />
          </Field>
          <Field label="Razão social" error={errors.legalName}>
            <Input
              value={form.legalName ?? ""}
              onChange={(e) => updateField("legalName", e.target.value)}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">Contato</h3>
          <Field label="E-mail" error={errors.email}>
            <Input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </Field>
          <Field label="Telefone" error={errors.phone}>
            <Input value={form.phone ?? ""} onChange={(e) => updateField("phone", e.target.value)} />
          </Field>
          <Field label="Website" error={errors.website}>
            <Input
              placeholder="https://"
              value={form.website ?? ""}
              onChange={(e) => updateField("website", e.target.value)}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">Empresa</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo de documento" error={errors.documentType}>
              <Select
                value={form.documentType ?? ""}
                onChange={(e) => updateField("documentType", (e.target.value || null) as ClientFormInput["documentType"])}
              >
                <option value="">Não informado</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="other">Outro</option>
              </Select>
            </Field>
            <Field label="Documento" error={errors.documentNumber}>
              <Input
                value={form.documentNumber ?? ""}
                onChange={(e) => updateField("documentNumber", e.target.value)}
                placeholder="Somente números"
              />
            </Field>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
            Relacionamento
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status" error={errors.status}>
              <Select value={form.status} onChange={(e) => updateField("status", e.target.value as ClientFormInput["status"])}>
                {Object.entries(CLIENT_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo de cliente" error={errors.clientType}>
              <Select
                value={form.clientType}
                onChange={(e) => updateField("clientType", e.target.value as ClientFormInput["clientType"])}
              >
                {Object.entries(CLIENT_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Data de início" error={errors.startDate}>
            <Input
              type="date"
              value={form.startDate ?? ""}
              onChange={(e) => updateField("startDate", e.target.value)}
            />
          </Field>
        </section>

        {services.length > 0 && (
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
              Serviços
            </h3>
            <div className="flex flex-col gap-2">
              {services.map((service) => (
                <Checkbox
                  key={service.id}
                  id={`service-${service.id}`}
                  label={service.name}
                  checked={form.serviceIds.includes(service.id)}
                  onChange={() => toggleService(service.id)}
                />
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
            Observações
          </h3>
          <Textarea
            rows={3}
            value={form.notes ?? ""}
            onChange={(e) => updateField("notes", e.target.value)}
          />
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-flow-text-muted">{label}</label>
      {children}
      {error && <p className="text-xs text-flow-danger">{error}</p>}
    </div>
  );
}
