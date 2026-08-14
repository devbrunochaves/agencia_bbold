export type ContractStatus = "draft" | "sent" | "signed" | "cancelled";
export type DisplayContractStatus = ContractStatus | "expired";
export type BillingType = "one_time" | "installment" | "recurring";
export type PaymentMethod = "pix" | "bank_transfer" | "credit_card" | "cash" | "other";

export const CONTRACT_STATUS_LABEL: Record<DisplayContractStatus, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  signed: "Assinado",
  expired: "Expirado",
  cancelled: "Cancelado",
};

export const BILLING_TYPE_LABEL: Record<BillingType, string> = {
  one_time: "À vista",
  installment: "Parcelado",
  recurring: "Recorrente (mensalidade)",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: "PIX",
  bank_transfer: "Transferência",
  credit_card: "Cartão",
  cash: "Dinheiro",
  other: "Outro",
};

/** Valid status transitions, centralized — never inferred ad hoc in the UI. */
export const CONTRACT_STATUS_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  draft: ["sent", "cancelled"],
  sent: ["signed", "cancelled"],
  signed: [],
  cancelled: [],
};

export interface PartySnapshot {
  name: string;
  legalName: string | null;
  documentType: string | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipCode: string | null;
  representativeName: string | null;
  representativeDocument: string | null;
}

export interface ContractTemplate {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  serviceId: string | null;
  content: string;
  active: boolean;
}

export interface ContractInstallment {
  id: string;
  installmentNumber: number;
  amountCents: number;
  dueDate: string;
}

export interface Contract {
  id: string;
  organizationId: string;
  clientId: string;
  clientName: string;
  serviceId: string | null;
  serviceName: string | null;
  templateId: string | null;
  title: string;
  status: ContractStatus;
  contractNumber: string | null;
  startDate: string;
  endDate: string | null;
  billingType: BillingType;
  totalAmountCents: number | null;
  recurringAmountCents: number | null;
  billingDay: number | null;
  paymentMethod: PaymentMethod;
  installmentsCount: number | null;
  city: string;
  signatureDate: string | null;
  clientSnapshot: PartySnapshot;
  contractorSnapshot: PartySnapshot;
  contentSnapshot: string;
  sentAt: string | null;
  signedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  installments: ContractInstallment[];
}
