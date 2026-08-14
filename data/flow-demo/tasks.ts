// MOCK — dado de UI temporário. Ver README.md deste diretório.

export interface DemoTask {
  id: string;
  title: string;
  client: string;
  assignee: string;
  dueDate: string | null;
  priority: "none" | "normal" | "high" | "urgent";
  status:
    | "backlog"
    | "todo"
    | "in_progress"
    | "internal_review"
    | "waiting_client"
    | "changes_requested"
    | "approved"
    | "completed";
  overdue?: boolean;
  dueToday?: boolean;
}

export const demoTasks: DemoTask[] = [
  { id: "1", title: "Carrossel institucional — Agosto", client: "Padaria Diplomata", assignee: "Aline", dueDate: "12 Ago", priority: "high", status: "in_progress" },
  { id: "2", title: "Reels — bastidores da produção", client: "Padaria Diplomata", assignee: "Gabriel", dueDate: "10 Ago", priority: "urgent", status: "waiting_client", overdue: true },
  { id: "3", title: "Landing page — seção de depoimentos", client: "Bianca Calil Nutri", assignee: "Bruno", dueDate: "15 Ago", priority: "normal", status: "internal_review" },
  { id: "4", title: "Ajuste de paleta — manual de marca", client: "Monte Sião", assignee: "Aline", dueDate: null, priority: "none", status: "backlog" },
  { id: "5", title: "Revisão de textos — home", client: "CSS Log", assignee: "Bruno", dueDate: "09 Ago", priority: "high", status: "changes_requested", overdue: true },
  { id: "6", title: "Aprovação — calendário de setembro", client: "Padaria Diplomata", assignee: "Aline", dueDate: "20 Ago", priority: "normal", status: "approved" },
  { id: "7", title: "Post de aniversário da marca", client: "Padaria Diplomata", assignee: "Gabriel", dueDate: "Hoje", priority: "normal", status: "todo", dueToday: true },
  { id: "8", title: "Entrega final — identidade visual", client: "Monte Sião", assignee: "Aline", dueDate: "05 Ago", priority: "urgent", status: "completed" },
];

export const demoFolders = [
  {
    group: "Social Media",
    organization: "BBOLD",
    clients: ["Padaria Diplomata", "Clínica Nutrição Vida"],
  },
  {
    group: "Web Design",
    organization: "BBOLD",
    clients: ["CSS Log", "Bianca Calil Nutri"],
  },
  {
    group: "Identidade Visual",
    organization: "BBOLD",
    clients: ["Monte Sião"],
  },
];
