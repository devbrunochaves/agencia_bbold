import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinancialCategory, FinancialEntryType } from "../domain/types";

interface CategoryRow {
  id: string;
  organization_id: string;
  name: string;
  type: FinancialEntryType;
  active: boolean;
  sort_order: number;
}

function toCategory(row: CategoryRow): FinancialCategory {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    type: row.type,
    active: row.active,
    sortOrder: row.sort_order,
  };
}

export async function listCategories(
  supabase: SupabaseClient,
  organizationId: string,
  options: { type?: FinancialEntryType; includeInactive?: boolean } = {}
): Promise<FinancialCategory[]> {
  let query = supabase
    .from("financial_categories")
    .select("id, organization_id, name, type, active, sort_order")
    .eq("organization_id", organizationId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (options.type) query = query.eq("type", options.type);
  if (!options.includeInactive) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw error;
  return ((data as CategoryRow[]) ?? []).map(toCategory);
}

export async function createCategory(
  supabase: SupabaseClient,
  organizationId: string,
  input: { name: string; type: FinancialEntryType }
): Promise<FinancialCategory> {
  const { data, error } = await supabase
    .from("financial_categories")
    .insert({ organization_id: organizationId, name: input.name, type: input.type })
    .select("id, organization_id, name, type, active, sort_order")
    .single();

  if (error) throw error;
  return toCategory(data as CategoryRow);
}

export async function updateCategory(
  supabase: SupabaseClient,
  id: string,
  input: { name?: string; active?: boolean; sortOrder?: number }
): Promise<FinancialCategory> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.active !== undefined) patch.active = input.active;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from("financial_categories")
    .update(patch)
    .eq("id", id)
    .select("id, organization_id, name, type, active, sort_order")
    .single();

  if (error) throw error;
  return toCategory(data as CategoryRow);
}
