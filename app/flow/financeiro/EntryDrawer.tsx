"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button, Checkbox, Drawer, Input, Select, Textarea } from "@/components/flow/ui";
import { FinancialEntryFormSchema, type FinancialEntryFormInput } from "@/modules/finance/domain/schemas";
import type { FinancialCategory, FinancialEntry, FinancialEntryType } from "@/modules/finance/domain/types";
import { formatCentsAsBRL, parseUserAmountToCents } from "@/modules/finance/domain/money";
import type { Client } from "@/modules/clients/domain/types";
import { createFinancialEntryAction, updateFinancialEntryAction } from "./actions";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(type: FinancialEntryType, competenceMonth: string): FinancialEntryFormInput {
  return {
    type,
    description: "",
    clientId: null,
    categoryId: "",
    amountCents: 0,
    competenceMonth,
    dueDate: null,
    paidAt: null,
    requiresInvoice: false,
    notes: null,
  };
}

function entryToFormInput(entry: FinancialEntry): FinancialEntryFormInput {
  return {
    type: entry.type,
    description: entry.description,
    clientId: entry.clientId,
    categoryId: entry.categoryId ?? "",
    amountCents: entry.amountCents,
    competenceMonth: entry.competenceMonth,
    dueDate: entry.dueDate,
    paidAt: entry.paidAt,
    requiresInvoice: entry.requiresInvoice,
    notes: entry.notes,
  };
}

export default function EntryDrawer({
  open,
  onClose,
  onSaved,
  type,
  competenceMonth,
  categories,
  clients,
  entry,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  type: FinancialEntryType;
  competenceMonth: string;
  categories: FinancialCategory[];
  clients: Client[];
  entry: FinancialEntry | null;
}) {
  const [form, setForm] = useState<FinancialEntryFormInput>(
    entry ? entryToFormInput(entry) : emptyForm(type, competenceMonth)
  );
  const [amountInput, setAmountInput] = useState(entry ? (entry.amountCents / 100).toFixed(2) : "");
  const [isPaid, setIsPaid] = useState(Boolean(entry?.paidAt));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const effectiveType = entry?.type ?? type;
  const relevantCategories = categories.filter((c) => c.type === effectiveType);

  useEffect(() => {
    if (open) {
      const base = entry ? entryToFormInput(entry) : emptyForm(type, competenceMonth);
      setForm(base);
      setAmountInput(entry ? (entry.amountCents / 100).toFixed(2) : "");
      setIsPaid(Boolean(entry?.paidAt));
      setErrors({});
      setSubmitError(null);
    }
  }, [open, entry, type, competenceMonth]);

  function updateField<K extends keyof FinancialEntryFormInput>(key: K, value: FinancialEntryFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handlePaidToggle(checked: boolean) {
    setIsPaid(checked);
    updateField("paidAt", checked ? form.paidAt ?? todayISODate() : null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    const amountCents = parseUserAmountToCents(amountInput);
    const payload: FinancialEntryFormInput = { ...form, amountCents, paidAt: isPaid ? form.paidAt ?? todayISODate() : null };

    const parsed = FinancialEntryFormSchema.safeParse(payload);
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

    const result = entry
      ? await updateFinancialEntryAction(entry.id, parsed.data)
      : await createFinancialEntryAction(parsed.data);

    setLoading(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    onSaved();
  }

  const title = entry
    ? effectiveType === "income"
      ? "Editar entrada"
      : "Editar saída"
    : effectiveType === "income"
      ? "Nova entrada"
      : "Nova saída";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="financial-entry-form" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="financial-entry-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field label={effectiveType === "income" ? "Descrição" : "Descrição / Fornecedor"} error={errors.description}>
          <Input value={form.description} onChange={(e) => updateField("description", e.target.value)} />
        </Field>

        {effectiveType === "income" && (
          <Field label="Cliente (opcional)" error={errors.clientId}>
            <Select
              value={form.clientId ?? ""}
              onChange={(e) => updateField("clientId", e.target.value || null)}
            >
              <option value="">Sem cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Categoria" error={errors.categoryId}>
          <Select value={form.categoryId} onChange={(e) => updateField("categoryId", e.target.value)}>
            <option value="">Selecione uma categoria</option>
            {relevantCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Valor" error={errors.amountCents}>
          <Input
            inputMode="decimal"
            placeholder="0,00"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            onBlur={() => {
              const cents = parseUserAmountToCents(amountInput);
              if (cents > 0) setAmountInput((cents / 100).toFixed(2));
            }}
          />
          {amountInput && parseUserAmountToCents(amountInput) > 0 && (
            <p className="text-xs text-flow-text-muted">{formatCentsAsBRL(parseUserAmountToCents(amountInput))}</p>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Competência" error={errors.competenceMonth}>
            <Input
              type="month"
              value={form.competenceMonth.slice(0, 7)}
              onChange={(e) => updateField("competenceMonth", `${e.target.value}-01`)}
            />
          </Field>
          <Field label="Vencimento" error={errors.dueDate}>
            <Input
              type="date"
              value={form.dueDate ?? ""}
              onChange={(e) => updateField("dueDate", e.target.value || null)}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-flow-border bg-flow-panel-alt p-4">
          <Checkbox
            id="entry-paid"
            label={effectiveType === "income" ? "Recebido?" : "Pago?"}
            checked={isPaid}
            onChange={(e) => handlePaidToggle(e.target.checked)}
          />
          {isPaid && (
            <Field label={effectiveType === "income" ? "Data do recebimento" : "Data do pagamento"} error={errors.paidAt}>
              <Input
                type="date"
                value={form.paidAt ?? todayISODate()}
                onChange={(e) => updateField("paidAt", e.target.value)}
              />
            </Field>
          )}
        </div>

        {effectiveType === "income" && (
          <Checkbox
            id="entry-invoice"
            label="Exige nota fiscal?"
            checked={form.requiresInvoice}
            onChange={(e) => updateField("requiresInvoice", e.target.checked)}
          />
        )}

        <Field label="Observações" error={errors.notes}>
          <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => updateField("notes", e.target.value)} />
        </Field>

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
