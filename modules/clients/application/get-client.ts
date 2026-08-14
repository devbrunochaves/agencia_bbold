import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { getClientById } from "../infrastructure/clients.repository";
import type { Client } from "../domain/types";
import { UnauthorizedError } from "./errors";

export async function getClient(id: string): Promise<Client | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;

  if (!hasPermission(context.currentMembership, "clients.view")) {
    throw new UnauthorizedError();
  }

  const supabase = await createSupabaseServerClient();
  const client = await getClientById(supabase, id);

  // RLS already scopes reads to the caller's organization, but double-check
  // here so a stale/foreign id never leaks past this layer.
  if (client && client.organizationId !== context.currentMembership.organization.id) {
    return null;
  }

  return client;
}
