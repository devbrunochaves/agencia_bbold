"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign } from "lucide-react";
import Card from "@/components/flow/Card";
import { Button, Input } from "@/components/flow/ui";
import type { OrganizationFinancialSettings } from "@/modules/finance/domain/types";
import { parseUserAmountToCents } from "@/modules/finance/domain/money";
import { UpdateFinancialSettingsSchema } from "@/modules/finance/domain/schemas";
import { updateSettingsAction } from "@/app/flow/financeiro/actions";

export default function FinancialSettingsCard({ settings }: { settings: OrganizationFinancialSettings }) {
  const router = useRouter();
  const [goalInput, setGoalInput] = useState((settings.monthlyRevenueGoalCents / 100).toFixed(2));
  const [balanceInput, setBalanceInput] = useState((settings.openingBalanceCents / 100).toFixed(2));
  const [balanceDate, setBalanceDate] = useState(settings.openingBalanceDate);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setMessage(null);

    const parsed = UpdateFinancialSettingsSchema.safeParse({
      monthlyRevenueGoalCents: parseUserAmountToCents(goalInput),
      openingBalanceCents: parseUserAmountToCents(balanceInput),
      openingBalanceDate: balanceDate,
    });

    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Dados inválidos");
      setLoading(false);
      return;
    }

    const result = await updateSettingsAction(parsed.data);
    setLoading(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setMessage("Salvo.");
    router.refresh();
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-flow-panel-alt text-flow-yellow">
          <DollarSign size={18} strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-semibold text-flow-text-primary">Meta financeira e saldo inicial</p>
          <p className="text-xs text-flow-text-muted">Usados no painel do Financeiro.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-flow-text-muted">Meta mensal de receita</label>
          <Input inputMode="decimal" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-flow-text-muted">Saldo inicial</label>
          <Input inputMode="decimal" value={balanceInput} onChange={(e) => setBalanceInput(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-flow-text-muted">Data do saldo inicial</label>
          <Input type="date" value={balanceDate} onChange={(e) => setBalanceDate(e.target.value)} />
        </div>
      </div>

      {message && <p className="text-xs text-flow-text-muted">{message}</p>}

      <Button size="sm" onClick={handleSubmit} disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </Card>
  );
}
