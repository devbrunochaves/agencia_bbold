import type { Metadata } from "next";
import PresencaDigitalClient from "./PresencaDigitalClient";

export const metadata: Metadata = {
  title: "Posicionamento de Marca | Bruno Chaves",
  description:
    "Você tem um negócio incrível, mas quase ninguém sabe disso. Descubra como o posicionamento digital certo transforma seguidores em clientes — e clientes em fãs.",
  openGraph: {
    title: "Posicionamento de Marca | Bruno Chaves",
    description:
      "Você tem um negócio incrível, mas quase ninguém sabe disso. Descubra como o posicionamento digital certo transforma seguidores em clientes — e clientes em fãs.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Posicionamento de Marca | Bruno Chaves",
    description:
      "Presença digital estratégica para empresas que querem crescer de verdade.",
  },
};

export default function PresencaDigitalPage() {
  return <PresencaDigitalClient />;
}
