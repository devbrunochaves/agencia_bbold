import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { listContracts } from "@/modules/contracts";
import type { ContractDashboardOverview } from "../domain/types";

const ENDING_SOON_WINDOW_DAYS = 30;

function daysUntil(dateISO: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const diffMs = new Date(`${dateISO}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export async function getContractDashboardOverview(): Promise<ContractDashboardOverview | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;
  if (!hasPermission(context.currentMembership, "contracts.view")) return null;

  const contracts = await listContracts();

  const awaitingSignatureCount = contracts.filter((c) => c.status === "sent").length;

  const endingSoon = contracts
    .filter((c) => c.status === "signed" && c.endDate)
    .map((c) => ({ id: c.id, clientName: c.clientName, endDate: c.endDate as string, daysRemaining: daysUntil(c.endDate as string) }))
    .filter((c) => c.daysRemaining >= 0 && c.daysRemaining <= ENDING_SOON_WINDOW_DAYS)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  return { awaitingSignatureCount, endingSoon };
}
