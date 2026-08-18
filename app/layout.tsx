import type { Metadata } from "next";
import { Bebas_Neue, Barlow, Inter } from "next/font/google";
import "./globals.css";
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

const inter = Inter({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BBOLD — Posicionamento Digital Empresarial",
  description:
    "Ajudamos empresas a transmitir autoridade, profissionalismo e confiança em todos os pontos da presença digital — identidade visual, sites, redes sociais e estratégia.",
  openGraph: {
    title: "BBOLD — Posicionamento Digital Empresarial",
    description: "Sua empresa precisa parecer do tamanho que ela é.",
    url: "https://agenciabbold.com.br",
    siteName: "BBOLD",
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
    <html lang="pt-BR" className={`${bebasNeue.variable} ${barlow.variable} ${inter.variable}`}>
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
      <body className="font-body bg-cream text-black">
        {children}
      </body>
    </html>
  );
}
