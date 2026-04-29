import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black-mid border-t border-offwhite/[0.06] pt-16 pb-7">
      <div className="max-w-site mx-auto px-10 grid grid-cols-1 md:grid-cols-3 gap-14 pb-12 border-b border-offwhite/[0.06]">
        <div>
          <Image
            src="/img/LOGO-PRINCIPAL.svg"
            alt="Agência BBold"
            width={130}
            height={40}
            className="h-10 w-auto mb-4"
          />
          <p className="text-sm text-offwhite/40 leading-relaxed">
            Marketing digital que impacta.<br />
            Serra, Espírito Santo — Brasil.
          </p>
        </div>

        <div>
          <h4 className="text-[0.75rem] font-bold tracking-[0.15em] uppercase text-yellow mb-5">
            Serviços
          </h4>
          <ul className="flex flex-col gap-2.5">
            {[
              "Social Media",
              "Tráfego Pago",
              "Design Gráfico",
              "Sites & Landing Pages",
              "Google Meu Negócio",
            ].map((s) => (
              <li key={s}>
                <Link
                  href="/#servicos"
                  className="text-sm text-offwhite/45 hover:text-offwhite transition-colors"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[0.75rem] font-bold tracking-[0.15em] uppercase text-yellow mb-5">
            Redes Sociais
          </h4>
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Instagram", href: "https://www.instagram.com/agenciabbold" },
              { label: "LinkedIn", href: "https://www.linkedin.com/company/agenciabbold" },
              { label: "WhatsApp", href: "https://wa.me/5527997341557" },
              { label: "Blog", href: "/blog" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="inline-block text-[0.82rem] font-bold tracking-wide uppercase text-offwhite/50 border border-offwhite/10 px-3.5 py-2 rounded-sm text-center hover:border-yellow hover:text-yellow transition-all"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-site mx-auto px-10 mt-7 flex flex-col md:flex-row items-center justify-between gap-2.5 text-[0.8rem] text-offwhite/25">
        <p>© 2026 Agência BBold. Todos os direitos reservados.</p>
        <p>
          Desenvolvido por <strong className="text-offwhite/45">Bruno Chaves</strong>
        </p>
      </div>
    </footer>
  );
}
