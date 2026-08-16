import { describe, expect, it } from "vitest";
import type { Task, TaskStatus } from "@/modules/tasks/domain/types";
import { buildTaskDistribution, computeClientProgressPercentage, sortUpcomingDeliveries } from "../aggregate";

const TODAY = "2026-08-16";

function makeTask(overrides: Partial<Task> & { id: string; status: TaskStatus }): Task {
  return {
    organizationId: "org-1",
    clientId: "client-1",
    clientName: "Cliente Teste",
    serviceId: null,
    serviceName: null,
    title: `Tarefa ${overrides.id}`,
    description: null,
    priority: "normal",
    assignee: null,
    dueDate: null,
    completedAt: null,
    createdBy: null,
    createdAt: TODAY,
    updatedAt: TODAY,
    ...overrides,
  };
}

describe("buildTaskDistribution", () => {
  it("splits open tasks into mutually exclusive buckets that sum to the total (§21/§62)", () => {
    const tasks: Task[] = [
      makeTask({ id: "1", status: "todo", dueDate: "2026-08-01" }), // overdue
      makeTask({ id: "2", status: "waiting_client", dueDate: "2026-08-01" }), // overdue wins over waiting_client
      makeTask({ id: "3", status: "waiting_client", dueDate: "2026-09-01" }), // waiting_client (not overdue)
      makeTask({ id: "4", status: "in_progress", dueDate: null }), // in production
      makeTask({ id: "5", status: "changes_requested", dueDate: "2026-08-20" }), // in production wins over "upcoming"
      makeTask({ id: "6", status: "todo", dueDate: "2026-08-18" }), // upcoming (within 7 days)
      makeTask({ id: "7", status: "todo", dueDate: null }), // no schedule
      makeTask({ id: "8", status: "approved", dueDate: "2026-10-01" }), // no schedule (too far out)
    ];

    const distribution = buildTaskDistribution(tasks, TODAY);

    expect(distribution.overdue).toBe(2);
    expect(distribution.waitingClient).toBe(1);
    expect(distribution.inProduction).toBe(2);
    expect(distribution.upcoming7Days).toBe(1);
    expect(distribution.noSchedule).toBe(2);
    expect(distribution.total).toBe(tasks.length);

    const sumOfBuckets =
      distribution.overdue +
      distribution.waitingClient +
      distribution.inProduction +
      distribution.upcoming7Days +
      distribution.noSchedule;
    expect(sumOfBuckets).toBe(distribution.total);
  });

  it("returns all-zero buckets for an empty task list", () => {
    const distribution = buildTaskDistribution([], TODAY);
    expect(distribution).toEqual({
      overdue: 0,
      waitingClient: 0,
      inProduction: 0,
      upcoming7Days: 0,
      noSchedule: 0,
      total: 0,
    });
  });
});

describe("sortUpcomingDeliveries", () => {
  it("orders overdue tasks first, then by soonest due date (§65)", () => {
    const tasks: Task[] = [
      makeTask({ id: "future", status: "todo", dueDate: "2026-09-01" }),
      makeTask({ id: "overdue-old", status: "todo", dueDate: "2026-08-01" }),
      makeTask({ id: "today", status: "todo", dueDate: TODAY }),
      makeTask({ id: "overdue-recent", status: "todo", dueDate: "2026-08-10" }),
      makeTask({ id: "tomorrow", status: "todo", dueDate: "2026-08-17" }),
    ];

    const sorted = sortUpcomingDeliveries(tasks, TODAY).map((t) => t.id);

    expect(sorted).toEqual(["overdue-old", "overdue-recent", "today", "tomorrow", "future"]);
  });
});

describe("computeClientProgressPercentage", () => {
  it("computes a real percentage from completed/total (§28)", () => {
    expect(computeClientProgressPercentage(8, 12)).toBe(67);
  });

  it("returns 0 when there is no denominator, never NaN/Infinity (§64)", () => {
    expect(computeClientProgressPercentage(0, 0)).toBe(0);
  });
});
