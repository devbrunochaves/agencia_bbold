import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ListChecks,
  Wallet,
  FileSignature,
  Users,
  KeyRound,
  Settings,
} from "lucide-react";

export interface FlowNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Permission required to see this item. `null` = always visible once inside /flow. */
  permission: string | null;
  /** Route not implemented yet — shown greyed out with an "Em breve" badge. */
  comingSoon?: boolean;
}

export const flowNavItems: FlowNavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/flow", icon: LayoutDashboard, permission: "dashboard.view" },
  { key: "demandas", label: "Demandas", href: "/flow/demandas", icon: ListChecks, permission: "tasks.view", comingSoon: true },
  { key: "financeiro", label: "Financeiro", href: "/flow/financeiro", icon: Wallet, permission: "finance.view", comingSoon: true },
  { key: "contratos", label: "Contratos", href: "/flow/contratos", icon: FileSignature, permission: "contracts.view", comingSoon: true },
  { key: "clientes", label: "Clientes", href: "/flow/clientes", icon: Users, permission: "clients.view", comingSoon: true },
  { key: "acessos", label: "Acessos", href: "/flow/acessos", icon: KeyRound, permission: "members.manage", comingSoon: true },
  { key: "configuracoes", label: "Configurações", href: "/flow/configuracoes", icon: Settings, permission: null, comingSoon: true },
];
