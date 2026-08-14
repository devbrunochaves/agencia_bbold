import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Sem acesso — BBOLD Flow",
  robots: { index: false, follow: false },
};

/**
 * Destination of getDefaultRoute() when a membership has zero view
 * permissions (e.g. a freshly created custom role with nothing granted
 * yet) — an edge case, but one that must resolve to something other than a
 * redirect loop back through every other page's AccessDenied.
 */
export default function SemAcessoPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-flow-panel-alt text-flow-text-muted">
        <ShieldAlert size={22} strokeWidth={1.75} />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-flow-text-primary">Nenhum acesso configurado</h1>
        <p className="mt-2 max-w-sm text-sm text-flow-text-muted">
          Seu papel atual não possui nenhuma permissão de visualização configurada. Fale com um
          administrador da organização para ajustar seu acesso.
        </p>
      </div>
    </div>
  );
}
