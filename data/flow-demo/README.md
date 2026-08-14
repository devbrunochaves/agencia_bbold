# Mock data — BBOLD Flow (fase 2, apenas visual)

Tudo neste diretório é dado de UI temporário, usado apenas para dar
fidelidade visual às telas antes de existirem repositories reais
(`modules/*/infrastructure`). Nenhuma página deve importar arrays soltos —
sempre through daqui, e sempre com um comentário/label deixando claro que é
mock.

Será substituído módulo a módulo:
- `clients.ts` → fase 3 (Clientes)
- `tasks.ts` → fase 4 (Demandas)
- `financial.ts` → fase 5 (Financeiro)
- `contracts.ts` → fase 6 (Contratos)
- `members.ts` → fase 7 (Acessos)
