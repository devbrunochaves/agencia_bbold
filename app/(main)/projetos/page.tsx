import { projetos } from "@/data/projetos";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projetos — Agência BBold",
  description:
    "Conheça os projetos desenvolvidos pela BBold: identidade visual, sites, tráfego pago e gestão de redes sociais para negócios reais.",
};

const categoryColors: Record<string, string> = {
  "Advocacia": "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  "Saúde & Nutrição": "bg-green-900/40 text-green-300 border border-green-700/40",
  "Barbearia": "bg-purple-900/40 text-purple-300 border border-purple-700/40",
  "Moda & Varejo": "bg-pink-900/40 text-pink-300 border border-pink-700/40",
  "Estética & Beleza": "bg-rose-900/40 text-rose-300 border border-rose-700/40",
  "Gastronomia": "bg-orange-900/40 text-orange-300 border border-orange-700/40",
};

export default function ProjetosPage() {
  return (
    <main className="pt-28 pb-24 px-10">
      <div className="max-w-site mx-auto">
        <div className="mb-16">
          <span className="text-[0.7rem] font-bold tracking-widest uppercase text-yellow border border-yellow/30 px-3 py-1 rounded-sm">
            Portfólio BBold
          </span>
          <h1 className="font-display text-[clamp(3rem,8vw,6rem)] leading-[0.95] tracking-wide text-offwhite mt-6 mb-4">
            PROJETOS QUE<br /><span className="text-yellow">GERAM</span> RESULTADO
          </h1>
          <p className="text-lg text-offwhite/55 max-w-2xl leading-relaxed">
            Identidade visual, sites, tráfego pago e gestão de redes sociais para negócios que querem crescer de verdade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projetos.map((projeto) => (
            <Link
              key={projeto.slug}
              href={`/projetos/${projeto.slug}`}
              className="group bg-black-light rounded-lg overflow-hidden border border-offwhite/5 hover:border-yellow/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
            >
              <div className="relative aspect-[4/3] bg-black-mid overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="font-display text-[4rem] leading-none text-yellow/10 group-hover:text-yellow/20 transition-colors">
                    {projeto.titulo.charAt(0)}
                  </div>
                </div>
                <div className="absolute top-4 left-4">
                  <span className={`text-[0.65rem] font-bold tracking-widest uppercase px-2.5 py-1 rounded-sm ${categoryColors[projeto.nicho] || "bg-yellow/10 text-yellow border border-yellow/20"}`}>
                    {projeto.nicho}
                  </span>
                </div>
                {projeto.destaque && (
                  <div className="absolute top-4 right-4">
                    <span className="text-[0.6rem] font-bold tracking-widest uppercase bg-yellow text-black px-2 py-0.5 rounded-sm">Destaque</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <p className="text-xs text-offwhite/30 tracking-widest uppercase mb-1">{projeto.cliente} · {projeto.ano}</p>
                <h2 className="font-display text-[1.4rem] tracking-wide text-offwhite mb-2 group-hover:text-yellow transition-colors">{projeto.titulo}</h2>
                <p className="text-sm text-offwhite/50 leading-relaxed mb-4">{projeto.descricaoCurta}</p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {projeto.servicos.slice(0, 3).map((s) => (
                    <span key={s} className="text-[0.6rem] font-bold tracking-widest uppercase bg-black text-offwhite/40 border border-offwhite/10 px-2 py-0.5 rounded-sm">{s}</span>
                  ))}
                </div>
                {projeto.resultados.length > 0 && (
                  <div className="flex gap-4 pt-4 border-t border-offwhite/5">
                    {projeto.resultados.slice(0, 2).map((r) => (
                      <div key={r.label}>
                        <p className="font-display text-lg text-yellow">{r.valor}</p>
                        <p className="text-[0.65rem] text-offwhite/35 leading-tight">{r.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-20 p-10 bg-yellow rounded-lg text-center">
          <h2 className="font-display text-[2.2rem] text-black tracking-wide mb-2">Quer ser o próximo caso de sucesso?</h2>
          <p className="text-black/60 mb-6 max-w-lg mx-auto">Fale com a gente e descubra como podemos transformar a presença digital do seu negócio.</p>
          <Link href="/#contato" className="inline-flex items-center gap-2 bg-black text-yellow font-bold text-sm tracking-widest uppercase px-8 py-3.5 rounded-sm hover:bg-black-mid transition-all">
            Quero uma proposta →
          </Link>
        </div>
      </div>
    </main>
  );
}
