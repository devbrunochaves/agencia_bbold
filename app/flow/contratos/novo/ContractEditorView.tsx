"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/flow/PageHeader";
import { Button, Input, Select, Textarea } from "@/components/flow/ui";
import { ContractFormSchema, type ContractFormInput } from "@/modules/contracts/domain/schemas";
import {
  BILLING_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  type BillingType,
  type Contract,
  type ContractTemplate,
  type PartySnapshot,
  type PaymentMethod,
} from "@/modules/contracts/domain/types";
import { renderTemplate, DEFAULT_CONTRACT_TEMPLATE } from "@/modules/contracts/domain/template-engine";
import { buildTemplateValues } from "@/modules/contracts/domain/build-template-values";
import { parseUserAmountToCents } from "@/modules/finance/domain/money";
import type { Client } from "@/modules/clients/domain/types";
import type { Service } from "@/modules/services/domain/types";
import { clientToSnapshot, emptySnapshot } from "../client-snapshot";
import { createContractAction, updateContractAction } from "../actions";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsISO(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1 + months, d));
  return next.toISOString().slice(0, 10);
}

function buildForm(existing: Contract | null): ContractFormInput {
  if (existing) {
    return {
      templateId: existing.templateId,
      clientId: existing.clientId,
      serviceId: existing.serviceId,
      title: existing.title,
      description: "",
      billingType: existing.billingType,
      totalAmountCents: existing.totalAmountCents,
      recurringAmountCents: existing.recurringAmountCents,
      billingDay: existing.billingDay,
      installmentsCount: existing.installmentsCount,
      paymentMethod: existing.paymentMethod,
      startDate: existing.startDate,
      endDate: existing.endDate,
      city: existing.city,
      signatureDate: existing.signatureDate,
      clientSnapshot: existing.clientSnapshot,
      installmentDueDates: existing.installments.map((i) => i.dueDate),
    };
  }

  return {
    templateId: null,
    clientId: "",
    serviceId: null,
    title: "",
    description: "",
    billingType: "recurring",
    totalAmountCents: null,
    recurringAmountCents: null,
    billingDay: 10,
    installmentsCount: null,
    paymentMethod: "pix",
    startDate: todayISODate(),
    endDate: null,
    city: "",
    signatureDate: todayISODate(),
    clientSnapshot: emptySnapshot(),
    installmentDueDates: [],
  };
}

