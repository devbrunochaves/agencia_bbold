import Image from "next/image";

export default function About() {
  return (
    <section id="quem-somos" className="py-24 px-10 max-w-site mx-auto relative overflow-hidden">
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[clamp(10rem,25vw,22rem)] text-yellow/[0.03] pointer-events-none whitespace-nowrap select-none">
        BBOLD
      </span>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-20 items-center">
        <div className="reveal relative">
          <div className="aspect-[4/5] bg-[#ede6d6] border border-black/[0.08] rounded-lg overflow-hidden">
            <Image
              src="/img/foto-site.jpg"
              alt="Bruno Chaves"
              width={800}
              height={1000}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -right-5 w-24 h-24 bg-yellow rounded-full flex flex-col items-center justify-center text-center shadow-[0_8px_24px_rgba(245,197,24,0.35)]">
            <span className="font-display text-[2rem] text-black leading-none">+20</span>
            <span className="text-[0.55rem] font-bold uppercase tracking-wide text-black/80 leading-tight">
              anos de<br />experiência
            </span>
          </div>
        </div>

        <div className="reveal">
          <span className="section-tag">Quem está por trás</span>
          <h2 className="section-title mt-2">
            Experiência real.<br /><em>Resultado</em> concreto.
          </h2>
          <p className="text-black/75 leading-relaxed mb-4">
            Sou <strong className="text-yellow">Bruno Chaves</strong>, designer gráfico com mais de 20 anos de mercado.
            Durante esse tempo, atuei em agências, clubes de futebol, empresas de distribuição e projetos
            digitais — sempre com foco em criar comunicação visual que funciona.
          </p>
          <p className="text-black/55 leading-relaxed mb-4">
            Nos últimos anos expandi minha atuação para o desenvolvimento front-end, dominando ReactJS,
            Tailwind e tecnologias modernas da web. Hoje, essa combinação — design estratégico + código
            de qualidade — é o que diferencia a BBold.
          </p>
          <p className="text-black/55 leading-relaxed">
            A agência também conta com <strong className="text-black">gestão administrativa organizada e rigorosa</strong>,
            garantindo processos claros, contratos profissionais e entregas dentro do prazo.
          </p>
        </div>
      </div>
    </section>
  );
}
