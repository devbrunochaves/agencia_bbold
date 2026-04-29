import Link from "next/link";

const steps = [
  { num: "1", title: "Diagnóstico do negócio", desc: "Entendemos sua empresa, público-alvo e objetivos antes de qualquer ação." },
  { num: "2", title: "Estratégia personalizada", desc: "Montamos um plano com os canais e formatos certos para o seu mercado." },
  { num: "3", title: "Execução com qualidade", desc: "Produção de conteúdo, gestão de campanhas e entregas dentro do prazo." },
  { num: "4", title: "Análise e evolução", desc: "Relatórios mensais claros e otimização contínua para resultados cada vez melhores." },
];

export default function HowWeWork() {
  return (
    <section
      id="como-ajudamos"
      className="bg-black-mid border-y border-offwhite/[0.04] py-24 px-10"
    >
      <div className="max-w-site mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="reveal">
          <span className="section-tag">Nossa abordagem</span>
          <h2 className="section-title mt-2">
            Como a BBold<br /><em>pode ajudar</em><br />sua empresa
          </h2>
          <p className="text-offwhite/60 leading-relaxed mb-4">
            Muitas empresas têm um ótimo produto, mas perdem clientes para
            concorrentes com marketing mais forte. A BBold existe para mudar isso.
          </p>
          <p className="text-offwhite/60 leading-relaxed mb-8">
            Combinamos design de alto impacto com estratégia de performance para
            construir uma presença digital que gera resultado mensurável — não só likes.
          </p>
          <Link
            href="/#contato"
            className="inline-flex items-center gap-2 bg-yellow text-black font-bold text-sm tracking-widest uppercase px-8 py-3.5 rounded-sm hover:bg-yellow-dark transition-all hover:-translate-y-0.5"
          >
            Começar agora
          </Link>
        </div>

        <div className="reveal flex flex-col gap-6">
          {steps.map((s) => (
            <div
              key={s.num}
              className="flex gap-6 items-start p-6 border border-offwhite/[0.07] rounded-sm transition-all duration-300 hover:border-yellow/25 hover:bg-yellow/[0.03]"
            >
              <span className="font-display text-[2rem] text-yellow leading-none flex-shrink-0 w-10">
                {s.num}
              </span>
              <div>
                <h4 className="font-bold text-offwhite mb-1">{s.title}</h4>
                <p className="text-sm text-offwhite/50 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
