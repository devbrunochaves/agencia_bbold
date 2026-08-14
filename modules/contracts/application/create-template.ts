import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { CreateContractTemplateSchema, type CreateContractTemplateInput } from "../domain/schemas";
import { createTemplate } from "../infrastructure/contract-templates.repository";
import type { ContractTemplate } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

export async function createContractTemplate(input: CreateContractTemplateInput): Promise<ContractTemplate> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "contracts.manage")) throw new UnauthorizedError();

  const parsed = CreateContractTemplateSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const supabase = await createSupabaseServerClient();
  return createTemplate(supabase, context.currentMembership.organization.id, context.user.id, {
    name: parsed.data.name,
    serviceId: parsed.data.serviceId ?? null,
    content: parsed.data.content,
  });
}
