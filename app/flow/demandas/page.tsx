import type { Metadata } from "next";
import DemandasView from "./DemandasView";

export const metadata: Metadata = {
  title: "Demandas — BBOLD Flow",
  robots: { index: false, follow: false },
};

export default function DemandasPage() {
  return <DemandasView />;
}
