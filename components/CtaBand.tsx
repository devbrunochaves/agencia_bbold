import Link from "next/link";

export default function CtaBand() {
  return (
    <section className="bg-yellow py-20 px-10">
      <div className="max-w-site mx-auto flex flex-col md:flex-row items-center justify-between gap-10 flex-wrap reveal">
        <div>
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] text-black tracking-wide mb-3">
            Sua empresa pronta para transmitir autoridade?
          </h2>
          <p className="text-black/60 max-w-xl leading-relaxed">
            Inicie um diagnóstico e descubra o que é possível transformar
            na presença digital do seu negócio.
          </p>
        </div>
        <Link
          href="/#contato"
          className="flex-shrink-0 inline-flex items-center gap-2 bg-black text-yellow font-bold text-sm tracking-widest uppercase px-8 py-4 rounded-sm hover:bg-black-mid transition-all hover:-translate-y-0.5"
        >
          Solicitar diagnóstico
        </Link>
      </div>
    </section>
  );
}
