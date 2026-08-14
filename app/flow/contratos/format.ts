export function formatDateBR(date: string | null): string {
  if (!date) return "—";
  return date.split("-").reverse().join("/");
}