export default function ContractEditorView({
  clients,
  services,
  templates,
  contractorSnapshot,
  contract,
}: {
  clients: Client[];
  services: Service[];
  templates: ContractTemplate[];
  contractorSnapshot: PartySnapshot;
  contract: Contract | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ContractFormInput>(buildForm(contract));
  const [amountInput, setAmountInput] = useState(
    contract ? (((contract.totalAmountCents ?? contract.recurringAmountCents) ?? 0) / 100).toFixed(2) : ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedClient = clients.find((c) => c.id === form.clientId) ?? null;
  const availableServices = selectedClient
    ? selectedClient.services.filter((s) => s.status !== "ended")
    : [];
  const selectedTemplate = templates.find((t) => t.id === form.templateId) ?? null;
  const serviceName = services.find((s) => s.id === form.serviceId)?.name ?? "";

  function updateField<K extends keyof ContractFormInput>(key: K, value: ContractFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClientChange(clientId: string) {
    const client = clients.find((c) => c.id === clientId) ?? null;
    setForm((prev) => ({
      ...prev,
      clientId,
      serviceId: null,
      clientSnapshot: client ? clientToSnapshot(client) : emptySnapshot(),
    }));
  }

  function updateSnapshot<K extends keyof PartySnapshot>(key: K, value: PartySnapshot[K]) {
    setForm((prev) => ({ ...prev, clientSnapshot: { ...prev.clientSnapshot, [key]: value } }));
  }

  function handleBillingTypeChange(billingType: BillingType) {
    setForm((prev) => ({
      ...prev,
      billingType,
      totalAmountCents: null,
      recurringAmountCents: null,
      installmentDueDates: [],
    }));
    setAmountInput("");
  }

  function handleAmountBlur() {
    const cents = parseUserAmountToCents(amountInput);
    if (cents <= 0) return;
    setAmountInput((cents / 100).toFixed(2));
    if (form.billingType === "recurring") {
      updateField("recurringAmountCents", cents);
    } else {
      updateField("totalAmountCents", cents);
      if (form.billingType === "installment" && form.installmentsCount) {
        regenerateDueDates(form.installmentsCount);
      }
    }
  }

  function regenerateDueDates(count: number) {
    const base = form.startDate || todayISODate();
    const dueDates = Array.from({ length: count }, (_, i) => addMonthsISO(base, i));
    updateField("installmentDueDates", dueDates);
  }

  function handleInstallmentsCountChange(count: number) {
    updateField("installmentsCount", count);
    regenerateDueDates(count);
  }

  function updateInstallmentDate(index: number, value: string) {
    const dates = [...(form.installmentDueDates ?? [])];
    dates[index] = value;
    updateField("installmentDueDates", dates);
  }

  const templateValues = useMemo(
    () =>
      buildTemplateValues({
        client: form.clientSnapshot,
        contractor: contractorSnapshot,
        serviceName,
        description: form.description,
        billingType: form.billingType,
        totalAmountCents: form.totalAmountCents ?? null,
        recurringAmountCents: form.recurringAmountCents ?? null,
        billingDay: form.billingDay ?? null,
        paymentMethod: form.paymentMethod,
        installmentsCount: form.installmentsCount ?? null,
        startDate: form.startDate,
        endDate: form.endDate ?? null,
        city: form.city,
        signatureDate: form.signatureDate ?? null,
      }),
    [form, contractorSnapshot, serviceName]
  );

  const previewContent = renderTemplate(selectedTemplate?.content ?? DEFAULT_CONTRACT_TEMPLATE, templateValues);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    const parsed = ContractFormSchema.safeParse(form);
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

    const result = contract
      ? await updateContractAction(contract.id, parsed.data)
      : await createContractAction(parsed.data);

    setLoading(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    router.push("/flow/contratos");
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title={contract ? "Editar contrato" : "Novo contrato"}
        subtitle="Formulário e preview do contrato lado a lado"
        actions={
          <Button variant="secondary" onClick={() => router.push("/flow/contratos")}>
            Voltar
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[45%_55%]">
        <form
          id="contract-form"
          onSubmit={handleSubmit}
          className="flex max-h-[calc(100vh-89px)] flex-col gap-7 overflow-y-auto border-r border-flow-border px-6 py-6 lg:px-8"
        >
          <Section title="Modelo e relacionamento">
            <Field label="Modelo">
              <Select value={form.templateId ?? ""} onChange={(e) => updateField("templateId", e.target.value || null)}>
                <option value="">Sem modelo (padrão genérico)</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Cliente" error={errors.clientId}>
              <Select value={form.clientId} onChange={(e) => handleClientChange(e.target.value)}>
                <option value="">Selecione um cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Serviço">
              <Select
                value={form.serviceId ?? ""}
                onChange={(e) => updateField("serviceId", e.target.value || null)}
                disabled={!form.clientId}
              >
                <option value="">Sem serviço</option>
                {availableServices.map((s) => (
                  <option key={s.serviceId} value={s.serviceId}>
                    {s.serviceName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Título do contrato" error={errors.title}>
              <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Ex: Prestação de Serviços — Social Media" />
            </Field>
          </Section>

          <Section title="Dados do contratante (revise antes de salvar)">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome">
                <Input value={form.clientSnapshot.name} onChange={(e) => updateSnapshot("name", e.target.value)} />
              </Field>
              <Field label="Razão social">
                <Input
                  value={form.clientSnapshot.legalName ?? ""}
                  onChange={(e) => updateSnapshot("legalName", e.target.value || null)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo de documento">
                <Select
                  value={form.clientSnapshot.documentType ?? ""}
                  onChange={(e) => updateSnapshot("documentType", e.target.value || null)}
                >
                  <option value="">Não informado</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="other">Outro</option>
                </Select>
              </Field>
              <Field label="Documento">
                <Input
                  value={form.clientSnapshot.documentNumber ?? ""}
                  onChange={(e) => updateSnapshot("documentNumber", e.target.value || null)}
                />
              </Field>
            </div>
            <Field label="Endereço">
              <Input
                value={form.clientSnapshot.addressStreet ?? ""}
                onChange={(e) => updateSnapshot("addressStreet", e.target.value || null)}
                placeholder="Rua, número, bairro, cidade/UF"
              />
            </Field>
            {form.clientSnapshot.documentType === "cnpj" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Representante legal">
                  <Input
                    value={form.clientSnapshot.representativeName ?? ""}
                    onChange={(e) => updateSnapshot("representativeName", e.target.value || null)}
                  />
                </Field>
                <Field label="CPF do representante">
                  <Input
                    value={form.clientSnapshot.representativeDocument ?? ""}
                    onChange={(e) => updateSnapshot("representativeDocument", e.target.value || null)}
                  />
                </Field>
              </div>
            )}
          </Section>

          <Section title="Objeto do contrato">
            <Field label="Descrição do projeto / escopo" error={errors.description}>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Ex: Implementação de website institucional responsivo, com até 5 páginas..."
              />
            </Field>
          </Section>

          <Section title="Financeiro">
            <Field label="Tipo de cobrança">
              <Select value={form.billingType} onChange={(e) => handleBillingTypeChange(e.target.value as BillingType)}>
                {Object.entries(BILLING_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            {form.billingType === "recurring" ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mensalidade" error={errors.recurringAmountCents}>
                  <Input inputMode="decimal" placeholder="0,00" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} onBlur={handleAmountBlur} />
                </Field>
                <Field label="Dia de cobrança" error={errors.billingDay}>
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={form.billingDay ?? ""}
                    onChange={(e) => updateField("billingDay", e.target.value ? Number(e.target.value) : null)}
                  />
                </Field>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Valor total" error={errors.totalAmountCents}>
                    <Input inputMode="decimal" placeholder="0,00" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} onBlur={handleAmountBlur} />
                  </Field>
                  <Field label="Forma de pagamento">
                    <Select value={form.paymentMethod} onChange={(e) => updateField("paymentMethod", e.target.value as PaymentMethod)}>
                      {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                {form.billingType === "installment" && (
                  <>
                    <Field label="Quantidade de parcelas" error={errors.installmentsCount}>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={form.installmentsCount ?? ""}
                        onChange={(e) => handleInstallmentsCountChange(Number(e.target.value) || 1)}
                      />
                    </Field>
                    {(form.installmentDueDates ?? []).length > 0 && (
                      <div className="flex flex-col gap-2 rounded-lg border border-flow-border p-3">
                        <p className="text-xs font-medium text-flow-text-muted">Vencimentos</p>
                        {(form.installmentDueDates ?? []).map((date, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span className="w-16 shrink-0 text-flow-text-muted">Parcela {index + 1}</span>
                            <Input type="date" value={date} onChange={(e) => updateInstallmentDate(index, e.target.value)} />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </Section>

          <Section title="Vigência e assinatura">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data de início" error={errors.startDate}>
                <Input type="date" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)} />
              </Field>
              <Field label="Data final (opcional)">
                <Input type="date" value={form.endDate ?? ""} onChange={(e) => updateField("endDate", e.target.value || null)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cidade" error={errors.city}>
                <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} />
              </Field>
              <Field label="Data da assinatura">
                <Input type="date" value={form.signatureDate ?? ""} onChange={(e) => updateField("signatureDate", e.target.value || null)} />
              </Field>
            </div>
          </Section>

          {submitError && (
            <p role="alert" className="text-sm text-flow-danger">
              {submitError}
            </p>
          )}

          <div className="sticky bottom-0 -mx-6 flex justify-end gap-2 border-t border-flow-border bg-flow-bg px-6 py-4 lg:-mx-8 lg:px-8">
            <Button variant="secondary" onClick={() => router.push("/flow/contratos")} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : contract ? "Salvar alterações" : "Salvar rascunho"}
            </Button>
          </div>
        </form>

        <div className="hidden bg-flow-bg px-6 py-6 lg:block lg:px-8">
          <div className="sticky top-6 max-h-[calc(100vh-113px)] overflow-y-auto rounded-lg bg-white p-10 shadow-flow-lg">
            <pre className="whitespace-pre-wrap font-serif text-[13px] leading-relaxed text-neutral-900">
              {previewContent}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">{title}</h3>
      {children}
    </section>
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
