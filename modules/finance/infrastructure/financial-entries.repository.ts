import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinancialEntry, FinancialEntryStatus, FinancialEntryType } from "../domain/types";
import type { FinancialEntryFormInput } from "../domain/schemas";
import { centsToAmountString, parseAmountToCents } from "../domain/money";

interface FinancialEntryRow {
  id: string;
  organization_id: string;
  client_id: string | null;
  category_id: string | null;
  type: FinancialEntryType;
  description: string;
  amount: string | number;
  competence_month: string;
  due_date: string | null;
  paid_at: string | null;
  status: FinancialEntryStatus;
  recurrence_id: string | null;
  requires_invoice: boolean;
  invoice_status: FinancialEntry["invoiceStatus"];
  invoice_issued_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client: { name: string } | null;
  category: { name: string } | null;
}

const ENTRY_SELECT = `
  id, organization_id, client_id, category_id, type, description, amount,
  competence_month, due_date, paid_at, status, recurrence_id,
  requires_invoice, invoice_status, invoice_issued_at, notes, created_at, updated_at,
  client:clients ( name ),
  category:financial_categories ( name )
`;

function toEntry(row: FinancialEntryRow): FinancialEntry {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    clientName: row.client?.name ?? null,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? null,
    type: row.type,
    description: row.description,
    amountCents: parseAmountToCents(row.amount),
    competenceMonth: row.competence_month,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    status: row.status,
    recurrenceId: row.recurrence_id,
    requiresInvoice: row.requires_invoice,
    invoiceStatus: row.invoice_status,
    invoiceIssuedAt: row.invoice_issued_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListFinancialEntriesFilters {
  competenceMonth?: string;
  /** Inclusive [competenceFrom, competenceTo] range — use instead of N separate competenceMonth calls when fetching several months at once (e.g. a 12-month chart). */
  competenceFrom?: string;
  competenceTo?: string;
  type?: FinancialEntryType;
  categoryId?: string;
  status?: FinancialEntryStatus;
  clientId?: string;
  search?: string;
  /** When set, includes entries paid on/after this date regardless of competence — used for cash-balance calculations. */
  paidSince?: string;
}

export async function listEntries(
  supabase: SupabaseClient,
  organizationId: string,
  filters: ListFinancialEntriesFilters = {}
): Promise<FinancialEntry[]> {
  let query = supabase
    .from("financial_entries")
    .select(ENTRY_SELECT)
    .eq("organization_id", organizationId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (filters.competenceMonth) query = query.eq("competence_month", filters.competenceMonth);
  if (filters.competenceFrom) query = query.gte("competence_month", filters.competenceFrom);
  if (filters.competenceTo) query = query.lte("competence_month", filters.competenceTo);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.clientId) query = query.eq("client_id", filters.clientId);
  if (filters.paidSince) query = query.gte("paid_at", filters.paidSince);
  if (filters.search) {
    const term = filters.search.replace(/[%_]/g, "");
    query = query.ilike("description", `%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data as unknown as FinancialEntryRow[]) ?? []).map(toEntry);
}

export async function getEntryById(supabase: SupabaseClient, id: string): Promise<FinancialEntry | null> {
  const { data, error } = await supabase
    .from("financial_entries")
    .select(ENTRY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? toEntry(data as unknown as FinancialEntryRow) : null;
}

function toEntryRowInput(input: FinancialEntryFormInput) {
  return {
    type: input.type,
    description: input.description,
    client_id: input.clientId ?? null,
    category_id: input.categoryId,
    amount: centsToAmountString(input.amountCents),
    competence_month: input.competenceMonth,
    due_date: input.dueDate ?? null,
    paid_at: input.paidAt ?? null,
    status: input.paidAt ? ("paid" as const) : ("pending" as const),
    requires_invoice: input.requiresInvoice,
    notes: input.notes ?? null,
  };
}

export async function createEntry(
  supabase: SupabaseClient,
  organizationId: string,
  createdBy: string,
  input: FinancialEntryFormInput
): Promise<FinancialEntry> {
  const { data, error } = await supabase
    .from("financial_entries")
    .insert({ organization_id: organizationId, created_by: createdBy, ...toEntryRowInput(input) })
    .select("id")
    .single();

  if (error) throw error;

  const entry = await getEntryById(supabase, data.id);
  if (!entry) throw new Error("Lançamento criado, mas não foi possível recarregá-lo.");
  return entry;
}

export async function updateEntry(
  supabase: SupabaseClient,
  id: string,
  input: FinancialEntryFormInput
): Promise<FinancialEntry> {
  const { error } = await supabase.from("financial_entries").update(toEntryRowInput(input)).eq("id", id);
  if (error) throw error;

  const entry = await getEntryById(supabase, id);
  if (!entry) throw new Error("Lançamento atualizado, mas não foi possível recarregá-lo.");
  return entry;
}

export async function markAsPaid(
  supabase: SupabaseClient,
  id: string,
  paidAt: string
): Promise<FinancialEntry> {
  const { error } = await supabase
    .from("financial_entries")
    .update({ status: "paid", paid_at: paidAt })
    .eq("id", id);
  if (error) throw error;

  const entry = await getEntryById(supabase, id);
  if (!entry) throw new Error("Lançamento atualizado, mas não foi possível recarregá-lo.");
  return entry;
}

export async function markInvoiceStatus(
  supabase: SupabaseClient,
  id: string,
  invoiceStatus: "pending" | "issued"
): Promise<FinancialEntry> {
  const { error } = await supabase
    .from("financial_entries")
    .update({ invoice_status: invoiceStatus })
    .eq("id", id);
  if (error) throw error;

  const entry = await getEntryById(supabase, id);
  if (!entry) throw new Error("Lançamento atualizado, mas não foi possível recarregá-lo.");
  return entry;
}

export async function cancelEntry(supabase: SupabaseClient, id: string): Promise<FinancialEntry> {
  const { error } = await supabase.from("financial_entries").update({ status: "cancelled" }).eq("id", id);
  if (error) throw error;

  const entry = await getEntryById(supabase, id);
  if (!entry) throw new Error("Lançamento atualizado, mas não foi possível recarregá-lo.");
  return entry;
}

export async function countExistingCompetences(
  supabase: SupabaseClient,
  recurrenceId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("financial_entries")
    .select("competence_month")
    .eq("recurrence_id", recurrenceId);

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.competence_month as string));
}

export async function insertGeneratedEntries(
  supabase: SupabaseClient,
  rows: {
    organization_id: string;
    client_id: string | null;
    category_id: string;
    type: FinancialEntryType;
    description: string;
    amount: string;
    competence_month: string;
    due_date: string | null;
    recurrence_id: string;
    created_by: string;
  }[]
): Promise<number> {
  if (rows.length === 0) return 0;
  const { error } = await supabase.from("financial_entries").insert(rows);
  if (error) throw error;
  return rows.length;
}

/** Entries generated from a signed contract (one_time/installment billing). */
export async function insertEntriesForContract(
  supabase: SupabaseClient,
  rows: {
    organization_id: string;
    client_id: string;
    contract_id: string;
    category_id: string;
    description: string;
    amount: string;
    competence_month: string;
    due_date: string;
    created_by: string;
  }[]
): Promise<number> {
  if (rows.length === 0) return 0;
  const { error } = await supabase.from("financial_entries").insert(rows.map((r) => ({ ...r, type: "income" })));
  if (error) throw error;
  return rows.length;
}

export async function countEntriesByContract(supabase: SupabaseClient, contractId: string): Promise<number> {
  const { count, error } = await supabase
    .from("financial_entries")
    .select("id", { count: "exact", head: true })
    .eq("contract_id", contractId);

  if (error) throw error;
  return count ?? 0;
}
