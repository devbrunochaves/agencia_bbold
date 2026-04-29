"use client";

import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "", company: "", phone: "", service: "", message: "",
  });
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      showToast("Preencha seu nome e WhatsApp. 😊", "error");
      return;
    }
    const text = encodeURIComponent(
      `Olá! Vim pelo site da Agência BBold.\n\n` +
      `*Nome:* ${form.name}\n` +
      (form.company ? `*Empresa:* ${form.company}\n` : "") +
      (form.service ? `*Serviço de interesse:* ${form.service}\n` : "") +
      (form.message ? `*Mensagem:* ${form.message}` : "")
    );
    window.open(`https://wa.me/5527997341557?text=${text}`, "_blank");
    showToast("Redirecionando para o WhatsApp! 🚀", "success");
    setForm({ name: "", company: "", phone: "", service: "", message: "" });
  };

  const inputClass =
    "w-full bg-black-light border border-offwhite/10 rounded-sm px-5 py-4 text-offwhite text-sm placeholder-offwhite/25 outline-none focus:border-yellow focus:shadow-[0_0_0_3px_rgba(245,197,24,0.1)] transition-all";

  return (
    <section id="contato" className="py-24 px-10 max-w-site mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-20 items-start">
        <div className="reveal">
          <span className="section-tag">Contato</span>
          <h2 className="section-title mt-2">
            Vamos conversar<br />sobre seu negócio?
          </h2>
          <p className="text-offwhite/60 leading-relaxed mb-8">
            Estamos em Serra, ES — mas atendemos em todo o Brasil de forma
            remota. Envie uma mensagem e retornamos em até 24h.
          </p>
          <div className="flex flex-col gap-4">
            {[
              { icon: "💬", label: "(27) 9 9734-1557", href: "https://wa.me/5527997341557" },
              { icon: "✉️", label: "contato@agenciabbold.com.br", href: "mailto:contato@agenciabbold.com.br" },
              { icon: "📍", label: "Serra, Espírito Santo", href: null },
            ].map((c) => (
              <div key={c.label}>
                {c.href ? (
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-offwhite/60 hover:text-yellow transition-colors"
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span>{c.label}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 text-offwhite/60">
                    <span className="text-lg">{c.icon}</span>
                    <span>{c.label}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="reveal flex flex-col gap-4">
          <input className={inputClass} placeholder="Seu nome *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={inputClass} placeholder="Nome da empresa" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <input className={inputClass} placeholder="WhatsApp *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <select
            className={`${inputClass} cursor-pointer`}
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
          >
            <option value="">Qual serviço te interessa?</option>
            {["Social Media", "Tráfego Pago", "Design Gráfico", "Site / Landing Page", "Google Meu Negócio", "Pacote completo"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <textarea
            className={`${inputClass} resize-y min-h-[120px]`}
            placeholder="Conte um pouco sobre seu negócio..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <button
            type="submit"
            className="w-full bg-yellow text-black font-bold text-sm tracking-widest uppercase py-4 rounded-sm hover:bg-yellow-dark transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(245,197,24,0.3)]"
          >
            Enviar mensagem →
          </button>
          <p className="text-center text-[0.78rem] text-offwhite/35">Respondemos em até 24 horas úteis.</p>
        </form>
      </div>

      {toast && (
        <div
          className={`fixed bottom-8 right-8 px-6 py-4 rounded-sm font-bold text-sm z-50 transition-all ${
            toast.type === "success" ? "bg-yellow text-black" : "bg-red-500 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </section>
  );
}
