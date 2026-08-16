import type { Task } from "@/modules/tasks";
import { IN_PRODUCTION_STATUSES, type TaskDistribution } from "./types";

/**
 * §45 — timezone decision for this V1: dates are compared as plain ISO
 * calendar strings (UTC-based, same as the rest of the Flow — see
 * app/flow/demandas/format.ts and modules/finance/domain/rules.ts). The
 * agency operates in a single Brazilian timezone today, so this is not
 * overengineered with per-organization timezone support; that would be a
 * deliberate addition for a future phase, not an oversight here.
 */
function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isOverdueTask(task: Task, today = todayISODate()): boolean {
  if (!task.dueDate || task.status === "completed" || task.status === "cancelled") return false;
  return task.dueDate < today;
}

const UPCOMING_WINDOW_DAYS = 7;

/**
 * Mutually exclusive buckets — see TaskDistribution doc comment for the
 * precedence order. Pure function: no Supabase, no I/O, safe to unit test.
 */
export function buildTaskDistribution(openTasks: Task[], today = todayISODate()): TaskDistribution {
  const distribution: TaskDistribution = {
    overdue: 0,
    waitingClient: 0,
    inProduction: 0,
    upcoming7Days: 0,
    noSchedule: 0,
    total: openTasks.length,
  };
  const soonCutoff = addDaysISO(UPCOMING_WINDOW_DAYS);

  for (const task of openTasks) {
    if (isOverdueTask(task, today)) {
      distribution.overdue += 1;
    } else if (task.status === "waiting_client") {
      distribution.waitingClient += 1;
    } else if (IN_PRODUCTION_STATUSES.includes(task.status)) {
      distribution.inProduction += 1;
    } else if (task.dueDate && task.dueDate <= soonCutoff) {
      distribution.upcoming7Days += 1;
    } else {
      distribution.noSchedule += 1;
    }
  }

  return distribution;
}

/** Overdue first, then soonest due date first. Tasks without a due date are expected to already be filtered out by the caller. */
export function sortUpcomingDeliveries(tasks: Task[], today = todayISODate()): Task[] {
  return [...tasks].sort((a, b) => {
    const aOverdue = isOverdueTask(a, today);
    const bOverdue = isOverdueTask(b, today);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
  });
}

/** 0 when there's no real denominator (§28/§64) — never NaN/Infinity from a 0/0 division. */
export function computeClientProgressPercentage(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}
