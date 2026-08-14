/**
 * Single source of truth for "which permission gates which module/route".
 * Sidebar, middleware-adjacent page guards, and the default-route resolver
 * all read from this instead of repeating `if (role === ...)` logic.
 */
export interface ModuleAccessEntry {
  key: string;
  label: string;
  href: string;
  viewPermission: string;
}

export const MODULE_ACCESS_MAP: ModuleAccessEntry[] = [
  { key: "dashboard", label: "Dashboard", href: "/flow", viewPermission: "dashboard.view" },
  { key: "demandas", label: "Demandas", href: "/flow/demandas", viewPermission: "tasks.view" },
  { key: "clientes", label: "Clientes", href: "/flow/clientes", viewPermission: "clients.view" },
  { key: "contratos", label: "Contratos", href: "/flow/contratos", viewPermission: "contracts.view" },
  { key: "financeiro", label: "Financeiro", href: "/flow/financeiro", viewPermission: "finance.view" },
  { key: "acessos", label: "Acessos", href: "/flow/acessos", viewPermission: "members.view" },
  { key: "configuracoes", label: "Configurações", href: "/flow/configuracoes", viewPermission: "settings.view" },
];

/**
 * §66 — after login, send the user to the first module they can actually
 * see, in this priority order, instead of a hardcoded /flow that might 403.
 */
export function getDefaultRoute(permissions: Set<string>): string {
  const firstAccessible = MODULE_ACCESS_MAP.find((entry) => permissions.has(entry.viewPermission));
  return firstAccessible?.href ?? "/flow/sem-acesso";
}

/** §34 — grouped presentation of the permission catalogue for the Acessos UI. */
export interface PermissionGroup {
  label: string;
  permissions: { key: string; label: string }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "Geral",
    permissions: [{ key: "dashboard.view", label: "Dashboard" }],
  },
  {
    label: "Operação",
    permissions: [
      { key: "tasks.view", label: "Demandas — visualizar" },
      { key: "tasks.manage", label: "Demandas — gerenciar" },
      { key: "clients.view", label: "Clientes — visualizar" },
      { key: "clients.manage", label: "Clientes — gerenciar" },
    ],
  },
  {
    label: "Gestão",
    permissions: [
      { key: "contracts.view", label: "Contratos — visualizar" },
      { key: "contracts.manage", label: "Contratos — gerenciar" },
      { key: "finance.view", label: "Financeiro — visualizar" },
      { key: "finance.manage", label: "Financeiro — gerenciar" },
    ],
  },
  {
    label: "Administração",
    permissions: [
      { key: "members.view", label: "Acessos — visualizar" },
      { key: "members.manage", label: "Acessos — gerenciar" },
      { key: "settings.view", label: "Configurações — visualizar" },
      { key: "settings.manage", label: "Configurações — gerenciar" },
      { key: "organization.manage", label: "Organização — editar" },
    ],
  },
];
