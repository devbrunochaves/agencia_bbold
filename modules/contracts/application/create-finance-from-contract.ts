import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { CreateFinanceFromContractSchema, type CreateFinanceFromContractInput } from "../domain/schemas";
import { getContractById } from "../infrastructure/contracts.repository";
import { listCategories } from "@/modules/finance/infrastructure/financial-categories.repository";
import {
  countEntriesByContract,
  insertEntriesForContract,
} from "@/modules/finance/infrastructure/financial-entries.repository";
import {
  createRecurrenceForContract,
  getRecurrenceByContractId,
} from "@/modules/finance/infrastructure/financial-recurrences.repository";
import { centsToAmountString } from "@/modules/finance/domain/money";
import { UnauthorizedError, ValidationError } from "./errors";

function monthOf(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

async function pickIncomeCategory(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
  preferredName: string
): Promise<string> {
  const categories = await listCategories(supabase, organizationId, { type: "income" });
  if (categories.length === 0) {
    throw new ValidationError(
      "Nenhuma categoria de receita configurada. Crie uma categoria em Configurações antes de gerar o financeiro."
    );
  }
  return (categories.find((c) => c.name === preferredName) ?? categories[0]).id;
}

export interface CreateFinanceFromContractResult {
  created: boolean;
  message: string;
}

export async function createFinanceFromContract(
  input: CreateFinanceFromContractInput
): Promise<CreateFinanceFromContractResult> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();
  if (!hasPermission(context.currentMembership, "finance.manage")) throw new UnauthorizedError();

  const parsed = CreateFinanceFromContractSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);

  const organizationId = context.currentMembership.organization.id;
  const supabase = await createSupabaseServerClient();

  const contract = await getContractById(supabase, parsed.data.contractId);
  if (!contract || contract.organizationId !== organizationId) throw new UnauthorizedError();
  if (contract.status !== "signed") {
    throw new ValidationError("Apenas contratos assinados podem gerar cobrança financeira.");
  }

  if (contract.billingType === "recurring") {
    const existing = await getRecurrenceByContractId(supabase, contract.id);
    if (existing) return { created: false, message: "Este contrato já possui uma recorrência financeira." };

    const categoryId = await pickIncomeCategory(supabase, organizationId, "Clientes fixos");
    await createRecurrenceForContract(supabase, organizationId, context.user.id, {
      contractId: contract.id,
      clientId: contract.clientId,
      categoryId,
      description: contract.title,
      amountCents: contract.recurringAmountCents ?? 0,
      startDate: contract.startDate,
      endDate: contract.endDate,
      dayOfMonth: contract.billingDay ?? 10,
    });
    return { created: true, message: "Recorrência financeira criada a partir do contrato." };
  }

  const existingCount = await countEntriesByContract(supabase, contract.id);
  if (existingCount > 0) {
    return { created: false, message: "Este contrato já possui lançamentos financeiros gerados." };
  }

  const categoryId = await pickIncomeCategory(supabase, organizationId, "Projetos avulsos");

  if (contract.billingType === "installment") {
    const rows = contract.installments.map((installment) => ({
      organization_id: organizationId,
      client_id: contract.clientId,
      contract_id: contract.id,
      category_id: categoryId,
      description: `${contract.title} — Parcela ${installment.installmentNumber}/${contract.installments.length}`,
      amount: centsToAmountString(installment.amountCents),
      competence_month: monthOf(installment.dueDate),
      due_date: installment.dueDate,
      created_by: context.user.id,
    }));
    const created = await insertEntriesForContract(supabase, rows);
    return { created: created > 0, message: `${created} parcela(s) lançada(s) no financeiro.` };
  }

  // one_time
  const dueDate = contract.signatureDate ?? contract.startDate;
  const created = await insertEntriesForContract(supabase, [
    {
      organization_id: organizationId,
      client_id: contract.clientId,
      contract_id: contract.id,
      category_id: categoryId,
      description: contract.title,
      amount: centsToAmountString(contract.totalAmountCents ?? 0),
      competence_month: monthOf(dueDate),
      due_date: dueDate,
      created_by: context.user.id,
    },
  ]);
  return { created: created > 0, message: "Lançamento gerado no financeiro." };
}
