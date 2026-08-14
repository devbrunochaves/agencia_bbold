// MOCK — dado de UI temporário. Ver README.md deste diretório.

export interface DemoClient {
  id: string;
  name: string;
  startDate: string;
  team: string[];
  services: string[];
  openDeliveries: number;
  status: "prospect" | "active" | "paused" | "closed";
  document: string;
}

export const demoClients: DemoClient[] = [
  {
    id: "1",
    name: "Padaria Diplomata",
    startDate: "12 Jan 2026",
    team: ["Gabriel", "Aline"],
    services: ["Social Media", "Tráfego Pago"],
    openDeliveries: 4,
    status: "active",
    document: "12.345.678/0001-90",
  },
  {
    id: "2",
    name: "CSS Log",
    startDate: "03 Mar 2026",
    team: ["Bruno"],
    services: ["Website"],
    openDeliveries: 1,
    status: "active",
    document: "98.765.432/0001-10",
  },
  {
    id: "3",
    name: "Monte Sião",
    startDate: "20 Jun 2026",
    team: ["Aline"],
    services: ["Identidade Visual"],
    openDeliveries: 0,
    status: "paused",
    document: "11.222.333/0001-44",
  },
  {
    id: "4",
    name: "Bianca Calil Nutri",
    startDate: "—",
    team: [],
    services: ["Landing Page"],
    openDeliveries: 0,
    status: "prospect",
    document: "—",
  },
  {
    id: "5",
    name: "Clínica Nutrição Vida",
    startDate: "05 Set 2025",
    team: ["Gabriel"],
    services: ["Social Media"],
    openDeliveries: 2,
    status: "closed",
    document: "55.666.777/0001-88",
  },
];
