// MOCK — dado de UI temporário. Ver README.md deste diretório.

export interface DemoFinancialEntry {
  id: string;
  name: string;
  category: string;
  day: string;
  dueDate: string;
  amount: number;
  status: "planned" | "pending" | "paid" | "overdue" | "cancelled";
  invoiceRequired?: boolean;
  invoiceIssued?: boolean;
}

export interface DemoFinancialGroup {
  key: string;
  label: string;
  entries: DemoFinancialEntry[];
}

export const demoIncomeGroups: DemoFinancialGroup[] = [
  {
    key: "clientes-fixos",
    label: "Clientes fixos",
    entries: [
      { id: "i1", name: "Padaria Diplomata", category: "Clientes fixos", day: "05", dueDate: "05/08", amount: 1800, status: "paid", invoiceRequired: true, invoiceIssued: false },
      { id: "i2", name: "CSS Log", category: "Clientes fixos", day: "10", dueDate: "10/08", amount: 2400, status: "pending", invoiceRequired: true, invoiceIssued: false },
      { id: "i3", name: "Clínica Nutrição Vida", category: "Clientes fixos", day: "15", dueDate: "15/08", amount: 1200, status: "paid", invoiceRequired: true, invoiceIssued: true },
    ],
  },
  {
    key: "landing-sites",
    label: "Landing Page e Sites",
    entries: [
      { id: "i4", name: "Bianca Calil Nutri", category: "Landing Page e Sites", day: "20", dueDate: "20/08", amount: 3200, status: "pending", invoiceRequired: true, invoiceIssued: false },
    ],
  },
  {
    key: "parcelados",
    label: "Pagamentos parcelados",
    entries: [
      { id: "i5", name: "Monte Sião — parcela 2/3", category: "Pagamentos parcelados", day: "08", dueDate: "08/08", amount: 900, status: "overdue", invoiceRequired: false },
    ],
  },
  {
    key: "infoprodutos",
    label: "Infoprodutos",
    entries: [],
  },
];

export const demoExpenseGroups: DemoFinancialGroup[] = [
  {
    key: "saidas-fixas",
    label: "Saídas fixas",
    entries: [
      { id: "e1", name: "Ferramentas de design e gestão", category: "Ferramentas", day: "03", dueDate: "03/08", amount: 480, status: "paid" },
      { id: "e2", name: "Contabilidade", category: "Impostos", day: "10", dueDate: "10/08", amount: 350, status: "pending" },
    ],
  },
  {
    key: "colaboradores",
    label: "Colaboradores",
    entries: [
      { id: "e3", name: "Aline — designer", category: "Colaboradores", day: "05", dueDate: "05/08", amount: 2200, status: "paid" },
      { id: "e4", name: "Bruno — dev", category: "Colaboradores", day: "05", dueDate: "05/08", amount: 2600, status: "paid" },
    ],
  },
  {
    key: "variaveis",
    label: "Saídas variáveis",
    entries: [
      { id: "e5", name: "Tráfego pago — clientes", category: "Variáveis", day: "18", dueDate: "18/08", amount: 620, status: "pending" },
    ],
  },
];

export const demoInvoiceSummary = {
  toIssue: 16,
  issued: 0,
  pending: 16,
};
