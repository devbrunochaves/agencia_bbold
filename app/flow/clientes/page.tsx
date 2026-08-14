import type { Metadata } from "next";
import ClientesView from "./ClientesView";

export const metadata: Metadata = {
  title: "Clientes — BBOLD Flow",
  robots: { index: false, follow: false },
};

export default function ClientesPage() {
  return <ClientesView />;
}
