import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { getOperationalOverview } from "./get-operational-overview";
import { getFinancialDashboardOverview } from "./get-financial-dashboard-overview";
import { getContractDashboardOverview } from "./get-contract-dashboard-overview";
import { getClientDashboardOverview } from "./get-client-dashboard-overview";
import { getTeamDashboardOverview } from "./get-team-dashboard-overview";
import type { DashboardOverview } from "../domain/types";

/**
 * Composes the Dashboard from the existing modules — never a God Service:
 * each `get*Overview()` is independently permission-gated (§5/§9) and only
 * invoked here when the caller actually has the corresponding module's
 * view permission, so a user without e.g. finance.view never triggers a
 * financial query at all.
 */
export async function getDashboardOverview(competenceMonth: string): Promise<DashboardOverview | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;

  const membership = context.currentMembership;
  const canTasks = hasPermission(membership, "tasks.view");
  const canFinance = hasPermission(membership, "finance.view");
  const canContracts = hasPermission(membership, "contracts.view");
  const canClients = hasPermission(membership, "clients.view");

  const [operational, financial, contracts, clients, team] = await Promise.all([
    canTasks ? getOperationalOverview() : Promise.resolve(null),
    canFinance ? getFinancialDashboardOverview(competenceMonth) : Promise.resolve(null),
    canContracts ? getContractDashboardOverview() : Promise.resolve(null),
    canClients ? getClientDashboardOverview(competenceMonth) : Promise.resolve(null),
    canTasks ? getTeamDashboardOverview() : Promise.resolve(null),
  ]);

  return {
    competenceMonth,
    organizationName: membership.organization.name,
    operational,
    financial,
    contracts,
    clients,
    team,
  };
}
