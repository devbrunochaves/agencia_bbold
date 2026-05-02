"use client";

import Link from "next/link";
import { getProjetosDestaque } from "@/data/projetos";

const categoryColors: Record<string, string> = {
  "Advocacia": "text-blue-300",
  "Saúde & Nutrição": "text-green-300",
  "Barbearia": "text-purple-300",
  "Moda & Varejo": "text-pink-300",
  "Estética & Beleza": "text-rose-300",
  "Gastronomia": "text-orange-300",
};

export default function ProjectsPreview() {
  const destaques = getProjetosDestaque();

  return (
    <section className="py-24 px-10" id="projetos">
      <div className="max-w-site mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <span className="text-[0.7rem] font-bold tracking-widest uppercase text-yellow border border-yellow/30 px-3 py-1 rounded-sm">
              Portfólio
            </span>
            <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-wide text-offwhite mt-4">
              PROJETOS QUE<br />
              <span className="text-yellow">FALAM</span> POR NÓS
            </h2>
          </div>
          <Link
            href="/projetos"
            className="shrink-0 inline-flex items-center gap-2 border-2 border-offwhite/20 text-offwhite font-bold text-sm tracking-widest uppercase px-6 py-3 rounded-sm hover:border-yellow hover:text-yellow transition-all"
          >
            Ver todos os projetos →
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {destaques.map((projeto, i) => (
            <Link
              key={projeto.slug}
              href={`/projetos/${projeto.slug}`}
              className="group bg-black-light rounded-lg overflow-hidden border border-offwhite/5 hover:border-yellow/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
            >
              {/* Cover */}
              <div className="relative aspect-[4/3] bg-black-mid overflow-hidden flex items-center justify-center">
                <div className="font-display text-[5rem] leading-none text-yellow/10 group-hover:text-yellow/20 transition-colors select-none">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="absolute top-4 left-4">
                  <span className={`text-[0.65rem] font-bold tracking-widest uppercase ${categoryColors[projeto.nicho] || "text-yellow"}`}>
                    {projeto.nicho}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-xs text-offwhite/25 tracking-widest uppercase mb-1">
                  {projeto.cliente} · {projeto.ano}
                </p>
                <h3 className="font-display text-[1.35rem] tracking-wide text-offwhite mb-2 group-hover:text-yellow transition-colors">
                  {projeto.titulo}
                </h3>
                <p className="text-sm text-offwhite/45 leading-relaxed mb-4 line-clamp-2">
                  {projeto.descricaoCurta}
                </p>

                {/* Resultado principal */}
                {projeto.resultados[0] && (
                  <div className="pt-4 border-t border-offwhite/5 flex items-baseline gap-2">
                    <span className="font-display text-[1.6rem] text-yellow leading-none">
                      {projeto.resultados[0].valor}
                    </span>
                    <span className="text-xs text-offwhite/35">
                      {projeto.resultados[0].label}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/projetos"
            className="inline-flex items-center gap-2 bg-yellow text-black font-bold text-sm tracking-widest uppercase px-10 py-4 rounded-sm hover:bg-yellow-dark transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(245,197,24,0.3)]"
          >
            Ver todos os projetos →
          </Link>
        </div>

      </div>
    </section>
  );
}
