import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { CreateClientSchema, type CreateClientInput } from "../domain/schemas";
import { createClient as createClientRepository } from "../infrastructure/clients.repository";
import type { Client } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

/**
 * organization_id and created_by are never taken from the input — they are
 * resolved from the authenticated session, exactly as required by the
 * multi-tenant model.
 */
export async function createClient(input: CreateClientInput): Promise<Client> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();

  if (!hasPermission(context.currentMembership, "clients.manage")) {
    throw new UnauthorizedError();
  }

  const parsed = CreateClientSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message);
  }

  const supabase = await createSupabaseServerClient();
  return createClientRepository(
    supabase,
    context.currentMembership.organization.id,
    context.user.id,
    parsed.data
  );
}
