import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task, TaskPriority, TaskStatus } from "../domain/types";
import type { TaskFormInput } from "../domain/schemas";

interface TaskRow {
  id: string;
  organization_id: string;
  client_id: string;
  service_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  client: { name: string } | null;
  service: { name: string } | null;
  assignee: { id: string; full_name: string | null; email: string } | null;
}

const TASK_SELECT = `
  id, organization_id, client_id, service_id, title, description, status, priority,
  assignee_id, due_date, completed_at, created_by, created_at, updated_at,
  client:clients ( name ),
  service:services ( name ),
  assignee:users!tasks_assignee_id_fkey ( id, full_name, email )
`;

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    clientName: row.client?.name ?? "",
    serviceId: row.service_id,
    serviceName: row.service?.name ?? null,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignee: row.assignee
      ? { id: row.assignee.id, name: row.assignee.full_name ?? row.assignee.email }
      : null,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListTasksFilters {
  clientId?: string;
  serviceId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  dueFrom?: string;
  dueTo?: string;
  overdue?: boolean;
  includeCompleted?: boolean;
  search?: string;
}

export async function listTasks(
  supabase: SupabaseClient,
  organizationId: string,
  filters: ListTasksFilters = {}
): Promise<Task[]> {
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("organization_id", organizationId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (filters.clientId) query = query.eq("client_id", filters.clientId);
  if (filters.serviceId) query = query.eq("service_id", filters.serviceId);
  if (filters.assigneeId) query = query.eq("assignee_id", filters.assigneeId);

  if (filters.status) {
    query = query.eq("status", filters.status);
  } else if (!filters.includeCompleted) {
    query = query.neq("status", "completed");
  }

  if (filters.overdue) {
    const today = new Date().toISOString().slice(0, 10);
    query = query.lt("due_date", today).not("status", "in", "(completed,cancelled)");
  }

  if (filters.dueFrom) query = query.gte("due_date", filters.dueFrom);
  if (filters.dueTo) query = query.lte("due_date", filters.dueTo);

  if (filters.search) {
    const term = filters.search.replace(/[%_]/g, "");
    query = query.ilike("title", `%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data as unknown as TaskRow[]) ?? []).map(toTask);
}

export async function getTaskById(supabase: SupabaseClient, id: string): Promise<Task | null> {
  const { data, error } = await supabase.from("tasks").select(TASK_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toTask(data as unknown as TaskRow) : null;
}

function toTaskRowInput(input: TaskFormInput) {
  return {
    title: input.title,
    description: input.description ?? null,
    client_id: input.clientId,
    service_id: input.serviceId ?? null,
    assignee_id: input.assigneeId ?? null,
    status: input.status,
    priority: input.priority,
    due_date: input.dueDate ?? null,
  };
}

export async function createTask(
  supabase: SupabaseClient,
  organizationId: string,
  createdBy: string,
  input: TaskFormInput
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ organization_id: organizationId, created_by: createdBy, ...toTaskRowInput(input) })
    .select("id")
    .single();

  if (error) throw error;

  const task = await getTaskById(supabase, data.id);
  if (!task) throw new Error("Demanda criada, mas não foi possível recarregá-la.");
  return task;
}

export async function updateTask(
  supabase: SupabaseClient,
  id: string,
  input: TaskFormInput
): Promise<Task> {
  const { error } = await supabase.from("tasks").update(toTaskRowInput(input)).eq("id", id);
  if (error) throw error;

  const task = await getTaskById(supabase, id);
  if (!task) throw new Error("Demanda atualizada, mas não foi possível recarregá-la.");
  return task;
}

export async function changeTaskStatus(
  supabase: SupabaseClient,
  id: string,
  status: TaskStatus
): Promise<Task> {
  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
  if (error) throw error;

  const task = await getTaskById(supabase, id);
  if (!task) throw new Error("Demanda atualizada, mas não foi possível recarregá-la.");
  return task;
}

/**
 * Open-task count per client, for the Clientes "Entregas" column. Returns a
 * plain map instead of enriching every client row so this stays a single
 * cheap query regardless of how many clients exist.
 */
export async function countOpenTasksByClient(
  supabase: SupabaseClient,
  organizationId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("tasks")
    .select("client_id")
    .eq("organization_id", organizationId)
    .not("status", "in", "(completed,cancelled)");

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of (data as { client_id: string }[]) ?? []) {
    counts[row.client_id] = (counts[row.client_id] ?? 0) + 1;
  }
  return counts;
}

export async function assignTask(
  supabase: SupabaseClient,
  id: string,
  assigneeId: string | null
): Promise<Task> {
  const { error } = await supabase.from("tasks").update({ assignee_id: assigneeId }).eq("id", id);
  if (error) throw error;

  const task = await getTaskById(supabase, id);
  if (!task) throw new Error("Demanda atualizada, mas não foi possível recarregá-la.");
  return task;
}
