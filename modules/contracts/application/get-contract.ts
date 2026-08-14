import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { getContractById } from "../infrastructure/contracts.repository";
import type { Contract } from "../domain/types";
import { UnauthorizedError } from "./errors";

export async function getContract(id: string): Promise<Contract | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;
  if (!hasPermission(context.currentMembership, "contracts.view")) throw new UnauthorizedError();

  const supabase = await createSupabaseServerClient();
  const contract = await getContractById(supabase, id);

  if (contract && contract.organizationId !== context.currentMembership.organization.id) {
    return null;
  }

  return contract;
}
