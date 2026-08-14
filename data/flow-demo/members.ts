// MOCK — dado de UI temporário. Ver README.md deste diretório.

export interface DemoMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
  status: "active" | "invited" | "disabled";
  permissions: string[];
}

export const demoMembers: DemoMember[] = [
  {
    id: "1",
    name: "Gabriel Juste",
    email: "gabriel@agenciabbold.com.br",
    role: "Owner",
    status: "active",
    permissions: ["Dashboard", "Demandas", "Financeiro", "Contratos", "Clientes"],
  },
  {
    id: "2",
    name: "Usuário demo",
    email: "demo@agenciabbold.com.br",
    role: "Member",
    status: "active",
    permissions: ["Dashboard", "Demandas"],
  },
];
