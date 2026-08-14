import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { CreateTaskSchema, type CreateTaskInput } from "../domain/schemas";
import { createTask as createTaskRepository } from "../infrastructure/tasks.repository";
import type { Task } from "../domain/types";
import { UnauthorizedError, ValidationError } from "./errors";

/**
 * organization_id and created_by are resolved from the authenticated
 * session — never accepted from the form, per the multi-tenant model.
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) throw new UnauthorizedError();

  if (!hasPermission(context.currentMembership, "tasks.manage")) {
    throw new UnauthorizedError();
  }

  const parsed = CreateTaskSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message);
  }

  const supabase = await createSupabaseServerClient();
  return createTaskRepository(
    supabase,
    context.currentMembership.organization.id,
    context.user.id,
    parsed.data
  );
}
