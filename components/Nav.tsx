"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/#servicos", label: "Serviços" },
    { href: "/#pacotes", label: "Pacotes" },
    { href: "/blog", label: "Blog" },
    { href: "/#como-ajudamos", label: "Como Ajudamos" },
    { href: "/#quem-somos", label: "Quem Somos" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/95 backdrop-blur-md py-3 border-b border-yellow/15"
          : "py-5"
      }`}
    >
      <div className="max-w-site mx-auto px-10 flex items-center justify-between">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/img/LOGO-PRINCIPAL.svg"
            alt="Agência BBold"
            width={120}
            height={36}
            className="h-9 w-auto"
          />
        </Link>

        {/* Desktop */}
        <ul className="hidden md:flex items-center gap-9">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`text-[0.85rem] font-semibold tracking-widest uppercase transition-colors duration-200 ${
                  l.label === "Fale Conosco"
                    ? "bg-yellow text-black px-5 py-2 rounded-sm hover:bg-yellow-dark"
                    : "text-offwhite/75 hover:text-yellow"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/#contato"
              className="bg-yellow text-black text-[0.85rem] font-bold tracking-widest uppercase px-5 py-2 rounded-sm hover:bg-yellow-dark transition-colors duration-200"
            >
              Fale Conosco
            </Link>
          </li>
        </ul>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-1 z-50 relative"
          aria-label="Menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span
            className={`block w-6 h-0.5 bg-offwhite transition-all duration-300 ${
              menuOpen ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-offwhite transition-all duration-300 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-offwhite transition-all duration-300 ${
              menuOpen ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 bg-black flex flex-col items-center justify-center gap-9 z-40">
          {[...links, { href: "/#contato", label: "Fale Conosco" }].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-2xl font-semibold tracking-widest uppercase text-offwhite/80 hover:text-yellow transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
