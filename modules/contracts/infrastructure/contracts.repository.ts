import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillingType, Contract, ContractStatus, PartySnapshot, PaymentMethod } from "../domain/types";
import type { ContractFormInput } from "../domain/schemas";
import { centsToAmountString, parseAmountToCents } from "@/modules/finance/domain/money";

interface InstallmentRow {
  id: string;
  installment_number: number;
  amount: string | number;
  due_date: string;
}

interface ContractRow {
  id: string;
  organization_id: string;
  client_id: string;
  service_id: string | null;
  template_id: string | null;
  title: string;
  status: ContractStatus;
  contract_number: string | null;
  start_date: string;
  end_date: string | null;
  billing_type: BillingType;
  total_amount: string | number | null;
  recurring_amount: string | number | null;
  billing_day: number | null;
  payment_method: PaymentMethod;
  installments_count: number | null;
  city: string;
  signature_date: string | null;
  client_snapshot: PartySnapshot;
  contractor_snapshot: PartySnapshot;
  content_snapshot: string;
  sent_at: string | null;
  signed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  client: { name: string } | null;
  service: { name: string } | null;
  contract_installments: InstallmentRow[];
}

const CONTRACT_SELECT = `
  id, organization_id, client_id, service_id, template_id, title, status, contract_number,
  start_date, end_date, billing_type, total_amount, recurring_amount, billing_day,
  payment_method, installments_count, city, signature_date,
  client_snapshot, contractor_snapshot, content_snapshot,
  sent_at, signed_at, cancelled_at, created_at, updated_at,
  client:clients ( name ),
  service:services ( name ),
  contract_installments ( id, installment_number, amount, due_date )
`;

function toContract(row: ContractRow): Contract {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    clientName: row.client?.name ?? "",
    serviceId: row.service_id,
    serviceName: row.service?.name ?? null,
    templateId: row.template_id,
    title: row.title,
    status: row.status,
    contractNumber: row.contract_number,
    startDate: row.start_date,
    endDate: row.end_date,
    billingType: row.billing_type,
    totalAmountCents: row.total_amount !== null ? parseAmountToCents(row.total_amount) : null,
    recurringAmountCents: row.recurring_amount !== null ? parseAmountToCents(row.recurring_amount) : null,
    billingDay: row.billing_day,
    paymentMethod: row.payment_method,
    installmentsCount: row.installments_count,
    city: row.city,
    signatureDate: row.signature_date,
    clientSnapshot: row.client_snapshot,
    contractorSnapshot: row.contractor_snapshot,
    contentSnapshot: row.content_snapshot,
    sentAt: row.sent_at,
    signedAt: row.signed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    installments: (row.contract_installments ?? [])
      .sort((a, b) => a.installment_number - b.installment_number)
      .map((i) => ({
        id: i.id,
        installmentNumber: i.installment_number,
        amountCents: parseAmountToCents(i.amount),
        dueDate: i.due_date,
      })),
  };
}

export interface ListContractsFilters {
  competenceMonth?: string;
  status?: ContractStatus;
  clientId?: string;
  serviceId?: string;
  search?: string;
}

