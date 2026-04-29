import Link from "next/link";

export default function CtaBand() {
  return (
    <section className="bg-yellow py-16 px-10">
      <div className="max-w-site mx-auto flex flex-col md:flex-row items-center justify-between gap-10 flex-wrap reveal">
        <div>
          <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] text-black tracking-wide mb-2">
            Pronto para colocar sua marca em evidência?
          </h2>
          <p className="text-black/65">
            Converse com a gente e descubra o projeto ideal para o seu negócio.
          </p>
        </div>
        <Link
          href="/#contato"
          className="flex-shrink-0 inline-flex items-center gap-2 bg-black text-yellow font-bold text-sm tracking-widest uppercase px-8 py-4 rounded-sm hover:bg-black-mid transition-all hover:-translate-y-0.5"
        >
          Fale com a BBold
        </Link>
      </div>
    </section>
  );
}
