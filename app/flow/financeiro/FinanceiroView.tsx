"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText, Plus, RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import PageHeader from "@/components/flow/PageHeader";
import { Accordion, Badge, Button, MetricCard, PageContainer, ProgressBar } from "@/components/flow/ui";
import type { FinancialOverview } from "@/modules/finance/application/get-financial-overview";
import type { FinancialCategory, FinancialEntry, FinancialRecurrence } from "@/modules/finance/domain/types";
import { formatCentsAsBRL } from "@/modules/finance/domain/money";
import { formatCompetenceMonth, shiftCompetenceMonth } from "@/modules/finance/domain/competence";
import type { Client } from "@/modules/clients/domain/types";
import EntryDrawer from "./EntryDrawer";
import EntryGroupList from "./EntryGroupList";
import InvoiceQueueDrawer from "./InvoiceQueueDrawer";
import RecurrencesDrawer from "./RecurrencesDrawer";

export default function FinanceiroView({
  overview,
  categories,
  clients,
  recurrences,
}: {
  overview: FinancialOverview;
  categories: FinancialCategory[];
  clients: Client[];
  recurrences: FinancialRecurrence[];
}) {
  const router = useRouter();
  const [entryDrawer, setEntryDrawer] = useState<{ type: "income" | "expense"; entry: FinancialEntry | null } | null>(
    null
  );
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);
  const [recurrencesDrawerOpen, setRecurrencesDrawerOpen] = useState(false);

  const { competenceMonth, entries, settings, realizedProfitCents, receivedCents, paidExpensesCents, cashBalanceCents, goalProgress, cashflow, invoiceQueue, invoiceSummary } = overview;

  const incomeEntries = entries.filter((e) => e.type === "income" && e.status !== "cancelled");
  const expenseEntries = entries.filter((e) => e.type === "expense" && e.status !== "cancelled");
  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  function goToMonth(delta: number) {
    const next = shiftCompetenceMonth(competenceMonth, delta);
    router.push(`/flow/financeiro?competence=${next}`);
  }

  function refresh() {
    setEntryDrawer(null);
    router.refresh();
  }

  const maxCashflow = Math.max(1, ...cashflow.flatMap((p) => [p.incomeCents, p.expenseCents]));

  return (
    <>
      <PageHeader
        title="Financeiro"
        subtitle="Controle de receitas, despesas, notas fiscais e fluxo de caixa"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-flow-border px-2 py-1.5">
              <button
                type="button"
                aria-label="Mês anterior"
                onClick={() => goToMonth(-1)}
                className="rounded p-0.5 text-flow-text-muted hover:text-flow-text-primary"
              >
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
              <span className="w-32 text-center text-sm text-flow-text-primary">
                {formatCompetenceMonth(competenceMonth)}
              </span>
              <button
                type="button"
                aria-label="Próximo mês"
                onClick={() => goToMonth(1)}
                className="rounded p-0.5 text-flow-text-muted hover:text-flow-text-primary"
              >
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>
            <Button variant="secondary" icon={<RefreshCw size={15} strokeWidth={2} />} onClick={() => setRecurrencesDrawerOpen(true)}>
              Recorrências
            </Button>
            <Button
              variant="secondary"
              icon={<Plus size={16} strokeWidth={2} />}
              onClick={() => setEntryDrawer({ type: "expense", entry: null })}
            >
              Saída
            </Button>
            <Button icon={<Plus size={16} strokeWidth={2} />} onClick={() => setEntryDrawer({ type: "income", entry: null })}>
              Entrada
            </Button>
          </div>
        }
      />

      <PageContainer>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Wallet}
            label="Lucro do mês"
            value={formatCentsAsBRL(realizedProfitCents)}
            tone={realizedProfitCents >= 0 ? "success" : "danger"}
            helperText="realizado"
          />
          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
            <p className="text-sm text-flow-text-muted">Movimento do mês</p>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-flow-success">
                  <TrendingUp size={13} strokeWidth={2} /> Recebido
                </span>
                <span className="text-sm font-semibold text-flow-text-primary">{formatCentsAsBRL(receivedCents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-flow-danger">
                  <TrendingDown size={13} strokeWidth={2} /> Despesas
                </span>
                <span className="text-sm font-semibold text-flow-text-primary">{formatCentsAsBRL(paidExpensesCents)}</span>
              </div>
            </div>
          </div>
          <MetricCard
            label="Saldo em caixa"
            value={formatCentsAsBRL(cashBalanceCents)}
            tone="info"
            helperText={`desde ${settings.openingBalanceDate.split("-").reverse().join("/")}`}
          />
          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
            <p className="text-sm text-flow-text-muted">Meta do mês</p>
            <p className="mt-3 text-2xl font-semibold text-flow-text-primary">{formatCentsAsBRL(goalProgress.goalCents)}</p>
            <div className="mt-4">
              <ProgressBar value={Math.min(goalProgress.percentage, 100)} tone="yellow" />
              <p className="mt-2 text-xs text-flow-text-muted">
                {goalProgress.percentage >= 100 ? (
                  <>Meta superada em {formatCentsAsBRL(goalProgress.exceededByCents)}</>
                ) : (
                  <>
                    {formatCentsAsBRL(goalProgress.receivedCents)} recebidos ({goalProgress.percentage}%) — faltam{" "}
                    {formatCentsAsBRL(goalProgress.remainingCents)}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
            <h2 className="text-sm font-semibold text-flow-text-primary">Fluxo de caixa</h2>
            <p className="mt-1 text-xs text-flow-text-muted">Entradas e saídas realizadas — últimos 6 meses</p>
            <div className="mt-6 flex h-32 items-end gap-3">
              {cashflow.map((point) => (
                <div key={point.month} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-24 w-full items-end gap-1">
                    <div
                      className="flex-1 rounded-t-sm bg-flow-yellow/80"
                      style={{ height: `${Math.max((point.incomeCents / maxCashflow) * 100, 2)}%` }}
                      title={`Entradas: ${formatCentsAsBRL(point.incomeCents)}`}
                    />
                    <div
                      className="flex-1 rounded-t-sm bg-flow-danger/60"
                      style={{ height: `${Math.max((point.expenseCents / maxCashflow) * 100, 2)}%` }}
                      title={`Saídas: ${formatCentsAsBRL(point.expenseCents)}`}
                    />
                  </div>
                  <span className="text-[10px] text-flow-text-muted">
                    {formatCompetenceMonth(point.month).slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-flow-border bg-flow-panel p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-flow-text-primary">
                <FileText size={16} strokeWidth={1.75} />
                Notas fiscais
              </h2>
              <Badge tone="warning">{invoiceSummary.toIssue} no mês</Badge>
            </div>
            <div className="mt-5 flex items-center gap-6">
              <div>
                <p className="text-2xl font-semibold text-flow-success">{invoiceSummary.issued}</p>
                <p className="text-xs text-flow-text-muted">emitidas</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-flow-danger">{invoiceSummary.pending}</p>
                <p className="text-xs text-flow-text-muted">pendentes</p>
              </div>
            </div>
            {invoiceQueue.length > 0 ? (
              <button
                type="button"
                onClick={() => setInvoiceDrawerOpen(true)}
                className="mt-4 flex flex-wrap gap-1.5"
              >
                {invoiceQueue.slice(0, 6).map((entry) => (
                  <Badge key={entry.id} tone="neutral">
                    {entry.clientName ?? entry.description}
                  </Badge>
                ))}
                {invoiceQueue.length > 6 && <Badge tone="neutral">+{invoiceQueue.length - 6}</Badge>}
              </button>
            ) : (
              <p className="mt-4 text-xs text-flow-text-muted">Nenhuma nota fiscal pendente.</p>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-flow-text-primary">Entradas</h2>
              <span className="text-sm font-semibold text-flow-success">
                {formatCentsAsBRL(incomeEntries.reduce((sum, e) => sum + e.amountCents, 0))}
              </span>
            </div>
            {incomeEntries.length === 0 ? (
              <p className="text-sm text-flow-text-muted">Nenhuma entrada neste mês.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {incomeCategories.map((category) => {
                  const categoryEntries = incomeEntries.filter((e) => e.categoryId === category.id);
                  if (categoryEntries.length === 0) return null;
                  return (
                    <Accordion
                      key={category.id}
                      title={category.name}
                      subtitle={`${categoryEntries.length} lançamento${categoryEntries.length === 1 ? "" : "s"}`}
                      total={formatCentsAsBRL(categoryEntries.reduce((sum, e) => sum + e.amountCents, 0))}
                    >
                      <EntryGroupList
                        entries={categoryEntries}
                        onEdit={(entry) => setEntryDrawer({ type: "income", entry })}
                        onChanged={refresh}
                      />
                    </Accordion>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-flow-text-primary">Saídas</h2>
              <span className="text-sm font-semibold text-flow-danger">
                {formatCentsAsBRL(expenseEntries.reduce((sum, e) => sum + e.amountCents, 0))}
              </span>
            </div>
            {expenseEntries.length === 0 ? (
              <p className="text-sm text-flow-text-muted">Nenhuma saída neste mês.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {expenseCategories.map((category) => {
                  const categoryEntries = expenseEntries.filter((e) => e.categoryId === category.id);
                  if (categoryEntries.length === 0) return null;
                  return (
                    <Accordion
                      key={category.id}
                      title={category.name}
                      subtitle={`${categoryEntries.length} lançamento${categoryEntries.length === 1 ? "" : "s"}`}
                      total={formatCentsAsBRL(categoryEntries.reduce((sum, e) => sum + e.amountCents, 0))}
                    >
                      <EntryGroupList
                        entries={categoryEntries}
                        onEdit={(entry) => setEntryDrawer({ type: "expense", entry })}
                        onChanged={refresh}
                      />
                    </Accordion>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PageContainer>

      {entryDrawer && (
        <EntryDrawer
          open
          onClose={() => setEntryDrawer(null)}
          onSaved={refresh}
          type={entryDrawer.type}
          competenceMonth={competenceMonth}
          categories={categories}
          clients={clients}
          entry={entryDrawer.entry}
        />
      )}

      <InvoiceQueueDrawer
        open={invoiceDrawerOpen}
        onClose={() => setInvoiceDrawerOpen(false)}
        onChanged={() => {
          router.refresh();
        }}
        entries={invoiceQueue}
      />

      <RecurrencesDrawer
        open={recurrencesDrawerOpen}
        onClose={() => setRecurrencesDrawerOpen(false)}
        onChanged={() => router.refresh()}
        recurrences={recurrences}
        categories={categories}
        clients={clients}
        competenceMonth={competenceMonth}
      />
    </>
  );
}
