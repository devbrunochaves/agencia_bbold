# Mock data — BBOLD Flow (fase 2, apenas visual)

Tudo neste diretório é dado de UI temporário, usado apenas para dar
fidelidade visual às telas antes de existirem repositories reais
(`modules/*/infrastructure`). Nenhuma página deve importar arrays soltos —
sempre through daqui, e sempre com um comentário/label deixando claro que é
mock.

Substituído módulo a módulo conforme cada fase entrega dados reais:
- `clients.ts` → real desde a fase 3 (`/flow/clientes`), mas ainda usado pelo Dashboard (`/flow`) e pelo Kanban de Demandas até a fase 8
- `tasks.ts` → real desde a fase 4 (`/flow/demandas`), mas ainda usado pelo Dashboard até a fase 8
- `financial.ts` → removido na fase 5: nada mais o importa (`/flow/financeiro` e `/flow` usam `modules/finance` real)
- `contracts.ts` → removido na fase 6: nada mais o importa (`/flow/contratos` usa `modules/contracts` real)
- `members.ts` → fase 7 (Acessos)
