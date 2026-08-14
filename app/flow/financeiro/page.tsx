import type { Metadata } from "next";
import FinanceiroView from "./FinanceiroView";

export const metadata: Metadata = {
  title: "Financeiro — BBOLD Flow",
  robots: { index: false, follow: false },
};

export default function FinanceiroPage() {
  return <FinanceiroView />;
}
