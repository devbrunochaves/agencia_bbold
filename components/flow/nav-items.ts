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
import { MODULE_ACCESS_MAP } from "@/modules/identity/domain/access";

export interface FlowNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Permission required to see this item — sourced from MODULE_ACCESS_MAP, the single source of truth also used server-side for route guards and the default-route resolver. */
  permission: string;
}

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  demandas: ListChecks,
  financeiro: Wallet,
  contratos: FileSignature,
  clientes: Users,
  acessos: KeyRound,
  configuracoes: Settings,
};

export const flowNavItems: FlowNavItem[] = MODULE_ACCESS_MAP.map((entry) => ({
  key: entry.key,
  label: entry.label,
  href: entry.href,
  icon: ICONS[entry.key] ?? Settings,
  permission: entry.viewPermission,
}));
