import type { Metadata } from "next";
import { Bebas_Neue, Barlow } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Script from "next/script";

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
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QXQ4ZWWBSG"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QXQ4ZWWBSG');
          `}
        </Script>
      </head>
      <body className="font-body bg-black text-offwhite">
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
