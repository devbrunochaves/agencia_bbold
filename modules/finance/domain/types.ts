export type FinancialEntryType = "income" | "expense";
export type FinancialEntryStatus = "planned" | "pending" | "paid" | "cancelled";
export type InvoiceStatus = "not_required" | "pending" | "issued";
export type RecurrenceFrequency = "monthly" | "one_time" | "installment";

/** UI-only status: adds "overdue" as a derived state layered on top of the
 * stored status — never persisted (see migration comment). */
export type DisplayEntryStatus = FinancialEntryStatus | "overdue";

export const ENTRY_TYPE_LABEL: Record<FinancialEntryType, string> = {
  income: "Entrada",
  expense: "Saída",
};

export const ENTRY_STATUS_LABEL: Record<DisplayEntryStatus, string> = {
  planned: "Previsto",
  pending: "Pendente",
  paid: "Pago",
  overdue: "Atrasado",
  cancelled: "Cancelado",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  not_required: "Não exigida",
  pending: "NF pendente",
  issued: "NF emitida",
};

export interface FinancialCategory {
  id: string;
  organizationId: string;
  name: string;
  type: FinancialEntryType;
  active: boolean;
  sortOrder: number;
}

export interface FinancialRecurrence {
  id: string;
  organizationId: string;
  clientId: string | null;
  clientName: string | null;
  categoryId: string;
  categoryName: string;
  type: FinancialEntryType;
  description: string;
  amountCents: number;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate: string | null;
  dayOfMonth: number | null;
  active: boolean;
}

export interface FinancialEntry {
  id: string;
  organizationId: string;
  clientId: string | null;
  clientName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  type: FinancialEntryType;
  description: string;
  amountCents: number;
  competenceMonth: string;
  dueDate: string | null;
  paidAt: string | null;
  status: FinancialEntryStatus;
  recurrenceId: string | null;
  requiresInvoice: boolean;
  invoiceStatus: InvoiceStatus;
  invoiceIssuedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationFinancialSettings {
  organizationId: string;
  monthlyRevenueGoalCents: number;
  openingBalanceCents: number;
  openingBalanceDate: string;
}
