import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { UpdateFinancialSettingsSchema, type UpdateFinancialSettingsInput } from "../domain/schemas";
import { getSettings, upsertSettings } from "../infrastructure/financial-settings.repository";
import type { OrganizationFinancialSettings } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

export async function getFinancialSettings(): Promise<OrganizationFinancialSettings | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;
  if (!hasPermission(context.currentMembership, "finance.view")) throw new UnauthorizedError();

  const supabase = await createSupabaseServerClient();
  return getSettings(supabase, context.currentMembership.organization.id);
}

export async function updateFinancialSettings(
  input: UpdateFinancialSettingsInput
): Promise<OrganizationFinancialSettings> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "finance.manage")) throw new UnauthorizedError();

  const parsed = UpdateFinancialSettingsSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const supabase = await createSupabaseServerClient();
  return upsertSettings(supabase, context.currentMembership.organization.id, parsed.data);
}
