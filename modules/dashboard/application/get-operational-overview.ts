import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { listTasks, OPEN_TASK_STATUSES, type Task } from "@/modules/tasks";
import { isOverdue, isDueToday } from "@/app/flow/demandas/format";
import { buildTaskDistribution, sortUpcomingDeliveries } from "../domain/aggregate";
import { IN_PRODUCTION_STATUSES, type OperationalOverview, type UpcomingDelivery } from "../domain/types";

const UPCOMING_LIMIT = 8;

function toUpcomingDelivery(task: Task): UpcomingDelivery {
  return {
    id: task.id,
    title: task.title,
    clientId: task.clientId,
    clientName: task.clientName,
    assigneeName: task.assignee?.name ?? null,
    dueDate: task.dueDate,
    status: task.status,
    priority: task.priority,
    isOverdue: isOverdue(task),
    isDueToday: isDueToday(task),
  };
}

export async function getOperationalOverview(): Promise<OperationalOverview | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;
  if (!hasPermission(context.currentMembership, "tasks.view")) return null;

  const allTasks = await listTasks({ includeCompleted: false });
  const openTasks = allTasks.filter((t) => OPEN_TASK_STATUSES.includes(t.status));

  const inProductionCount = openTasks.filter((t) => IN_PRODUCTION_STATUSES.includes(t.status)).length;
  const overdueCount = openTasks.filter(isOverdue).length;
  const waitingClientCount = openTasks.filter((t) => t.status === "waiting_client").length;

  const upcomingDeliveries = sortUpcomingDeliveries(openTasks.filter((t) => t.dueDate))
    .slice(0, UPCOMING_LIMIT)
    .map(toUpcomingDelivery);

  return {
    inProductionCount,
    overdueCount,
    waitingClientCount,
    upcomingDeliveries,
    distribution: buildTaskDistribution(openTasks),
  };
}
