# Mock data — BBOLD Flow

Este diretório existiu entre as fases 2 e 8 para dar fidelidade visual às
telas antes de existirem repositories reais (`modules/*/infrastructure`).

Substituído módulo a módulo conforme cada fase entregou dados reais:
- `clients.ts` → real desde a fase 3 (`/flow/clientes`); removido na fase 8 (Dashboard passou a usar `modules/dashboard`/`modules/clients` reais)
- `tasks.ts` → real desde a fase 4 (`/flow/demandas`); removido na fase 8 (Dashboard passou a usar `modules/dashboard`/`modules/tasks` reais)
- `financial.ts` → removido na fase 5
- `contracts.ts` → removido na fase 6
- `members.ts` → removido na fase 7

Nenhum arquivo de mock resta em `data/flow-demo/` — nenhuma rota do Flow
depende mais de dado ilustrativo. Este README é mantido como registro
histórico da migração.
