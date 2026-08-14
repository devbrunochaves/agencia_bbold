import Badge, { type BadgeTone } from "./Badge";

/**
 * Single source of truth for status → (label, color) across every module.
 * Add new statuses here instead of hardcoding tone logic in a page.
 */
const STATUS_CONFIG: Record<string, { label: string; tone: BadgeTone }> = {
  // clients.status
  prospect: { label: "Prospect", tone: "info" },
  active: { label: "Ativo", tone: "success" },
  paused: { label: "Pausado", tone: "warning" },
  closed: { label: "Encerrado", tone: "neutral" },

  // tasks.status
  backlog: { label: "Backlog", tone: "neutral" },
  todo: { label: "A iniciar", tone: "neutral" },
  in_progress: { label: "Criando", tone: "info" },
  internal_review: { label: "Revisão interna", tone: "waiting" },
  waiting_client: { label: "Aguardando cliente", tone: "waiting" },
  changes_requested: { label: "Alteração", tone: "danger" },
  approved: { label: "Aprovado", tone: "success" },
  completed: { label: "Concluído", tone: "success" },

  // financial_entries.status
  planned: { label: "Planejado", tone: "neutral" },
  pending: { label: "Pendente", tone: "warning" },
  paid: { label: "Pago", tone: "success" },
  overdue: { label: "Atrasado", tone: "danger" },
  cancelled: { label: "Cancelado", tone: "neutral" },

  // contracts.status
  draft: { label: "Rascunho", tone: "neutral" },
  sent: { label: "Enviado", tone: "waiting" },
  signed: { label: "Assinado", tone: "success" },
  expired: { label: "Expirado", tone: "danger" },

  // memberships.status (active/cancelled already covered above)
  invited: { label: "Convite pendente", tone: "waiting" },
  suspended: { label: "Suspenso", tone: "danger" },
  removed: { label: "Removido", tone: "neutral" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
