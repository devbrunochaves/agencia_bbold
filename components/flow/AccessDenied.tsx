import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/**
 * Server-rendered — this is the real boundary (requirePermission() denied
 * the page), not a client-side "hide if no permission" check. Rendered
 * inside the normal AppShell slot so navigation to whatever the user *can*
 * access stays available.
 */
export default function AccessDenied({
  title = "Acesso restrito",
  description = "Você não possui permissão para acessar esta área.",
  backHref = "/flow",
}: {
  title?: string;
  description?: string;
  backHref?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-flow-panel-alt text-flow-text-muted">
        <ShieldAlert size={22} strokeWidth={1.75} />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-flow-text-primary">{title}</h1>
        <p className="mt-2 max-w-sm text-sm text-flow-text-muted">{description}</p>
      </div>
      <Link
        href={backHref}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-flow-border bg-flow-panel-alt px-4 text-sm font-medium text-flow-text-primary transition-colors hover:border-flow-border-strong"
      >
        Voltar ao Dashboard
      </Link>
    </div>
  );
}
