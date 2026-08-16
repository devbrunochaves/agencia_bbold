"use server";

import { revalidatePath } from "next/cache";
import {
  createClient,
  updateClient,
  changeClientStatus,
  ClientsAppError,
  type ClientFormInput,
  type ClientStatus,
} from "@/modules/clients";

type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

function toUserMessage(error: unknown): string {
  if (error instanceof ClientsAppError) return error.message;
  // Never surface raw Supabase/Postgres error text to the UI.
  return "Não foi possível concluir a ação. Tente novamente em instantes.";
}

export async function createClientAction(input: ClientFormInput): Promise<ActionResult<{ id: string }>> {
  try {
    const client = await createClient(input);
    revalidatePath("/flow/clientes");
    revalidatePath("/flow");
    return { ok: true, data: { id: client.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateClientAction(
  id: string,
  input: ClientFormInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const client = await updateClient({ ...input, id });
    revalidatePath("/flow/clientes");
    revalidatePath("/flow");
    return { ok: true, data: { id: client.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function changeClientStatusAction(
  id: string,
  status: ClientStatus
): Promise<ActionResult<{ id: string }>> {
  try {
    const client = await changeClientStatus({ id, status });
    revalidatePath("/flow/clientes");
    revalidatePath("/flow");
    return { ok: true, data: { id: client.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
