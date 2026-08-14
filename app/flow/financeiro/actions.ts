"use server";

import { revalidatePath } from "next/cache";
import {
  createFinancialEntry,
  updateFinancialEntry,
  markFinancialEntryAsPaid,
  markInvoiceAsIssued,
  revertInvoiceToPending,
  cancelFinancialEntry,
  createFinancialCategory,
  updateFinancialCategory,
  createFinancialRecurrence,
  setFinancialRecurrenceActive,
  generateEntriesForCompetence,
  updateFinancialSettings,
  FinanceAppError,
  type FinancialEntryFormInput,
  type CreateFinancialCategoryInput,
  type UpdateFinancialCategoryInput,
  type CreateFinancialRecurrenceInput,
  type UpdateFinancialSettingsInput,
} from "@/modules/finance";

type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

function toUserMessage(error: unknown): string {
  if (error instanceof FinanceAppError) return error.message;
  return "Não foi possível concluir a ação. Tente novamente em instantes.";
}

function revalidateFinance() {
  revalidatePath("/flow/financeiro");
  revalidatePath("/flow/configuracoes");
}

export async function createFinancialEntryAction(
  input: FinancialEntryFormInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const entry = await createFinancialEntry(input);
    revalidateFinance();
    return { ok: true, data: { id: entry.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateFinancialEntryAction(
  id: string,
  input: FinancialEntryFormInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const entry = await updateFinancialEntry({ ...input, id });
    revalidateFinance();
    return { ok: true, data: { id: entry.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function markEntryAsPaidAction(id: string, paidAt: string): Promise<ActionResult<{ id: string }>> {
  try {
    const entry = await markFinancialEntryAsPaid(id, paidAt);
    revalidateFinance();
    return { ok: true, data: { id: entry.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function markInvoiceIssuedAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const entry = await markInvoiceAsIssued(id);
    revalidateFinance();
    return { ok: true, data: { id: entry.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function revertInvoiceAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const entry = await revertInvoiceToPending(id);
    revalidateFinance();
    return { ok: true, data: { id: entry.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function cancelEntryAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const entry = await cancelFinancialEntry(id);
    revalidateFinance();
    return { ok: true, data: { id: entry.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function createCategoryAction(
  input: CreateFinancialCategoryInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const category = await createFinancialCategory(input);
    revalidateFinance();
    return { ok: true, data: { id: category.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateCategoryAction(
  input: UpdateFinancialCategoryInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const category = await updateFinancialCategory(input);
    revalidateFinance();
    return { ok: true, data: { id: category.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function createRecurrenceAction(
  input: CreateFinancialRecurrenceInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const recurrence = await createFinancialRecurrence(input);
    revalidateFinance();
    return { ok: true, data: { id: recurrence.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function setRecurrenceActiveAction(
  id: string,
  active: boolean
): Promise<ActionResult<{ id: string }>> {
  try {
    const recurrence = await setFinancialRecurrenceActive(id, active);
    revalidateFinance();
    return { ok: true, data: { id: recurrence.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function generateEntriesAction(
  competenceMonth: string
): Promise<ActionResult<{ created: number; skipped: number }>> {
  try {
    const result = await generateEntriesForCompetence(competenceMonth);
    revalidateFinance();
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateSettingsAction(
  input: UpdateFinancialSettingsInput
): Promise<ActionResult<null>> {
  try {
    await updateFinancialSettings(input);
    revalidateFinance();
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
