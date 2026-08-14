import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { getEntryById, markInvoiceStatus } from "../infrastructure/financial-entries.repository";
import type { FinancialEntry } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

/**
 * Purely operational: sets invoice_status/invoice_issued_at. No fiscal
 * integration — see phase 5 constraints (§31).
 */
export async function markInvoiceAsIssued(id: string): Promise<FinancialEntry> {
  return setInvoiceStatus(id, "issued");
}

export async function revertInvoiceToPending(id: string): Promise<FinancialEntry> {
  return setInvoiceStatus(id, "pending");
}

async function setInvoiceStatus(id: string, status: "pending" | "issued"): Promise<FinancialEntry> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "finance.manage")) throw new UnauthorizedError();

  const supabase = await createSupabaseServerClient();
  const existing = await getEntryById(supabase, id);
  if (!existing || existing.organizationId !== context.currentMembership.organization.id) {
    throw new UnauthorizedError();
  }
  if (!existing.requiresInvoice) {
    throw new ValidationError("Este lançamento não exige nota fiscal.");
  }

  return markInvoiceStatus(supabase, id, status);
}
