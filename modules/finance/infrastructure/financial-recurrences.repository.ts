import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinancialRecurrence, FinancialEntryType, RecurrenceFrequency } from "../domain/types";
import type { CreateFinancialRecurrenceInput } from "../domain/schemas";
import { centsToAmountString, parseAmountToCents } from "../domain/money";

interface RecurrenceRow {
  id: string;
  organization_id: string;
  client_id: string | null;
  category_id: string;
  type: FinancialEntryType;
  description: string;
  amount: string | number;
  frequency: RecurrenceFrequency;
  start_date: string;
  end_date: string | null;
  day_of_month: number | null;
  active: boolean;
  client: { name: string } | null;
  category: { name: string } | null;
}

const RECURRENCE_SELECT = `
  id, organization_id, client_id, category_id, type, description, amount,
  frequency, start_date, end_date, day_of_month, active,
  client:clients ( name ),
  category:financial_categories ( name )
`;

function toRecurrence(row: RecurrenceRow): FinancialRecurrence {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    clientName: row.client?.name ?? null,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? "",
    type: row.type,
    description: row.description,
    amountCents: parseAmountToCents(row.amount),
    frequency: row.frequency,
    startDate: row.start_date,
    endDate: row.end_date,
    dayOfMonth: row.day_of_month,
    active: row.active,
  };
}

export async function listRecurrences(
  supabase: SupabaseClient,
  organizationId: string,
  options: { activeOnly?: boolean } = {}
): Promise<FinancialRecurrence[]> {
  let query = supabase
    .from("financial_recurrences")
    .select(RECURRENCE_SELECT)
    .eq("organization_id", organizationId)
    .order("description", { ascending: true });

  if (options.activeOnly) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw error;
  return ((data as unknown as RecurrenceRow[]) ?? []).map(toRecurrence);
}

export async function getRecurrenceById(
  supabase: SupabaseClient,
  id: string
): Promise<FinancialRecurrence | null> {
  const { data, error } = await supabase
    .from("financial_recurrences")
    .select(RECURRENCE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? toRecurrence(data as unknown as RecurrenceRow) : null;
}

export async function createRecurrence(
  supabase: SupabaseClient,
  organizationId: string,
  createdBy: string,
  input: CreateFinancialRecurrenceInput
): Promise<FinancialRecurrence> {
  const { data, error } = await supabase
    .from("financial_recurrences")
    .insert({
      organization_id: organizationId,
      created_by: createdBy,
      type: input.type,
      client_id: input.clientId ?? null,
      category_id: input.categoryId,
      description: input.description,
      amount: centsToAmountString(input.amountCents),
      frequency: input.frequency,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      day_of_month: input.dayOfMonth ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;

  const recurrence = await getRecurrenceById(supabase, data.id);
  if (!recurrence) throw new Error("Recorrência criada, mas não foi possível recarregá-la.");
  return recurrence;
}

export async function updateRecurrenceActive(
  supabase: SupabaseClient,
  id: string,
  active: boolean
): Promise<FinancialRecurrence> {
  const { error } = await supabase.from("financial_recurrences").update({ active }).eq("id", id);
  if (error) throw error;

  const recurrence = await getRecurrenceById(supabase, id);
  if (!recurrence) throw new Error("Recorrência atualizada, mas não foi possível recarregá-la.");
  return recurrence;
}
