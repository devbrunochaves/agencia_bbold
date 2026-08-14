import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrganizationFinancialSettings } from "../domain/types";
import { centsToAmountString, parseAmountToCents } from "../domain/money";

interface SettingsRow {
  organization_id: string;
  monthly_revenue_goal: string | number;
  opening_balance: string | number;
  opening_balance_date: string;
}

function toSettings(row: SettingsRow): OrganizationFinancialSettings {
  return {
    organizationId: row.organization_id,
    monthlyRevenueGoalCents: parseAmountToCents(row.monthly_revenue_goal),
    openingBalanceCents: parseAmountToCents(row.opening_balance),
    openingBalanceDate: row.opening_balance_date,
  };
}

const DEFAULT_SETTINGS: Omit<OrganizationFinancialSettings, "organizationId"> = {
  monthlyRevenueGoalCents: 0,
  openingBalanceCents: 0,
  openingBalanceDate: new Date().toISOString().slice(0, 10),
};

export async function getSettings(
  supabase: SupabaseClient,
  organizationId: string
): Promise<OrganizationFinancialSettings> {
  const { data, error } = await supabase
    .from("organization_financial_settings")
    .select("organization_id, monthly_revenue_goal, opening_balance, opening_balance_date")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { organizationId, ...DEFAULT_SETTINGS };
  return toSettings(data as SettingsRow);
}

export async function upsertSettings(
  supabase: SupabaseClient,
  organizationId: string,
  input: {
    monthlyRevenueGoalCents: number;
    openingBalanceCents: number;
    openingBalanceDate: string;
  }
): Promise<OrganizationFinancialSettings> {
  const { data, error } = await supabase
    .from("organization_financial_settings")
    .upsert(
      {
        organization_id: organizationId,
        monthly_revenue_goal: centsToAmountString(input.monthlyRevenueGoalCents),
        opening_balance: centsToAmountString(input.openingBalanceCents),
        opening_balance_date: input.openingBalanceDate,
      },
      { onConflict: "organization_id" }
    )
    .select("organization_id, monthly_revenue_goal, opening_balance, opening_balance_date")
    .single();

  if (error) throw error;
  return toSettings(data as SettingsRow);
}
