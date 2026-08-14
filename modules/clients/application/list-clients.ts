import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { listClients as listClientsRepository, type ListClientsFilters } from "../infrastructure/clients.repository";
import type { Client } from "../domain/types";
import { UnauthorizedError } from "./errors";

export async function listClients(filters: ListClientsFilters = {}): Promise<Client[]> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return [];

  if (!hasPermission(context.currentMembership, "clients.view")) {
    throw new UnauthorizedError();
  }

  const supabase = await createSupabaseServerClient();
  return listClientsRepository(supabase, context.currentMembership.organization.id, filters);
}