export async function listContracts(
  supabase: SupabaseClient,
  organizationId: string,
  filters: ListContractsFilters = {}
): Promise<Contract[]> {
  let query = supabase
    .from("contracts")
    .select(CONTRACT_SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.clientId) query = query.eq("client_id", filters.clientId);
  if (filters.serviceId) query = query.eq("service_id", filters.serviceId);
  if (filters.search) {
    const term = filters.search.replace(/[%_]/g, "");
    query = query.or(`title.ilike.%${term}%,contract_number.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data as unknown as ContractRow[]) ?? []).map(toContract);
}

export async function getContractById(supabase: SupabaseClient, id: string): Promise<Contract | null> {
  const { data, error } = await supabase.from("contracts").select(CONTRACT_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toContract(data as unknown as ContractRow) : null;
}

function snapshotToRow(snapshot: PartySnapshot) {
  return {
    name: snapshot.name,
    legalName: snapshot.legalName,
    documentType: snapshot.documentType,
    documentNumber: snapshot.documentNumber,
    email: snapshot.email,
    phone: snapshot.phone,
    addressStreet: snapshot.addressStreet,
    addressNumber: snapshot.addressNumber,
    addressComplement: snapshot.addressComplement,
    addressNeighborhood: snapshot.addressNeighborhood,
    addressCity: snapshot.addressCity,
    addressState: snapshot.addressState,
    addressZipCode: snapshot.addressZipCode,
    representativeName: snapshot.representativeName,
    representativeDocument: snapshot.representativeDocument,
  };
}

export async function createContract(
  supabase: SupabaseClient,
  organizationId: string,
  createdBy: string,
  input: ContractFormInput,
  contractorSnapshot: PartySnapshot,
  contentSnapshot: string,
  installmentAmountsCents: number[]
): Promise<Contract> {
  const { data, error } = await supabase
    .from("contracts")
    .insert({
      organization_id: organizationId,
      created_by: createdBy,
      template_id: input.templateId ?? null,
      client_id: input.clientId,
      service_id: input.serviceId ?? null,
      title: input.title,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      billing_type: input.billingType,
      total_amount: input.totalAmountCents ? centsToAmountString(input.totalAmountCents) : null,
      recurring_amount: input.recurringAmountCents ? centsToAmountString(input.recurringAmountCents) : null,
      billing_day: input.billingDay ?? null,
      payment_method: input.paymentMethod,
      installments_count: input.installmentsCount ?? null,
      city: input.city,
      signature_date: input.signatureDate ?? null,
      client_snapshot: snapshotToRow(input.clientSnapshot),
      contractor_snapshot: snapshotToRow(contractorSnapshot),
      content_snapshot: contentSnapshot,
    })
    .select("id")
    .single();

  if (error) throw error;

  if (input.billingType === "installment" && installmentAmountsCents.length > 0) {
    await insertInstallments(supabase, organizationId, data.id, installmentAmountsCents, input.installmentDueDates ?? []);
  }

  const contract = await getContractById(supabase, data.id);
  if (!contract) throw new Error("Contrato criado, mas não foi possível recarregá-lo.");
  return contract;
}

export async function updateContract(
  supabase: SupabaseClient,
  organizationId: string,
  id: string,
  input: ContractFormInput,
  contentSnapshot: string,
  installmentAmountsCents: number[]
): Promise<Contract> {
  const { error } = await supabase
    .from("contracts")
    .update({
      template_id: input.templateId ?? null,
      client_id: input.clientId,
      service_id: input.serviceId ?? null,
      title: input.title,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      billing_type: input.billingType,
      total_amount: input.totalAmountCents ? centsToAmountString(input.totalAmountCents) : null,
      recurring_amount: input.recurringAmountCents ? centsToAmountString(input.recurringAmountCents) : null,
      billing_day: input.billingDay ?? null,
      payment_method: input.paymentMethod,
      installments_count: input.installmentsCount ?? null,
      city: input.city,
      signature_date: input.signatureDate ?? null,
      client_snapshot: snapshotToRow(input.clientSnapshot),
      content_snapshot: contentSnapshot,
    })
    .eq("id", id);

  if (error) throw error;

  await supabase.from("contract_installments").delete().eq("contract_id", id);
  if (input.billingType === "installment" && installmentAmountsCents.length > 0) {
    await insertInstallments(supabase, organizationId, id, installmentAmountsCents, input.installmentDueDates ?? []);
  }

  const contract = await getContractById(supabase, id);
  if (!contract) throw new Error("Contrato atualizado, mas não foi possível recarregá-lo.");
  return contract;
}

async function insertInstallments(
  supabase: SupabaseClient,
  organizationId: string,
  contractId: string,
  amountsCents: number[],
  dueDates: string[]
): Promise<void> {
  const rows = amountsCents.map((amountCents, index) => ({
    organization_id: organizationId,
    contract_id: contractId,
    installment_number: index + 1,
    amount: centsToAmountString(amountCents),
    due_date: dueDates[index],
  }));
  const { error } = await supabase.from("contract_installments").insert(rows);
  if (error) throw error;
}

export async function changeContractStatus(
  supabase: SupabaseClient,
  id: string,
  status: ContractStatus
): Promise<Contract> {
  const { error } = await supabase.from("contracts").update({ status }).eq("id", id);
  if (error) throw error;

  const contract = await getContractById(supabase, id);
  if (!contract) throw new Error("Contrato atualizado, mas não foi possível recarregá-lo.");
  return contract;
}
