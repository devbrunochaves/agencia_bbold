"use server";

import { revalidatePath } from "next/cache";
import {
  createContract,
  updateContract,
  changeContractStatus,
  createFinanceFromContract,
  createContractTemplate,
  ContractsAppError,
  type ContractFormInput,
  type ContractStatus,
  type CreateContractTemplateInput,
} from "@/modules/contracts";

type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

function toUserMessage(error: unknown): string {
  if (error instanceof ContractsAppError) return error.message;
  return "Não foi possível concluir a ação. Tente novamente em instantes.";
}

function revalidateContracts() {
  revalidatePath("/flow/contratos");
  revalidatePath("/flow/financeiro");
  revalidatePath("/flow");
}

export async function createContractAction(input: ContractFormInput): Promise<ActionResult<{ id: string }>> {
  try {
    const contract = await createContract(input);
    revalidateContracts();
    return { ok: true, data: { id: contract.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateContractAction(
  id: string,
  input: ContractFormInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const contract = await updateContract(id, input);
    revalidateContracts();
    return { ok: true, data: { id: contract.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function changeContractStatusAction(
  id: string,
  status: ContractStatus
): Promise<ActionResult<{ id: string }>> {
  try {
    const contract = await changeContractStatus({ id, status });
    revalidateContracts();
    return { ok: true, data: { id: contract.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function createFinanceFromContractAction(
  contractId: string
): Promise<ActionResult<{ created: boolean; message: string }>> {
  try {
    const result = await createFinanceFromContract({ contractId });
    revalidateContracts();
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function createTemplateAction(
  input: CreateContractTemplateInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const template = await createContractTemplate(input);
    revalidateContracts();
    return { ok: true, data: { id: template.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
