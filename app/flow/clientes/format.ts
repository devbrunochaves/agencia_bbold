import type { Client } from "@/modules/clients";

export function formatDocument(client: Pick<Client, "documentType" | "documentNumber">): string {
  const digits = client.documentNumber;
  if (!digits) return "—";

  if (client.documentType === "cpf" && digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (client.documentType === "cnpj" && digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return digits;
}

export function formatStartDate(startDate: string | null): string {
  if (!startDate) return "—";
  const date = new Date(`${startDate}T00:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .format(date)
    .replace(".", "");
}
