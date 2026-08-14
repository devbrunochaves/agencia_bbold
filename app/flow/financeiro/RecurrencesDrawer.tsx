"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Badge, Button, Checkbox, Drawer, EmptyState, Input, Select } from "@/components/flow/ui";
import { RefreshCw } from "lucide-react";
import { CreateFinancialRecurrenceSchema, type CreateFinancialRecurrenceInput } from "@/modules/finance/domain/schemas";
import type { FinancialCategory, FinancialRecurrence } from "@/modules/finance/domain/types";
import { formatCentsAsBRL, parseUserAmountToCents } from "@/modules/finance/domain/money";
import type { Client } from "@/modules/clients/domain/types";
import { createRecurrenceAction, generateEntriesAction, setRecurrenceActiveAction } from "./actions";

const emptyForm: CreateFinancialRecurrenceInput = {
  type: "income",
  clientId: null,
  categoryId: "",
  description: "",
  amountCents: 0,
  frequency: "monthly",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: null,
  dayOfMonth: 10,
};

export default function RecurrencesDrawer({
  open,
  onClose,
  onChanged,
  recurrences,
  categories,
  clients,
  competenceMonth,
}: {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
  recurrences: FinancialRecurrence[];
  categories: FinancialCategory[];
  clients: Client[];
  competenceMonth: string;
}) {
  const [form, setForm] = useState<CreateFinancialRecurrenceInput>(emptyForm);
  const [amountInput, setAmountInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

  const relevantCategories = categories.filter((c) => c.type === form.type);

  function updateField<K extends keyof CreateFinancialRecurrenceInput>(
    key: K,
    value: CreateFinancialRecurrenceInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    const payload = { ...form, amountCents: parseUserAmountToCents(amountInput) };
    const parsed = CreateFinancialRecurrenceSchema.safeParse(payload);
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
    const result = await createRecurrenceAction(parsed.data);
    setLoading(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    setForm(emptyForm);
    setAmountInput("");
    onChanged();
  }

  async function handleToggleActive(recurrence: FinancialRecurrence) {
    await setRecurrenceActiveAction(recurrence.id, !recurrence.active);
    onChanged();
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenerateMessage(null);
    const result = await generateEntriesAction(competenceMonth);
    setGenerating(false);
    if (result.ok) {
      setGenerateMessage(
        result.data.created > 0
          ? `${result.data.created} lançamento(s) gerado(s).`
          : "Nenhum lançamento novo — todas as recorrências deste mês já existem."
      );
      onChanged();
    } else {
      setGenerateMessage(result.message);
    }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Recorrências" description="Modelos que geram lançamentos mensais automaticamente.">
      <div className="flex flex-col gap-6">
        <Button
          variant="secondary"
          icon={<RefreshCw size={15} strokeWidth={2} />}
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? "Gerando..." : "Gerar lançamentos do mês"}
        </Button>
        {generateMessage && <p className="text-xs text-flow-text-muted">{generateMessage}</p>}

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
            Recorrências ativas
          </h3>
          {recurrences.length === 0 ? (
            <EmptyState title="Nenhuma recorrência configurada." />
          ) : (
            <div className="flex flex-col divide-y divide-flow-border/60 rounded-xl border border-flow-border bg-flow-panel-alt">
              {recurrences.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-flow-text-primary">{r.description}</p>
                    <p className="text-xs text-flow-text-muted">
                      {r.clientName ?? "Sem cliente"} · {r.categoryName} · {formatCentsAsBRL(r.amountCents)}
                      {r.dayOfMonth ? ` · todo dia ${r.dayOfMonth}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={r.active ? "success" : "neutral"}>{r.active ? "Ativa" : "Inativa"}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => handleToggleActive(r)}>
                      {r.active ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t border-flow-border pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-flow-text-muted">
            Nova recorrência
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="Tipo">
              <Select value={form.type} onChange={(e) => updateField("type", e.target.value as "income" | "expense")}>
                <option value="income">Entrada</option>
                <option value="expense">Saída</option>
              </Select>
            </FieldLabel>
            <FieldLabel label="Categoria" error={errors.categoryId}>
              <Select value={form.categoryId} onChange={(e) => updateField("categoryId", e.target.value)}>
                <option value="">Selecione</option>
                {relevantCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FieldLabel>
          </div>

          {form.type === "income" && (
            <FieldLabel label="Cliente (opcional)">
              <Select value={form.clientId ?? ""} onChange={(e) => updateField("clientId", e.target.value || null)}>
                <option value="">Sem cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FieldLabel>
          )}

          <FieldLabel label="Descrição" error={errors.description}>
            <Input value={form.description} onChange={(e) => updateField("description", e.target.value)} />
          </FieldLabel>

          <FieldLabel label="Valor" error={errors.amountCents}>
            <Input
              inputMode="decimal"
              placeholder="0,00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
            />
          </FieldLabel>

          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="Todo dia">
              <Input
                type="number"
                min={1}
                max={28}
                value={form.dayOfMonth ?? ""}
                onChange={(e) => updateField("dayOfMonth", e.target.value ? Number(e.target.value) : null)}
              />
            </FieldLabel>
            <FieldLabel label="A partir de" error={errors.startDate}>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
              />
            </FieldLabel>
          </div>

          {submitError && <p className="text-sm text-flow-danger">{submitError}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Criar recorrência"}
          </Button>
        </form>
      </div>
    </Drawer>
  );
}

function FieldLabel({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-flow-text-muted">{label}</label>
      {children}
      {error && <p className="text-xs text-flow-danger">{error}</p>}
    </div>
  );
}
