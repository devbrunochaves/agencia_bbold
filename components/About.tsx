import Image from "next/image";

const skills = [
  "Adobe CC", "Figma / UI·UX", "ReactJS", "Meta Ads",
  "Google Ads", "WordPress", "CorelDRAW", "Tailwind CSS",
];

export default function About() {
  return (
    <section id="quem-somos" className="py-24 px-10 max-w-site mx-auto relative overflow-hidden">
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[clamp(10rem,25vw,22rem)] text-yellow/[0.03] pointer-events-none whitespace-nowrap select-none">
        BBOLD
      </span>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-20 items-center">
        <div className="reveal relative">
          <div className="aspect-[4/5] bg-[#ede6d6] border border-black/[0.08] rounded-lg overflow-hidden flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 p-10 text-center">
              <Image
                src="/img/icone ID. VISUAL.svg"
                alt="Bruno Chaves"
                width={120}
                height={120}
                className="w-28 opacity-80 drop-shadow-[0_0_30px_rgba(245,197,24,0.4)]"
              />
              <span className="font-display text-[1.8rem] tracking-widest text-black/40">
                Bruno Chaves
              </span>
            </div>
          </div>
          <div className="absolute -bottom-5 -right-5 w-24 h-24 bg-yellow rounded-full flex flex-col items-center justify-center text-center shadow-[0_8px_24px_rgba(245,197,24,0.35)]">
            <span className="font-display text-[2.2rem] text-black leading-none">15</span>
            <span className="text-[0.55rem] font-bold uppercase tracking-wide text-black/80 leading-tight">
              anos de<br />mercado
            </span>
          </div>
        </div>

        <div className="reveal">
          <span className="section-tag">Quem está por trás</span>
          <h2 className="section-title mt-2">
            Experiência real.<br /><em>Resultado</em> concreto.
          </h2>
          <p className="text-black/75 leading-relaxed mb-4">
            Sou <strong className="text-yellow">Bruno Chaves</strong>, designer gráfico com mais de 15 anos de mercado.
            Durante esse tempo, atuei em agências, clubes de futebol, empresas de distribuição e projetos
            digitais — sempre com foco em criar comunicação visual que funciona.
          </p>
          <p className="text-black/55 leading-relaxed mb-4">
            Nos últimos anos expandi minha atuação para o desenvolvimento front-end, dominando ReactJS,
            Tailwind e tecnologias modernas da web. Hoje, essa combinação — design estratégico + código
            de qualidade — é o que diferencia a BBold.
          </p>
          <p className="text-black/55 leading-relaxed mb-8">
            A agência também conta com <strong className="text-black">gestão administrativa organizada e rigorosa</strong>,
            garantindo processos claros, contratos profissionais e entregas dentro do prazo.
          </p>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="text-[0.75rem] font-bold tracking-wide uppercase text-yellow border border-yellow/30 px-3 py-1.5 rounded-sm hover:bg-yellow hover:text-black transition-all cursor-default"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
