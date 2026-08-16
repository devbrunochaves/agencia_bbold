import type { TaskPriority, TaskStatus } from "@/modules/tasks";

/**
 * "Em produção" = tasks actively being worked, not just queued or blocked
 * on the agency: in_progress, internal_review, changes_requested. Excludes
 * todo/backlog (not started) and waiting_client (blocked on the client),
 * which are surfaced separately (Distribuição, Pendências).
 */
export const IN_PRODUCTION_STATUSES: TaskStatus[] = ["in_progress", "internal_review", "changes_requested"];

export interface UpcomingDelivery {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  assigneeName: string | null;
  dueDate: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  isOverdue: boolean;
  isDueToday: boolean;
}

/**
 * Mutually exclusive buckets over all open tasks (not completed/cancelled),
 * evaluated in this precedence order so every task lands in exactly one
 * bucket and the categories sum to the total:
 *   1. overdue          → dueDate in the past
 *   2. waitingClient     → status = waiting_client (and not overdue)
 *   3. inProduction      → status in IN_PRODUCTION_STATUSES (and not above)
 *   4. upcoming7Days      → dueDate within the next 7 days (and not above)
 *   5. noSchedule        → everything else (no due date, or due later, and not above)
 */
export interface TaskDistribution {
  overdue: number;
  waitingClient: number;
  inProduction: number;
  upcoming7Days: number;
  noSchedule: number;
  total: number;
}

export interface OperationalOverview {
  inProductionCount: number;
  overdueCount: number;
  waitingClientCount: number;
  upcomingDeliveries: UpcomingDelivery[];
  distribution: TaskDistribution;
}

export interface MemberWorkload {
  userId: string;
  name: string;
  openTaskCount: number;
  /** 0-100, normalized against the highest openTaskCount in the list — purely visual, never labeled as capacity/percentage. */
  relativeLoad: number;
}

export interface TeamDashboardOverview {
  workload: MemberWorkload[];
}

export interface ClientProgress {
  clientId: string;
  clientName: string;
  openTaskCount: number;
  /** Tasks due within the selected competence month only (§29 — undated tasks are excluded from this denominator). */
  competenceTaskCount: number;
  competenceCompletedCount: number;
}

export interface ClientDashboardOverview {
  activeClientCount: number;
  clientsInProduction: ClientProgress[];
}

export interface FinancialMonthPoint {
  competenceMonth: string;
  receivedCents: number;
}

export interface FinancialDashboardOverview {
  competenceMonth: string;
  receivedCents: number;
  receivableCents: number;
  paidExpensesCents: number;
  resultCents: number;
  pendingInvoiceCount: number;
  yearlyReceived: FinancialMonthPoint[];
}

export interface ContractDashboardOverview {
  awaitingSignatureCount: number;
  endingSoon: { id: string; clientName: string; endDate: string; daysRemaining: number }[];
}

export interface DashboardOverview {
  competenceMonth: string;
  organizationName: string;
  operational: OperationalOverview | null;
  financial: FinancialDashboardOverview | null;
  contracts: ContractDashboardOverview | null;
  clients: ClientDashboardOverview | null;
  team: TeamDashboardOverview | null;
}
