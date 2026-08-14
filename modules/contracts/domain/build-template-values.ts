import type { BillingType, PartySnapshot, PaymentMethod } from "./types";
import { BILLING_TYPE_LABEL, PAYMENT_METHOD_LABEL } from "./types";
import { formatCentsAsBRL } from "@/modules/finance/domain/money";
import type { TemplateValues } from "./template-engine";

function formatAddress(party: PartySnapshot): string {
  const parts = [
    party.addressStreet && party.addressNumber
      ? `${party.addressStreet}, ${party.addressNumber}${party.addressComplement ? ` — ${party.addressComplement}` : ""}`
      : null,
    party.addressNeighborhood,
    party.addressCity && party.addressState ? `${party.addressCity}/${party.addressState}` : party.addressCity,
    party.addressZipCode ? `CEP ${party.addressZipCode}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "";
}

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`)
  );
}

export function buildTemplateValues(input: {
  client: PartySnapshot;
  contractor: PartySnapshot;
  serviceName: string;
  description: string;
  billingType: BillingType;
  totalAmountCents: number | null;
  recurringAmountCents: number | null;
  billingDay: number | null;
  paymentMethod: PaymentMethod;
  installmentsCount: number | null;
  startDate: string;
  endDate: string | null;
  city: string;
  signatureDate: string | null;
}): TemplateValues {
  const value =
    input.billingType === "recurring"
      ? `${formatCentsAsBRL(input.recurringAmountCents ?? 0)}/mês`
      : formatCentsAsBRL(input.totalAmountCents ?? 0);

  return {
    client_name: input.client.name,
    client_legal_name: input.client.legalName ?? input.client.name,
    client_document: input.client.documentNumber ?? "",
    client_address: formatAddress(input.client),
    client_representative: input.client.representativeName ?? "",
    contractor_name: input.contractor.name,
    contractor_legal_name: input.contractor.legalName ?? input.contractor.name,
    contractor_document: input.contractor.documentNumber ?? "",
    contractor_address: formatAddress(input.contractor),
    contractor_representative: input.contractor.representativeName ?? "",
    service_name: input.serviceName,
    description: input.description,
    contract_value: value,
    payment_method: PAYMENT_METHOD_LABEL[input.paymentMethod],
    installments: input.installmentsCount ? String(input.installmentsCount) : "1",
    billing_type: BILLING_TYPE_LABEL[input.billingType],
    start_date: formatDate(input.startDate),
    end_date: formatDate(input.endDate),
    city: input.city,
    signature_date: formatDate(input.signatureDate),
  };
}
