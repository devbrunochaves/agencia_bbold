import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { ChangeTaskStatusSchema, type ChangeTaskStatusInput } from "../domain/schemas";
import { changeTaskStatus as changeTaskStatusRepository, getTaskById } from "../infrastructure/tasks.repository";
import type { Task } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

export async function changeTaskStatus(input: ChangeTaskStatusInput): Promise<Task> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();

  if (!hasPermission(context.currentMembership, "tasks.manage")) {
    throw new UnauthorizedError();
  }

  const parsed = ChangeTaskStatusSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message);
  }

  const supabase = await createSupabaseServerClient();

  const existing = await getTaskById(supabase, parsed.data.id);
  if (!existing || existing.organizationId !== context.currentMembership.organization.id) {
    throw new UnauthorizedError();
  }

  return changeTaskStatusRepository(supabase, parsed.data.id, parsed.data.status);
}
