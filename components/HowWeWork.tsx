import Link from "next/link";

const steps = [
  { num: "1", title: "Diagnóstico do negócio", desc: "Entendemos sua empresa, mercado, público-alvo e objetivos antes de qualquer ação." },
  { num: "2", title: "Estratégia personalizada", desc: "Definimos um plano com os canais, formatos e abordagem certos para o seu segmento." },
  { num: "3", title: "Execução com qualidade", desc: "Produção de conteúdo, gestão de campanhas e entregas com padrão profissional." },
  { num: "4", title: "Análise e evolução", desc: "Relatórios claros, métricas reais e otimização contínua para resultados consistentes." },
];

export default function HowWeWork() {
  return (
    <section
      id="como-ajudamos"
      className="bg-[#f0e8d8] border-y border-black/[0.04] py-24 px-10"
    >
      <div className="max-w-site mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="reveal">
          <span className="section-tag">Como trabalhamos</span>
          <h2 className="section-title mt-2">
            Como a BBold<br /><em>estrutura</em><br />seu projeto
          </h2>
          <p className="text-black/60 leading-relaxed mb-4">
            Muitas empresas têm um ótimo produto, mas perdem clientes para
            concorrentes com presença digital mais sólida. A BBold existe para mudar isso.
          </p>
          <p className="text-black/55 leading-relaxed mb-9">
            Unimos design estratégico, desenvolvimento e performance para
            construir uma presença digital que gera resultado real — não apenas
            engajamento, mas autoridade e crescimento sustentável.
          </p>
          <Link
            href="/#contato"
            className="inline-flex items-center gap-2 bg-yellow text-black font-bold text-sm tracking-widest uppercase px-8 py-3.5 rounded-sm hover:bg-yellow-dark transition-all hover:-translate-y-0.5"
          >
            Solicitar diagnóstico
          </Link>
        </div>

        <div className="reveal flex flex-col gap-6">
          {steps.map((s) => (
            <div
              key={s.num}
              className="flex gap-6 items-start p-6 border border-black/[0.07] rounded-sm transition-all duration-300 hover:border-yellow/25 hover:bg-yellow/[0.03]"
            >
              <span className="font-display text-[2rem] text-yellow leading-none flex-shrink-0 w-10">
                {s.num}
              </span>
              <div>
                <h4 className="font-bold text-black mb-1">{s.title}</h4>
                <p className="text-sm text-black/50 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
