import type { Metadata } from "next";
import ConfiguracoesView from "./ConfiguracoesView";

export const metadata: Metadata = {
  title: "Configurações — BBOLD Flow",
  robots: { index: false, follow: false },
};

export default function ConfiguracoesPage() {
  return <ConfiguracoesView />;
}
