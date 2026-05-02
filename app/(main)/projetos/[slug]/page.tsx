import { projetos, getProjetoBySlug } from "@/data/projetos";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() {
  return projetos.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const projeto = getProjetoBySlug(slug);
  if (!projeto) return { title: "Projeto não encontrado" };
  return {
    title: `${projeto.titulo} — Projetos BBold`,
    description: projeto.descricaoCurta,
  };
}

export default async function ProjetoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const projeto = getProjetoBySlug(slug);
  if (!projeto) notFound();

  return (
    <main className="pt-28 pb-24 px-10">
      <div className="max-w-[800px] mx-auto">
        <Link href="/projetos" className="inline-flex items-center gap-2 text-sm text-offwhite/40 hover:text-yellow transition-colors mb-10">
          ← Voltar para projetos
        </Link>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-[0.7rem] font-bold tracking-widest uppercase bg-yellow text-black px-2.5 py-1 rounded-sm">{projeto.nicho}</span>
          <span className="text-sm text-offwhite/35">{projeto.cliente}</span>
          <span className="text-sm text-offwhite/35">{projeto.ano}</span>
        </div>
        <h1 className="font-display text-[clamp(2.4rem,6vw,4rem)] leading-[1.0] tracking-wide text-offwhite mb-6">{projeto.titulo}</h1>
        <p className="text-lg text-offwhite/55 leading-relaxed mb-10 border-l-4 border-yellow pl-5">{projeto.descricaoCurta}</p>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black-light mb-10 flex items-center justify-center border border-offwhite/5">
          <div className="text-center">
            <div className="font-display text-[6rem] leading-none text-yellow/10">{projeto.titulo.charAt(0)}</div>
            <p className="text-offwhite/20 text-xs mt-2 tracking-widest uppercase">Imagens do projeto em breve</p>
          </div>
        </div>
        {projeto.resultados.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-12">
            {projeto.resultados.map((r) => (
              <div key={r.label} className="bg-black-light rounded-lg p-5 border border-offwhite/5 text-center">
                <p className="font-display text-[2rem] text-yellow leading-none mb-1">{r.valor}</p>
                <p className="text-xs text-offwhite/40 leading-tight">{r.label}</p>
              </div>
            ))}
          </div>
        )}
        <div className="mb-12">
          <h2 className="font-display text-[1.8rem] tracking-wide text-offwhite mb-4">O Projeto</h2>
          <p className="text-offwhite/65 leading-relaxed text-[1.05rem]">{projeto.descricaoCompleta}</p>
        </div>
        <div className="mb-12">
          <h2 className="font-display text-[1.8rem] tracking-wide text-offwhite mb-4">Serviços Aplicados</h2>
          <div className="flex flex-wrap gap-2">
            {projeto.servicos.map((s) => (
              <span key={s} className="text-sm font-bold tracking-widest uppercase bg-black-light text-offwhite/60 border border-offwhite/10 px-4 py-2 rounded-sm">{s}</span>
            ))}
          </div>
        </div>
        <div className="mt-14 p-8 bg-yellow rounded-lg text-center">
          <h3 className="font-display text-[1.8rem] text-black tracking-wide mb-2">Quer um resultado assim?</h3>
          <p className="text-black/65 mb-6">Fale com a BBold e receba uma proposta personalizada para o seu negócio.</p>
          <Link href="/#contato" className="inline-flex items-center gap-2 bg-black text-yellow font-bold text-sm tracking-widest uppercase px-8 py-3.5 rounded-sm hover:bg-black-mid transition-all">
            Quero uma proposta →
          </Link>
        </div>
      </div>
    </main>
  );
}
