import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext, hasPermission } from "@/modules/identity";
import { listTasks as listTasksRepository, type ListTasksFilters } from "../infrastructure/tasks.repository";
import type { Task } from "../domain/types";
import { UnauthorizedError } from "./errors";

export async function listTasks(filters: ListTasksFilters = {}): Promise<Task[]> {
  const context = await getCurrentUserContext();
  if (!context?.currentMembership) return [];

  if (!hasPermission(context.currentMembership, "tasks.view")) {
    throw new UnauthorizedError();
  }

  const supabase = await createSupabaseServerClient();
  return listTasksRepository(supabase, context.currentMembership.organization.id, filters);
}
