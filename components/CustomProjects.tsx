import Link from "next/link";

const scenarios = [
  {
    num: "01", title: "Marca do zero",
    desc: "Você tem um negócio mas ainda não tem identidade. A gente constrói sua marca desde a base — logo, cores, tipografia e os primeiros materiais prontos para usar.",
    tags: ["Identidade Visual", "Google Meu Negócio", "Posts para redes"],
  },
  {
    num: "02", title: "Presença digital",
    desc: "Você já tem uma marca mas precisa aparecer no digital. Posicionamos seu negócio no Google, organizamos suas redes sociais e criamos conteúdo que gera resultado.",
    tags: ["Social Media", "Tráfego Pago", "Google Meu Negócio"],
  },
  {
    num: "03", title: "Site profissional",
    desc: "Você precisa de um site que converte visitante em cliente. Desenvolvemos com ReactJS, design focado em performance e otimizado para aparecer no Google.",
    tags: ["Site / Landing Page", "SEO", "Integração WhatsApp"],
  },
  {
    num: "04", title: "Tudo junto",
    desc: "Para quem quer dar um salto de verdade. Marca, site, Google e redes sociais trabalhando juntos com comunicação consistente em todos os canais.",
    tags: ["Identidade Visual", "Site", "Social Media", "Tráfego Pago"],
  },
];

export default function CustomProjects() {
  return (
    <section id="pacotes" className="bg-black-mid border-y border-offwhite/[0.04] py-24 px-10">
      <div className="max-w-site mx-auto">
        <div className="max-w-xl mb-16 reveal">
          <span className="section-tag">Projetos sob medida</span>
          <h2 className="section-title mt-2">
            Cada negócio tem<br />o seu <em>tamanho</em>
          </h2>
          <p className="text-offwhite/55 leading-relaxed">
            Não trabalhamos com pacotes engessados. Entendemos o seu momento,
            o seu objetivo e montamos uma proposta que faz sentido para o seu
            negócio — sem cobrar por o que você não precisa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 mb-16">
          {scenarios.map((s) => (
            <div
              key={s.num}
              className="reveal bg-black-light border border-offwhite/5 p-10 relative overflow-hidden group transition-all duration-300 hover:bg-yellow/[0.03] hover:border-yellow/12 before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-yellow before:scale-x-0 before:origin-left before:transition-transform before:duration-300 hover:before:scale-x-100"
            >
              <span className="absolute top-4 right-6 font-display text-[4.5rem] text-yellow/[0.07] leading-none group-hover:text-yellow/[0.15] transition-colors">
                {s.num}
              </span>
              <h3 className="font-display text-[1.8rem] tracking-wide text-offwhite mb-3">{s.title}</h3>
              <p className="text-[0.92rem] text-offwhite/50 leading-relaxed mb-5">{s.desc}</p>
              <div className="flex flex-wrap gap-2">
                {s.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[0.72rem] font-bold tracking-wide uppercase text-yellow border border-yellow/25 px-2.5 py-1 rounded-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center reveal">
          <p className="text-offwhite/50 mb-5">
            Me conta o que você precisa e eu te mando uma proposta personalizada.
          </p>
          <Link
            href="/#contato"
            className="inline-flex items-center gap-2 bg-yellow text-black font-bold text-sm tracking-widest uppercase px-8 py-3.5 rounded-sm hover:bg-yellow-dark transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(245,197,24,0.3)]"
          >
            Quero uma proposta →
          </Link>
        </div>
      </div>
    </section>
  );
}
