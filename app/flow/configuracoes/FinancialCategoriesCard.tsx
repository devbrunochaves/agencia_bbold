"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tags } from "lucide-react";
import Card from "@/components/flow/Card";
import { Badge, Button, Input, Select } from "@/components/flow/ui";
import type { FinancialCategory, FinancialEntryType } from "@/modules/finance/domain/types";
import { createCategoryAction, updateCategoryAction } from "@/app/flow/financeiro/actions";

export default function FinancialCategoriesCard({ categories }: { categories: FinancialCategory[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<FinancialEntryType>("income");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setMessage(null);
    const result = await createCategoryAction({ name: name.trim(), type });
    setLoading(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setName("");
    router.refresh();
  }

  async function handleToggleActive(category: FinancialCategory) {
    await updateCategoryAction({ id: category.id, active: !category.active });
    router.refresh();
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-flow-panel-alt text-flow-yellow">
          <Tags size={18} strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-semibold text-flow-text-primary">Categorias financeiras</p>
          <p className="text-xs text-flow-text-muted">Usadas em Entradas e Saídas do Financeiro.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-flow-text-muted">Entradas</p>
          <div className="flex flex-col gap-1.5">
            {income.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleToggleActive(category)}
                className="flex items-center justify-between rounded-md px-2 py-1 text-left text-sm hover:bg-flow-panel-alt"
              >
                <span className={category.active ? "text-flow-text-primary" : "text-flow-text-muted line-through"}>
                  {category.name}
                </span>
                <Badge tone={category.active ? "success" : "neutral"}>{category.active ? "Ativa" : "Inativa"}</Badge>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-flow-text-muted">Saídas</p>
          <div className="flex flex-col gap-1.5">
            {expense.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleToggleActive(category)}
                className="flex items-center justify-between rounded-md px-2 py-1 text-left text-sm hover:bg-flow-panel-alt"
              >
                <span className={category.active ? "text-flow-text-primary" : "text-flow-text-muted line-through"}>
                  {category.name}
                </span>
                <Badge tone={category.active ? "success" : "neutral"}>{category.active ? "Ativa" : "Inativa"}</Badge>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-end gap-2 border-t border-flow-border pt-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-flow-text-muted">Nova categoria</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value as FinancialEntryType)} className="w-32">
          <option value="income">Entrada</option>
          <option value="expense">Saída</option>
        </Select>
        <Button size="sm" onClick={handleCreate} disabled={loading}>
          Adicionar
        </Button>
      </div>

      {message && <p className="text-xs text-flow-danger">{message}</p>}
    </Card>
  );
}
