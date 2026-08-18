import type { Metadata } from "next";
import { listTasks, type TaskStatus } from "@/modules/tasks";
import { listClients } from "@/modules/clients";
import { listOrganizationMembers, requirePermission } from "@/modules/identity";
import AccessDenied from "@/components/flow/AccessDenied";
import DemandasView from "./DemandasView";

export const metadata: Metadata = {
  title: "Demandas — BBOLD Flow",
  robots: { index: false, follow: false },
};

interface DemandasPageProps {
  searchParams: Promise<{
    status?: string;
    assignee?: string;
    client?: string;
    service?: string;
    completed?: string;
  }>;
}

const VALID_STATUSES: TaskStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "internal_review",
  "waiting_client",
  "changes_requested",
  "approved",
  "completed",
  "cancelled",
];

export default async function DemandasPage({ searchParams }: DemandasPageProps) {
  const check = await requirePermission("tasks.view");
  if (!check.ok) return <AccessDenied />;

  const params = await searchParams;
  const status = VALID_STATUSES.includes(params.status as TaskStatus)
    ? (params.status as TaskStatus)
    : undefined;

  const [tasks, clients, members] = await Promise.all([
    listTasks({
      status,
      assigneeId: params.assignee || undefined,
      clientId: params.client || undefined,
      serviceId: params.service || undefined,
      includeCompleted: params.completed === "1",
    }),
    listClients(),
    listOrganizationMembers(),
  ]);

  return <DemandasView tasks={tasks} clients={clients} members={members} />;
}
