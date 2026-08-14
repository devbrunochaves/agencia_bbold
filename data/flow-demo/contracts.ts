// MOCK — dado de UI temporário. Ver README.md deste diretório.

export interface DemoContract {
  id: string;
  clientName: string;
  service: string;
  value: number;
  status: "draft" | "sent" | "signed" | "cancelled" | "expired";
  createdAt: string;
}

export const demoContracts: DemoContract[] = [
  { id: "1", clientName: "Padaria Diplomata", service: "Social Media", value: 1800, status: "signed", createdAt: "12 Jan 2026" },
  { id: "2", clientName: "CSS Log", service: "Website", value: 8500, status: "sent", createdAt: "01 Ago 2026" },
  { id: "3", clientName: "Bianca Calil Nutri", service: "Landing Page", value: 3200, status: "draft", createdAt: "08 Ago 2026" },
];
