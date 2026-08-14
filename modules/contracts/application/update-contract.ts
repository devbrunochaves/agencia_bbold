import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { getServiceById } from "@/modules/services/infrastructure/services.repository";
import { ContractFormSchema, type ContractFormInput } from "../domain/schemas";
import { getContractById, updateContract as updateContractRepository } from "../infrastructure/contracts.repository";
import { getTemplateById } from "../infrastructure/contract-templates.repository";
import { renderTemplate, DEFAULT_CONTRACT_TEMPLATE } from "../domain/template-engine";
import { buildTemplateValues } from "../domain/build-template-values";
import { splitAmountIntoInstallments } from "../domain/rules";
import type { Contract } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

/** Only drafts can be edited — once sent, content_snapshot represents what the client actually saw. */
export async function updateContract(id: string, input: ContractFormInput): Promise<Contract> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "contracts.manage")) throw new UnauthorizedError();

  const parsed = ContractFormSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);
  const data = parsed.data;

  const organizationId = context.currentMembership.organization.id;
  const supabase = await createSupabaseServerClient();

  const existing = await getContractById(supabase, id);
  if (!existing || existing.organizationId !== organizationId) throw new UnauthorizedError();
  if (existing.status !== "draft") {
    throw new ValidationError("Apenas contratos em rascunho podem ser editados.");
  }

  const template = data.templateId ? await getTemplateById(supabase, data.templateId) : null;
  if (data.templateId && (!template || template.organizationId !== organizationId)) {
    throw new ValidationError("Modelo de contrato inválido.");
  }

  const service = data.serviceId ? await getServiceById(supabase, data.serviceId) : null;

  const templateValues = buildTemplateValues({
    client: data.clientSnapshot,
    contractor: existing.contractorSnapshot,
    serviceName: service?.name ?? "",
    description: data.description,
    billingType: data.billingType,
    totalAmountCents: data.totalAmountCents ?? null,
    recurringAmountCents: data.recurringAmountCents ?? null,
    billingDay: data.billingDay ?? null,
    paymentMethod: data.paymentMethod,
    installmentsCount: data.installmentsCount ?? null,
    startDate: data.startDate,
    endDate: data.endDate ?? null,
    city: data.city,
    signatureDate: data.signatureDate ?? null,
  });

  const contentSnapshot = renderTemplate(template?.content ?? DEFAULT_CONTRACT_TEMPLATE, templateValues);

  let installmentAmounts: number[] = [];
  if (data.billingType === "installment") {
    const count = data.installmentsCount ?? 1;
    installmentAmounts = splitAmountIntoInstallments(data.totalAmountCents ?? 0, count);
    if ((data.installmentDueDates ?? []).length !== count) {
      throw new ValidationError("Informe a data de vencimento de cada parcela.");
    }
  }

  return updateContractRepository(supabase, organizationId, id, data, contentSnapshot, installmentAmounts);
}
