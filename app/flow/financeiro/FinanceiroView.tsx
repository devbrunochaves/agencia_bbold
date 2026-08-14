"use client";

import { useState } from "react";
import { FileText, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import PageHeader from "@/components/flow/PageHeader";
import {
  Accordion,
  Badge,
  MetricCard,
  PageContainer,
  ProgressBar,
  Select,
  StatusBadge,
} from "@/components/flow/ui";
import {
  demoExpenseGroups,
  demoIncomeGroups,
  demoInvoiceSummary,
  type DemoFinancialEntry,
} from "@/data/flow-demo/financial";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const VISIBLE_ROWS = 3;

function groupTotal(entries: DemoFinancialEntry[]) {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

function EntryRow({ entry, showClientColumn = true }: { entry: DemoFinancialEntry; showClientColumn?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 py-2.5 text-sm">
      <div className="min-w-0">
        <p className="truncate text-flow-text-primary">{entry.name}</p>
        {showClientColumn && <p className="text-xs text-flow-text-muted">{entry.category}</p>}
      </div>
      <span className="text-xs text-flow-text-muted">Vence {entry.dueDate}</span>
      <span className="font-medium text-flow-text-primary">{currency.format(entry.amount)}</span>
      <StatusBadge status={entry.status} />
    </div>
  );
}

function EntryGroupList({ entries }: { entries: DemoFinancialEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, VISIBLE_ROWS);

  if (entries.length === 0) {
    return <p className="py-2 text-sm text-flow-text-muted">Nenhum lançamento neste grupo.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-flow-border/60">
      {visible.map((entry) => (
        <EntryRow key={entry.id} entry={entry} />
      ))}
      {entries.length > VISIBLE_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="py-2 text-left text-xs font-medium text-flow-yellow hover:underline"
        >
          {expanded ? "Ver menos" : `Ver mais (${entries.length - VISIBLE_ROWS})`}
        </button>
      )}
    </div>
  );
}

export default function FinanceiroView() {
  const income = groupTotal(demoIncomeGroups.flatMap((g) => g.entries));
  const expense = groupTotal(demoExpenseGroups.flatMap((g) => g.entries));
  const profit = income - expense;
  const cashBalance = 18420;
  const monthlyGoal = 15000;
  const goalPct = Math.round((income / monthlyGoal) * 100);

  return (
    <>
      <PageHeader
        title="Financeiro"
        subtitle="Controle de receitas, despesas, notas fiscais e fluxo de caixa"
        actions={
          <Select defaultValue="2026-08" aria-label="Mês de referência" className="w-40">
            <option value="2026-08">Agosto 2026</option>
            <option value="2026-07">Julho 2026</option>
          </Select>
        }
      />

      <PageContainer>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Wallet} label="Lucro do mês" value={currency.format(profit)} tone="success" />
          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
            <p className="text-sm text-flow-text-muted">Movimento do mês</p>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-flow-success">
                  <TrendingUp size={13} strokeWidth={2} /> Recebido
                </span>
                <span className="text-sm font-semibold text-flow-text-primary">{currency.format(income)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-flow-danger">
                  <TrendingDown size={13} strokeWidth={2} /> Despesas
                </span>
                <span className="text-sm font-semibold text-flow-text-primary">{currency.format(expense)}</span>
              </div>
            </div>
          </div>
          <MetricCard label="Saldo em caixa" value={currency.format(cashBalance)} tone="info" />
          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
            <p className="text-sm text-flow-text-muted">Meta do mês</p>
            <p className="mt-3 text-2xl font-semibold text-flow-text-primary">{currency.format(monthlyGoal)}</p>
            <div className="mt-4">
              <ProgressBar value={Math.min(goalPct, 100)} tone="yellow" />
              <p className="mt-2 text-xs text-flow-text-muted">
                {currency.format(income)} recebidos ({goalPct}%) — faltam{" "}
                {currency.format(Math.max(monthlyGoal - income, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
            <h2 className="text-sm font-semibold text-flow-text-primary">Fluxo de caixa</h2>
            <p className="mt-1 text-xs text-flow-text-muted">Entradas e saídas dos últimos meses</p>
            <div className="mt-6 flex h-32 items-end gap-3">
              {[62, 70, 55, 80, 68, 74].map((value, i) => (
                <div key={i} className="flex-1 rounded-t-md bg-flow-yellow/70" style={{ height: `${value}%` }} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-flow-text-primary">
                <FileText size={16} strokeWidth={1.75} />
                Notas fiscais
              </h2>
              <Badge tone="warning">{demoInvoiceSummary.toIssue} a emitir</Badge>
            </div>
            <div className="mt-5 flex items-center gap-6">
              <div>
                <p className="text-2xl font-semibold text-flow-success">{demoInvoiceSummary.issued}</p>
                <p className="text-xs text-flow-text-muted">emitidas</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-flow-danger">{demoInvoiceSummary.pending}</p>
                <p className="text-xs text-flow-text-muted">pendentes</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {demoIncomeGroups
                .flatMap((g) => g.entries)
                .filter((e) => e.invoiceRequired && !e.invoiceIssued)
                .map((entry) => (
                  <Badge key={entry.id} tone="neutral">
                    {entry.name}
                  </Badge>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-flow-text-primary">Entradas</h2>
              <span className="text-sm font-semibold text-flow-success">{currency.format(income)}</span>
            </div>
            <div className="flex flex-col gap-3">
              {demoIncomeGroups.map((group) => (
                <Accordion
                  key={group.key}
                  title={group.label}
                  subtitle={`${group.entries.length} lançamento${group.entries.length === 1 ? "" : "s"}`}
                  total={currency.format(groupTotal(group.entries))}
                >
                  <EntryGroupList entries={group.entries} />
                </Accordion>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-flow-text-primary">Saídas</h2>
              <span className="text-sm font-semibold text-flow-danger">{currency.format(expense)}</span>
            </div>
            <div className="flex flex-col gap-3">
              {demoExpenseGroups.map((group) => (
                <Accordion
                  key={group.key}
                  title={group.label}
                  subtitle={`${group.entries.length} lançamento${group.entries.length === 1 ? "" : "s"}`}
                  total={currency.format(groupTotal(group.entries))}
                >
                  <EntryGroupList entries={group.entries} />
                </Accordion>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
