import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { UpdateClientSchema, type UpdateClientInput } from "../domain/schemas";
import { getClientById, updateClient as updateClientRepository } from "../infrastructure/clients.repository";
import type { Client } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

export async function updateClient(input: UpdateClientInput): Promise<Client> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();

  if (!hasPermission(context.currentMembership, "clients.manage")) {
    throw new UnauthorizedError();
  }

  const parsed = UpdateClientSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message);
  }

  const supabase = await createSupabaseServerClient();

  const existing = await getClientById(supabase, parsed.data.id);
  if (!existing || existing.organizationId !== context.currentMembership.organization.id) {
    throw new UnauthorizedError();
  }

  const { id, ...formInput } = parsed.data;
  return updateClientRepository(supabase, context.currentMembership.organization.id, id, formInput);
}
