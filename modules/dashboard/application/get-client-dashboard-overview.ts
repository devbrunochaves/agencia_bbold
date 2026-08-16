import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { listClients } from "@/modules/clients";
import { listTasks, OPEN_TASK_STATUSES } from "@/modules/tasks";
import { shiftCompetenceMonth } from "@/modules/finance/domain/competence";
import type { ClientDashboardOverview, ClientProgress } from "../domain/types";

/** Competence month is "YYYY-MM-01"; converts to the inclusive [first, last] due_date window for that calendar month. */
function competenceMonthRange(competenceMonth: string): [string, string] {
  const from = competenceMonth.slice(0, 7) + "-01";
  const nextMonthFirst = shiftCompetenceMonth(competenceMonth, 1).slice(0, 7) + "-01";
  const lastDay = new Date(`${nextMonthFirst}T00:00:00`);
  lastDay.setDate(lastDay.getDate() - 1);
  const to = lastDay.toISOString().slice(0, 10);
  return [from, to];
}

export async function getClientDashboardOverview(competenceMonth: string): Promise<ClientDashboardOverview | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;
  if (!hasPermission(context.currentMembership, "clients.view")) return null;

  const activeClients = await listClients({ status: "active" });
  const canViewTasks = hasPermission(context.currentMembership, "tasks.view");

  if (!canViewTasks) {
    return { activeClientCount: activeClients.length, clientsInProduction: [] };
  }

  const [openTasks, competenceTasks] = await Promise.all([
    listTasks({ includeCompleted: false }),
    (async () => {
      const [from, to] = competenceMonthRange(competenceMonth);
      // §29 — undated tasks are excluded from the monthly progress denominator entirely.
      return listTasks({ dueFrom: from, dueTo: to, includeCompleted: true });
    })(),
  ]);

  const openByClient = new Map<string, number>();
  for (const task of openTasks) {
    if (!OPEN_TASK_STATUSES.includes(task.status)) continue;
    openByClient.set(task.clientId, (openByClient.get(task.clientId) ?? 0) + 1);
  }

  const competenceTotalByClient = new Map<string, number>();
  const competenceCompletedByClient = new Map<string, number>();
  for (const task of competenceTasks) {
    if (task.status === "cancelled") continue;
    competenceTotalByClient.set(task.clientId, (competenceTotalByClient.get(task.clientId) ?? 0) + 1);
    if (task.status === "completed") {
      competenceCompletedByClient.set(task.clientId, (competenceCompletedByClient.get(task.clientId) ?? 0) + 1);
    }
  }

  const clientsInProduction: ClientProgress[] = activeClients
    .filter((c) => (openByClient.get(c.id) ?? 0) > 0)
    .map((c) => ({
      clientId: c.id,
      clientName: c.name,
      openTaskCount: openByClient.get(c.id) ?? 0,
      competenceTaskCount: competenceTotalByClient.get(c.id) ?? 0,
      competenceCompletedCount: competenceCompletedByClient.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.openTaskCount - a.openTaskCount);

  return { activeClientCount: activeClients.length, clientsInProduction };
}
