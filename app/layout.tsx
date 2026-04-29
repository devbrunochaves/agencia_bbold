import type { Metadata } from "next";
import { Bebas_Neue, Barlow } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const barlow = Barlow({
  weight: ["400", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "Agência BBold — Marketing Digital que Impacta",
  description:
    "Design estratégico, tráfego pago e gestão de redes sociais para empresas que querem crescer de verdade.",
  openGraph: {
    title: "Agência BBold",
    description: "Sua marca merece ser vista.",
    url: "https://agenciabbold.com.br",
    siteName: "Agência BBold",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${bebasNeue.variable} ${barlow.variable}`}>
      <body className="font-body bg-black text-offwhite">
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
