import type { Metadata } from "next";
import AcessosView from "./AcessosView";

export const metadata: Metadata = {
  title: "Acessos — BBOLD Flow",
  robots: { index: false, follow: false },
};

export default function AcessosPage() {
  return <AcessosView />;
}
