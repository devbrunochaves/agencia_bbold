"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  const refs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      setTimeout(() => el.classList.add("visible"), 200 + i * 120);
    });
  }, []);

  const addRef = (el: HTMLDivElement | null, i: number) => {
    if (el) refs.current[i] = el;
  };

  return (
    <section className="min-h-screen flex items-center px-10 pt-28 pb-20 max-w-site mx-auto gap-14 relative">
      <div className="flex-1 relative z-10">
        <p ref={(el) => addRef(el, 0)} className="reveal text-[0.78rem] font-bold tracking-[0.22em] uppercase text-yellow mb-4">
          Agência de Marketing Digital
        </p>
        <h1 ref={(el) => addRef(el, 1)} className="reveal font-display text-[clamp(4rem,10vw,8rem)] leading-[0.95] tracking-wide text-offwhite mb-6">
          Sua marca<br />
          <span className="text-yellow">merece</span><br />
          ser vista.
        </h1>
        <p ref={(el) => addRef(el, 2)} className="reveal text-lg text-offwhite/65 max-w-lg mb-9 leading-relaxed">
          Design estratégico, tráfego pago e gestão de redes sociais para
          empresas que querem crescer de verdade.
        </p>
        <div ref={(el) => addRef(el, 3)} className="reveal flex gap-4 flex-wrap">
          <Link
            href="/#contato"
            className="inline-flex items-center gap-2 bg-yellow text-black font-bold text-sm tracking-widest uppercase px-8 py-3.5 rounded-sm hover:bg-yellow-dark transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(245,197,24,0.3)]"
          >
            Quero crescer agora
          </Link>
          <Link
            href="/#servicos"
            className="inline-flex items-center gap-2 border-2 border-offwhite/30 text-offwhite font-bold text-sm tracking-widest uppercase px-8 py-3.5 rounded-sm hover:border-yellow hover:text-yellow transition-all hover:-translate-y-0.5"
          >
            Ver serviços
          </Link>
        </div>
      </div>

      <div ref={(el) => addRef(el, 4)} className="reveal flex-shrink-0 relative z-10 hidden md:block">
        <Image
          src="/img/icone ID. VISUAL.svg"
          alt="BBold"
          width={380}
          height={380}
          className="w-[clamp(180px,28vw,380px)] drop-shadow-[0_0_60px_rgba(245,197,24,0.25)] animate-[float_3s_ease-in-out_infinite]"
          priority
        />
      </div>

      <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 text-[0.65rem] tracking-[0.2em] uppercase text-offwhite/30">
        <span>Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-yellow/60 to-transparent animate-[scrollLine_1.8s_ease-in-out_infinite]" />
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
        }
        @keyframes scrollLine {
          0% { transform: scaleY(0); transform-origin: top; }
          50% { transform: scaleY(1); transform-origin: top; }
          51% { transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }
      `}</style>
    </section>
  );
}
