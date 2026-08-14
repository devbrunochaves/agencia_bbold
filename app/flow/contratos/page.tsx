import type { Metadata } from "next";
import ContratosView from "./ContratosView";

export const metadata: Metadata = {
  title: "Contratos — BBOLD Flow",
  robots: { index: false, follow: false },
};

export default function ContratosPage() {
  return <ContratosView />;
}
