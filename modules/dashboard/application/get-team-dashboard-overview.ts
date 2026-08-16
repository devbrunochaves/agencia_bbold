import { getCurrentUserContext, hasPermission, listOrganizationMembers } from "@/modules/identity";
import { listTasks, OPEN_TASK_STATUSES } from "@/modules/tasks";
import type { MemberWorkload, TeamDashboardOverview } from "../domain/types";

export async function getTeamDashboardOverview(): Promise<TeamDashboardOverview | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;
  if (!hasPermission(context.currentMembership, "tasks.view")) return null;
  if (!hasPermission(context.currentMembership, "members.view")) return null;

  const [tasks, members] = await Promise.all([listTasks({ includeCompleted: false }), listOrganizationMembers()]);
  const openTasks = tasks.filter((t) => OPEN_TASK_STATUSES.includes(t.status) && t.assignee);

  const countByUserId = new Map<string, number>();
  for (const task of openTasks) {
    const userId = task.assignee!.id;
    countByUserId.set(userId, (countByUserId.get(userId) ?? 0) + 1);
  }

  const nameByUserId = new Map(members.map((m) => [m.userId, m.name]));

  // §24 — only responsáveis com demandas abertas aparecem; membros sem task ficam ocultos.
  const withCounts = [...countByUserId.entries()].map(([userId, openTaskCount]) => ({
    userId,
    name: nameByUserId.get(userId) ?? "—",
    openTaskCount,
  }));

  const maxCount = Math.max(1, ...withCounts.map((m) => m.openTaskCount));

  const workload: MemberWorkload[] = withCounts
    .sort((a, b) => b.openTaskCount - a.openTaskCount)
    .map((m) => ({
      ...m,
      relativeLoad: Math.round((m.openTaskCount / maxCount) * 100),
    }));

  return { workload };
}
