"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  const refs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      setTimeout(() => el.classList.add("visible"), 200 + i * 130);
    });
  }, []);

  const addRef = (el: HTMLElement | null, i: number) => {
    if (el) refs.current[i] = el;
  };

  return (
    <section className="min-h-screen flex items-center px-10 pt-28 pb-24 max-w-site mx-auto gap-16 relative">
      <div className="flex-1 relative z-10">
        <p
          ref={(el) => addRef(el, 0)}
          className="reveal text-[0.72rem] font-bold tracking-[0.28em] uppercase text-yellow/70 mb-7"
        >
          Posicionamento Digital Empresarial
        </p>

        <h1
          ref={(el) => addRef(el, 1)}
          className="reveal font-display text-[clamp(2.8rem,5.5vw,5rem)] leading-[0.95] tracking-wide text-offwhite mb-9"
        >
          Sua empresa<br />
          precisa parecer<br />
          do tamanho<br />
          <span className="text-yellow">que ela é.</span>
        </h1>

        <p
          ref={(el) => addRef(el, 2)}
          className="reveal text-[1.05rem] text-offwhite/55 max-w-md mb-11 leading-[1.8]"
        >
          Empresas fortes transmitem autoridade, profissionalismo e confiança
          em todos os pontos da presença digital — do site ao Instagram,
          do Google ao primeiro contato.
        </p>

        <div ref={(el) => addRef(el, 3)} className="reveal flex gap-4 flex-wrap">
          <Link
            href="/#contato"
            className="inline-flex items-center gap-2 bg-yellow text-black font-bold text-sm tracking-widest uppercase px-8 py-4 rounded-sm hover:bg-yellow-dark transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(245,197,24,0.22)]"
          >
            Solicitar diagnóstico
          </Link>
          <Link
            href="/#metodo"
            className="inline-flex items-center gap-2 border border-offwhite/20 text-offwhite/60 font-semibold text-sm tracking-widest uppercase px-8 py-4 rounded-sm hover:border-yellow/50 hover:text-yellow transition-all hover:-translate-y-0.5"
          >
            Conhecer o método
          </Link>
        </div>
      </div>

      <div
        ref={(el) => addRef(el, 4)}
        className="reveal flex-shrink-0 relative z-10 hidden md:block"
      >
        <Image
          src="/img/icone ID. VISUAL.svg"
          alt="BBold"
          width={360}
          height={360}
          className="w-[clamp(150px,22vw,340px)] drop-shadow-[0_0_90px_rgba(245,197,24,0.10)] animate-[float_4s_ease-in-out_infinite] opacity-80"
          priority
        />
      </div>

      <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 text-[0.65rem] tracking-[0.2em] uppercase text-offwhite/20">
        <span>Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-yellow/40 to-transparent animate-[scrollLine_1.8s_ease-in-out_infinite]" />
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
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
