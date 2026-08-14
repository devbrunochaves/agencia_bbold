import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { ChangeClientStatusSchema, type ChangeClientStatusInput } from "../domain/schemas";
import { changeClientStatus as changeClientStatusRepository, getClientById } from "../infrastructure/clients.repository";
import type { Client } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

export async function changeClientStatus(input: ChangeClientStatusInput): Promise<Client> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();

  if (!hasPermission(context.currentMembership, "clients.manage")) {
    throw new UnauthorizedError();
  }

  const parsed = ChangeClientStatusSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message);
  }

  const supabase = await createSupabaseServerClient();

  const existing = await getClientById(supabase, parsed.data.id);
  if (!existing || existing.organizationId !== context.currentMembership.organization.id) {
    throw new UnauthorizedError();
  }

  return changeClientStatusRepository(supabase, parsed.data.id, parsed.data.status);
}
