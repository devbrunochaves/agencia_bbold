"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_LABEL = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function MonthSelector({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigateTo(nextMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", nextMonth);
    router.push(`${pathname}?${params.toString()}`);
  }

  const [year, m] = month.split("-").map(Number);
  const label = MONTH_LABEL.format(new Date(Date.UTC(year, m - 1, 1)));

  return (
    <div className="flex items-center gap-1 rounded-lg border border-flow-border bg-flow-panel p-1">
      <button
        type="button"
        onClick={() => navigateTo(shiftMonth(month, -1))}
        className="flex h-7 w-7 items-center justify-center rounded-md text-flow-text-muted hover:bg-flow-panel-alt hover:text-flow-text-primary"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
      </button>
      <span className="min-w-[9rem] text-center text-sm capitalize text-flow-text-primary">{label}</span>
      <button
        type="button"
        onClick={() => navigateTo(shiftMonth(month, 1))}
        className="flex h-7 w-7 items-center justify-center rounded-md text-flow-text-muted hover:bg-flow-panel-alt hover:text-flow-text-primary"
        aria-label="Próximo mês"
      >
        <ChevronRight size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}
