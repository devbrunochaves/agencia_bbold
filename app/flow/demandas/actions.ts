"use server";

import { revalidatePath } from "next/cache";
import {
  createTask,
  updateTask,
  changeTaskStatus,
  assignTask,
  TasksAppError,
  type TaskFormInput,
  type TaskStatus,
} from "@/modules/tasks";

type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

function toUserMessage(error: unknown): string {
  if (error instanceof TasksAppError) return error.message;
  return "Não foi possível concluir a ação. Tente novamente em instantes.";
}

export async function createTaskAction(input: TaskFormInput): Promise<ActionResult<{ id: string }>> {
  try {
    const task = await createTask(input);
    revalidatePath("/flow/demandas");
    revalidatePath("/flow/clientes");
    revalidatePath("/flow");
    return { ok: true, data: { id: task.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function updateTaskAction(
  id: string,
  input: TaskFormInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const task = await updateTask({ ...input, id });
    revalidatePath("/flow/demandas");
    revalidatePath("/flow/clientes");
    revalidatePath("/flow");
    return { ok: true, data: { id: task.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function changeTaskStatusAction(
  id: string,
  status: TaskStatus
): Promise<ActionResult<{ id: string }>> {
  try {
    const task = await changeTaskStatus({ id, status });
    revalidatePath("/flow/demandas");
    revalidatePath("/flow/clientes");
    revalidatePath("/flow");
    return { ok: true, data: { id: task.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}

export async function assignTaskAction(
  id: string,
  assigneeId: string | null
): Promise<ActionResult<{ id: string }>> {
  try {
    const task = await assignTask({ id, assigneeId });
    revalidatePath("/flow/demandas");
    revalidatePath("/flow");
    return { ok: true, data: { id: task.id } };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
