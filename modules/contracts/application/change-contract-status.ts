import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { ChangeContractStatusSchema, type ChangeContractStatusInput } from "../domain/schemas";
import { changeContractStatus as changeStatusRepository, getContractById } from "../infrastructure/contracts.repository";
import { canTransition } from "../domain/rules";
import type { Contract } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

export async function changeContractStatus(input: ChangeContractStatusInput): Promise<Contract> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "contracts.manage")) throw new UnauthorizedError();

  const parsed = ChangeContractStatusSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const supabase = await createSupabaseServerClient();
  const existing = await getContractById(supabase, parsed.data.id);
  if (!existing || existing.organizationId !== context.currentMembership.organization.id) {
    throw new UnauthorizedError();
  }

  if (!canTransition(existing.status, parsed.data.status)) {
    throw new ValidationError(
      `Não é possível mover um contrato de "${existing.status}" para "${parsed.data.status}".`
    );
  }

  return changeStatusRepository(supabase, parsed.data.id, parsed.data.status);
}
