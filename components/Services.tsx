"use client";

import { useEffect, useRef } from "react";

const services = [
  {
    num: "01", title: "Gestão de Conteúdo",
    desc: "Calendário editorial estratégico, criação de artes e copywriting alinhados à identidade da marca. Presença digital consistente e profissional.",
    items: ["Posts para feed e stories", "Copywriting estratégico", "Relatório mensal de performance"],
  },
  {
    num: "02", title: "Tráfego Pago",
    desc: "Campanhas no Meta Ads e Google Ads gerenciadas com foco em performance. Mais clientes qualificados, menor custo por resultado.",
    items: ["Meta Ads (Instagram/Facebook)", "Google Ads (Search & Display)", "Criativos de alto impacto"],
  },
  {
    num: "03", title: "Identidade Visual",
    desc: "Construção e padronização visual da marca — do logo ao manual completo. Design que posiciona a empresa e transmite autoridade.",
    items: ["Identidade visual completa", "Manual de marca", "Materiais institucionais"],
  },
  {
    num: "04", title: "Sites & Landing Pages",
    desc: "Desenvolvimento com ReactJS e Tailwind. Sites rápidos, responsivos e estruturados para converter visitantes em clientes.",
    items: ["Landing pages de alta conversão", "Sites institucionais", "WordPress/Elementor"],
  },
  {
    num: "05", title: "Google Meu Negócio",
    desc: "Presença local otimizada no Google — sua empresa aparecendo no momento certo, para as pessoas certas, na região certa.",
    items: ["Configuração e otimização completa", "Postagens semanais", "Gestão de avaliações"],
  },
  {
    num: "06", title: "Posicionamento de Marca",
    desc: "Estratégia integrada de comunicação para que a empresa transmita a mesma autoridade em todos os pontos de contato.",
    items: ["Estratégia de comunicação", "Manual de identidade", "Comunicação B2B e B2C"],
  },
];

export default function Services() {
  const cardRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = parseInt((entry.target as HTMLElement).dataset.delay || "0") * 80;
            setTimeout(() => entry.target.classList.add("visible"), delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="servicos" className="py-24 px-10 max-w-site mx-auto">
      <div className="text-center mb-16 reveal">
        <span className="section-tag">Soluções estratégicas</span>
        <h2 className="section-title mt-2">
          O que a BBold entrega<br />para sua <em>empresa</em>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5">
        {services.map((s, i) => (
          <div
            key={s.num}
            ref={(el) => { if (el) cardRefs.current[i] = el; }}
            data-delay={i}
            className="reveal bg-[#ede6d6] border border-black/5 p-10 relative overflow-hidden group cursor-default transition-all duration-300 hover:bg-[#e5dcc8] hover:-translate-y-1 hover:border-yellow/15 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[3px] before:bg-yellow before:scale-x-0 before:origin-left before:transition-transform before:duration-300 hover:before:scale-x-100"
          >
            <span className="absolute top-5 right-6 font-display text-[4rem] text-yellow/[0.07] leading-none group-hover:text-yellow/[0.14] transition-colors">
              {s.num}
            </span>
            <div className="w-8 h-[2px] bg-yellow/70 mb-5" />
            <h3 className="font-display text-[1.5rem] tracking-wide text-black mb-3">{s.title}</h3>
            <p className="text-sm text-black/55 leading-relaxed mb-4">{s.desc}</p>
            <ul className="flex flex-col gap-1.5">
              {s.items.map((item) => (
                <li key={item} className="text-[0.82rem] text-black/40 pl-4 relative before:absolute before:left-0 before:content-['→'] before:text-yellow before:font-bold">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
