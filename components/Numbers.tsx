"use client";

import { useEffect, useRef } from "react";

const stats = [
  { value: 15, suffix: "+", label: "Anos de experiência no mercado" },
  { value: 100, suffix: "%", label: "Dedicação a resultados mensuráveis" },
  { value: 3, suffix: "x", label: "Mais autoridade percebida no digital" },
];

function Counter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const duration = 1600;
          const step = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = String(Math.round(ease * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>0</span>;
}

export default function Numbers() {
  return (
    <section className="bg-yellow py-16 px-10">
      <div className="max-w-site mx-auto flex flex-col md:flex-row items-center justify-center">
        {stats.map((s, i) => (
          <div key={s.label} className="flex flex-col md:flex-row items-center w-full">
            <div className="flex-1 text-center py-4 md:py-0 md:px-10">
              <div className="flex items-end justify-center gap-1">
                <span className="font-display text-[4rem] text-black leading-none">
                  <Counter target={s.value} />
                </span>
                <span className="font-display text-[2.5rem] text-black leading-none pb-1">
                  {s.suffix}
                </span>
              </div>
              <p className="text-[0.85rem] font-semibold text-black/65 uppercase tracking-wide mt-1">
                {s.label}
              </p>
            </div>
            {i < stats.length - 1 && (
              <div className="hidden md:block w-px h-14 bg-black/20 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
