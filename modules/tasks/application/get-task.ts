import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { getTaskById } from "../infrastructure/tasks.repository";
import type { Task } from "../domain/types";
import { UnauthorizedError } from "./errors";

export async function getTask(id: string): Promise<Task | null> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return null;

  if (!hasPermission(context.currentMembership, "tasks.view")) {
    throw new UnauthorizedError();
  }

  const supabase = await createSupabaseServerClient();
  const task = await getTaskById(supabase, id);

  if (task && task.organizationId !== context.currentMembership.organization.id) {
    return null;
  }

  return task;
}
