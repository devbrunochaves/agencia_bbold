import Link from "next/link";

const steps = [
  {
    num: "01",
    title: "Diagnóstico",
    desc: "Análise completa da presença digital atual da empresa — identidade, comunicação, concorrência e oportunidades.",
  },
  {
    num: "02",
    title: "Posicionamento",
    desc: "Definição da percepção, comunicação e autoridade que a marca deve transmitir no mercado.",
  },
  {
    num: "03",
    title: "Estrutura Visual",
    desc: "Construção da identidade visual e padronização da marca em todos os pontos de contato.",
  },
  {
    num: "04",
    title: "Presença Digital",
    desc: "Sites, redes sociais, Google Meu Negócio e experiência digital integrada e consistente.",
  },
  {
    num: "05",
    title: "Crescimento e Autoridade",
    desc: "Fortalecimento da percepção da empresa no mercado, gerando reconhecimento e confiança duradouros.",
  },
];

export default function MetodoBBold() {
  return (
    <section
      id="metodo"
      className="py-28 px-10 bg-black border-y border-offwhite/[0.05] relative overflow-hidden"
    >
      <span className="absolute top-1/2 right-[-1%] -translate-y-1/2 font-display text-[clamp(9rem,20vw,18rem)] text-yellow/[0.025] pointer-events-none select-none leading-none">
        MÉTODO
      </span>

      <div className="max-w-site mx-auto relative z-10">
        <div className="text-center mb-20 reveal">
          <span className="section-tag">Nosso processo</span>
          <h2 className="section-title mt-2">
            Método <em>BBOLD</em>
          </h2>
          <p className="text-offwhite/45 max-w-lg mx-auto leading-relaxed mt-2">
            Um processo estruturado para transformar a presença digital da sua
            empresa em autoridade reconhecida no mercado.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-px bg-offwhite/[0.06] rounded-sm overflow-hidden">
          {steps.map((s) => (
            <div
              key={s.num}
              className="reveal bg-black p-8 xl:p-10 flex flex-col gap-5 group hover:bg-black-light transition-colors duration-500"
            >
              <span className="font-display text-[2.8rem] text-yellow leading-none">
                {s.num}
              </span>
              <div>
                <h3 className="font-bold text-offwhite text-[1rem] mb-3 leading-snug tracking-wide">
                  {s.title}
                </h3>
                <div className="w-7 h-[2px] bg-yellow/50 mb-4 group-hover:w-11 transition-all duration-300" />
                <p className="text-[0.85rem] text-offwhite/45 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center reveal">
          <Link
            href="/#contato"
            className="inline-flex items-center gap-2 border border-yellow/35 text-yellow font-bold text-sm tracking-widest uppercase px-8 py-3.5 rounded-sm hover:bg-yellow hover:text-black transition-all hover:-translate-y-0.5"
          >
            Iniciar meu diagnóstico
          </Link>
        </div>
      </div>
    </section>
  );
}
