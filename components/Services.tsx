"use client";

import { useEffect, useRef } from "react";

const services = [
  {
    num: "01", icon: "📱", title: "Social Media",
    desc: "Calendário editorial, criação de artes, copywriting e publicação. Sua presença digital consistente e estratégica, todo dia.",
    items: ["Posts para feed e stories", "Legendas e chamadas", "Relatório mensal"],
  },
  {
    num: "02", icon: "🎯", title: "Tráfego Pago",
    desc: "Campanhas no Meta Ads e Google Ads gerenciadas por quem entende de performance. Mais clientes, menor custo por resultado.",
    items: ["Meta Ads (Instagram/Facebook)", "Google Ads", "Criativos para anúncios"],
  },
  {
    num: "03", icon: "🎨", title: "Design Gráfico",
    desc: "Identidade visual, embalagens, materiais impressos e peças digitais. Design que posiciona sua marca e gera confiança.",
    items: ["Identidade visual", "Materiais impressos", "Embalagens & rótulos"],
  },
  {
    num: "04", icon: "💻", title: "Sites & Landing Pages",
    desc: "Desenvolvimento com ReactJS e Tailwind. Sites rápidos, responsivos e otimizados para converter visitantes em clientes.",
    items: ["Landing pages de alta conversão", "Sites institucionais", "WordPress/Elementor"],
  },
  {
    num: "05", icon: "📍", title: "Google Meu Negócio",
    desc: "Seu negócio aparecendo nos resultados locais do Google. Mais pessoas te encontrando quando precisam do seu produto.",
    items: ["Configuração completa", "Postagens semanais", "Gestão de avaliações"],
  },
  {
    num: "06", icon: "📊", title: "Gestão de Marca",
    desc: "Estratégia integrada de comunicação para que sua marca fale a mesma língua em todos os canais.",
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
        <span className="section-tag">O que fazemos</span>
        <h2 className="section-title mt-2">
          Serviços que<br /><em>transformam</em> negócios
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5">
        {services.map((s, i) => (
          <div
            key={s.num}
            ref={(el) => { if (el) cardRefs.current[i] = el; }}
            data-delay={i}
            className="reveal bg-black-light border border-offwhite/5 p-10 relative overflow-hidden group cursor-default transition-all duration-300 hover:bg-black-mid hover:-translate-y-1 hover:border-yellow/15 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[3px] before:bg-yellow before:scale-x-0 before:origin-left before:transition-transform before:duration-300 hover:before:scale-x-100"
          >
            <span className="absolute top-5 right-6 font-display text-[4rem] text-yellow/[0.08] leading-none group-hover:text-yellow/[0.18] transition-colors">
              {s.num}
            </span>
            <div className="text-3xl mb-4">{s.icon}</div>
            <h3 className="font-display text-[1.6rem] tracking-wide text-offwhite mb-3">{s.title}</h3>
            <p className="text-sm text-offwhite/55 leading-relaxed mb-4">{s.desc}</p>
            <ul className="flex flex-col gap-1.5">
              {s.items.map((item) => (
                <li key={item} className="text-[0.82rem] text-offwhite/40 pl-4 relative before:absolute before:left-0 before:content-['→'] before:text-yellow before:font-bold">
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
