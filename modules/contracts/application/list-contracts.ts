import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { listContracts as listContractsRepository, type ListContractsFilters } from "../infrastructure/contracts.repository";
import type { Contract } from "../domain/types";
import { UnauthorizedError } from "./errors";

export async function listContracts(filters: ListContractsFilters = {}): Promise<Contract[]> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return [];
  if (!hasPermission(context.currentMembership, "contracts.view")) throw new UnauthorizedError();

  const supabase = await createSupabaseServerClient();
  return listContractsRepository(supabase, context.currentMembership.organization.id, filters);
}
