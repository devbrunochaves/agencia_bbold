"use client";

import { useEffect } from "react";
import { Button } from "@/components/flow/ui";

export default function FlowError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-semibold tracking-[0.3em] text-flow-yellow">BBOLD FLOW</p>
      <h1 className="mt-1 text-xl font-semibold text-flow-text-primary">Algo deu errado</h1>
      <p className="mt-2 max-w-sm text-sm text-flow-text-muted">
        Não foi possível carregar esta página agora. Tente novamente em instantes.
      </p>
      <Button className="mt-5" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </div>
  );
}
