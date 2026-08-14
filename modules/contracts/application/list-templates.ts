import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { listTemplates as listTemplatesRepository, getTemplateById } from "../infrastructure/contract-templates.repository";
import type { ContractTemplate } from "../domain/types";
import { UnauthorizedError } from "./errors";

export async function listContractTemplates(): Promise<ContractTemplate[]> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return [];
  if (!hasPermission(context.currentMembership, "contracts.view")) throw new UnauthorizedError();

  const supabase = await createSupabaseServerClient();
  return listTemplatesRepository(supabase, context.currentMembership.organization.id);
}

export async function getContractTemplate(id: string): Promise<ContractTemplate | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;
  if (!hasPermission(context.currentMembership, "contracts.view")) throw new UnauthorizedError();

  const supabase = await createSupabaseServerClient();
  const template = await getTemplateById(supabase, id);
  if (template && template.organizationId !== context.currentMembership.organization.id) return null;
  return template;
}
