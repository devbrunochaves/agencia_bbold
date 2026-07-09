"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  PlayCircle,
  X,
  CheckCircle2,
  ArrowRight,
  Share2,
  Globe,
  PenTool,
  TrendingUp,
  MapPin,
  Palette,
  MessageSquare,
  RotateCcw,
} from "lucide-react";

// ─── animation variants ───────────────────────────────────────────────────────
const EASE = [0.22, 1, 0.36, 1] as const;

const FADE_UP = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};
const FADE_LEFT = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: EASE } },
};
const FADE_RIGHT = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: EASE } },
};
const SCALE_IN = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: EASE } },
};
const STAGGER_CONTAINER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const HERO_CONTAINER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};
const VIEWPORT = { once: true, margin: "-80px 0px" };

// ─── static data ─────────────────────────────────────────────────────────────
const services = [
  {
    icon: Share2,
    title: "Social Media",
    desc: "Gestão completa das redes sociais com estratégia, design e consistência de marca.",
  },
  {
    icon: TrendingUp,
    title: "Tráfego Pago",
    desc: "Campanhas no Meta Ads e Google Ads segmentadas para o público certo, na hora certa.",
  },
  {
    icon: PenTool,
    title: "Design Gráfico",
    desc: "Materiais visuais que comunicam profissionalismo e diferenciam a sua marca.",
  },
  {
    icon: Globe,
    title: "Sites & Landing Pages",
    desc: "Desenvolvimento web moderno, rápido e otimizado para converter visitantes em clientes.",
  },
  {
    icon: MapPin,
    title: "Google Meu Negócio",
    desc: "SEO local para aparecer nos resultados quando clientes próximos buscam pelo seu serviço.",
  },
  {
    icon: Palette,
    title: "Identidade Visual",
    desc: "Logo, paleta de cores e manual de marca para posicionar seu negócio com autoridade.",
  },
];

const timeline = [
  { n: "01", title: "Diagnóstico", desc: "Entendemos seu negócio, a concorrência e as oportunidades digitais do seu segmento." },
  { n: "02", title: "Estratégia", desc: "Definimos o posicionamento ideal, os canais prioritários e as metas realistas e claras." },
  { n: "03", title: "Criação", desc: "Produzimos os conteúdos, designs e toda a estrutura visual e técnica necessária." },
  { n: "04", title: "Publicação", desc: "Colocamos tudo no ar e iniciamos a execução da estratégia com consistência." },
  { n: "05", title: "Otimização", desc: "Monitoramos os resultados e ajustamos continuamente para crescer mês a mês." },
];

const beforeAfter = [
  { before: "Perfil sem identidade visual definida", after: "Marca que gera desejo e reconhecimento instantâneo" },
  { before: "Postagens aleatórias sem planejamento", after: "Conteúdo estratégico que educa, conecta e vende" },
  { before: "Site desatualizado ou inexistente", after: "Plataforma que converte visitantes em clientes reais" },
  { before: "Invisível nas pesquisas do Google", after: "Encontrado por quem está procurando seu serviço agora" },
];

const proofItems = [
  "Pesquisam no Google antes de tomar qualquer decisão de compra",
  "Verificam o Instagram e as avaliações da empresa",
  "Comparam visualmente com a concorrência antes de escolher",
  "Tomam a decisão com base na confiança que a marca transmite",
  "Recomendam para amigos apenas o que os impressionou visualmente",
  "Pagam mais por marcas que demonstram profissionalismo",
];

const quizQuestions = [
  "Você tem um perfil profissional no Instagram para o seu negócio?",
  "Você publica conteúdo de forma consistente (pelo menos 3x por semana)?",
  "Quando alguém pesquisa pelo seu serviço no Google, você aparece?",
  "Você tem identidade visual definida — logo, cores e fontes padronizadas?",
  "Você já investe em tráfego pago (Meta Ads ou Google Ads)?",
];

function getQuizResult(score: number) {
  if (score <= 1)
    return {
      label: "Urgente",
      msg: "Sua presença digital precisa de atenção imediata. Você está perdendo clientes todos os dias para a concorrência que aparece antes de você.",
      color: "text-red-400",
      bg: "bg-red-400/10",
    };
  if (score <= 3)
    return {
      label: "Em Desenvolvimento",
      msg: "Você tem alguma base, mas ainda perde clientes por falta de consistência e estratégia. Há muito espaço para evoluir — e crescer rápido.",
      color: "text-yellow",
      bg: "bg-yellow/10",
    };
  return {
    label: "Bom Caminho",
    msg: "Você está no caminho certo. Mas um posicionamento estratégico pode acelerar seus resultados de forma expressiva — vamos ao próximo nível.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  };
}

const WA_BASE = "https://wa.me/5527997341557";

// ─── component ───────────────────────────────────────────────────────────────
export default function PresencaDigitalClient() {
  const shouldReduce = useReducedMotion();

  const [videoOpen, setVideoOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<boolean[]>([]);

  function handleAnswer(ans: boolean) {
    const updated = [...quizAnswers, ans];
    setQuizAnswers(updated);
    setQuizStep(updated.length === quizQuestions.length ? 6 : quizStep + 1);
  }

  function resetQuiz() {
    setQuizStep(0);
    setQuizAnswers([]);
  }

  const score = quizAnswers.filter(Boolean).length;
  const result = getQuizResult(score);

  function rm<T extends object>(props: T): T | Record<string, never> {
    return shouldReduce ? {} : props;
  }

  return (
    <main className="overflow-x-hidden">

      {/* ── Video modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            key="video-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
            onClick={() => setVideoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute -top-12 right-0 flex items-center gap-2 text-offwhite/60 hover:text-offwhite text-sm uppercase tracking-widest transition-colors"
                onClick={() => setVideoOpen(false)}
              >
                <X size={16} /> Fechar
              </button>
              <div className="aspect-video bg-black-light rounded-lg border border-offwhite/10 flex flex-col items-center justify-center gap-4">
                <PlayCircle size={48} className="text-yellow/40" />
                <p className="text-offwhite/40 text-xs uppercase tracking-widest">
                  Vídeo em breve
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Hero ──────────────────────────────────────────────────────── */}
      <section className="min-h-screen bg-black relative flex items-center overflow-hidden">
        {/* glow bg */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[55vw] h-[55vw] max-w-[650px] bg-yellow/[0.035] rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[40vw] h-[40vw] max-w-[500px] bg-yellow/[0.02] rounded-full blur-3xl" />
        </div>

        <div className="max-w-site mx-auto px-10 py-32 pt-36 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
          <motion.div
            {...rm({ variants: HERO_CONTAINER, initial: "hidden", animate: "visible" })}
          >
            <motion.span
              {...rm({ variants: FADE_UP })}
              className="section-tag inline-block"
            >
              Presença Digital
            </motion.span>

            <motion.h1
              {...rm({ variants: FADE_LEFT })}
              className="font-display text-[clamp(3.2rem,7vw,5.8rem)] leading-none tracking-wide text-offwhite mt-4"
            >
              Seu negócio<br />
              merece<br />
              ser <em className="text-yellow">visto.</em>
            </motion.h1>

            <motion.p
              {...rm({ variants: FADE_UP })}
              className="text-offwhite/60 leading-relaxed mt-6 max-w-md text-[1.05rem]"
            >
              Você tem um produto ou serviço incrível. Mas se ninguém te vê online,
              você está perdendo clientes todo dia. Vamos mudar isso agora.
            </motion.p>

            <motion.div
              {...rm({ variants: FADE_UP })}
              className="flex flex-wrap gap-4 mt-10"
            >
              <a
                href={`${WA_BASE}?text=Ol%C3%A1%2C+vim+pela+p%C3%A1gina+de+presen%C3%A7a+digital+e+quero+saber+mais!`}
                target="_blank"
                rel="noreferrer"
                className="bg-yellow text-black font-bold tracking-wide uppercase text-sm px-8 py-4 rounded-sm hover:bg-yellow-dark transition-colors"
              >
                Quero estar presente →
              </a>
              <button
                onClick={() => setVideoOpen(true)}
                className="flex items-center gap-2 text-offwhite/55 hover:text-yellow transition-colors text-sm font-semibold uppercase tracking-wide"
              >
                <PlayCircle size={20} /> Ver como funciona
              </button>
            </motion.div>
          </motion.div>

          <motion.button
            {...rm({ variants: FADE_RIGHT, initial: "hidden", animate: "visible" })}
            onClick={() => setVideoOpen(true)}
            aria-label="Assistir apresentação em vídeo"
            className="w-full aspect-video bg-black-light border border-offwhite/10 rounded-lg flex flex-col items-center justify-center gap-5 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow/5 to-transparent group-hover:from-yellow/10 transition-all duration-500" />
            <PlayCircle
              size={64}
              className="text-yellow opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 relative z-10"
            />
            <span className="text-offwhite/35 text-xs uppercase tracking-widest relative z-10">
              Assistir apresentação
            </span>
          </motion.button>
        </div>

        {/* scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-25 pointer-events-none">
          <div className="w-px h-10 bg-offwhite animate-pulse" />
        </div>
      </section>

      {/* ── 2. Prova social / checklist ──────────────────────────────────── */}
      <section className="py-24 bg-black-mid">
        <div className="max-w-site mx-auto px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-16 items-start">
            <motion.div
              {...rm({ variants: FADE_LEFT, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
            >
              <span className="section-tag">Comportamento do Consumidor</span>
              <h2 className="section-title mt-2">
                As pessoas<br />
                compram<br />
                <em>antes de comprar.</em>
              </h2>
              <p className="text-offwhite/55 leading-relaxed">
                Antes de abrir a carteira, seu cliente já te julgou pelo Instagram,
                pelo site, pelo Google e pelas avaliações. Se o que ele viu não
                transmitiu confiança — você perdeu, sem nem ter a chance de
                apresentar o que faz.
              </p>
            </motion.div>

            <motion.ul
              className="flex flex-col gap-3"
              {...rm({ variants: STAGGER_CONTAINER, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
            >
              {proofItems.map((item, i) => (
                <motion.li
                  key={i}
                  {...rm({ variants: FADE_UP })}
                  className="flex items-start gap-4 bg-black-light border border-offwhite/[0.06] rounded-sm px-5 py-4 hover:border-yellow/20 transition-colors"
                >
                  <CheckCircle2 size={18} className="text-yellow shrink-0 mt-0.5" />
                  <span className="text-offwhite/65 leading-snug text-[0.93rem]">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
      </section>

      {/* ── 3. Antes / Depois ────────────────────────────────────────────── */}
      <section className="py-24 bg-black">
        <div className="max-w-site mx-auto px-10">
          <motion.div
            className="text-center mb-16"
            {...rm({ variants: FADE_UP, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
          >
            <span className="section-tag">Transformação</span>
            <h2 className="section-title mt-2">
              Antes e <em>depois</em><br />da BBold.
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            {...rm({ variants: STAGGER_CONTAINER, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
          >
            {beforeAfter.map((card, i) => (
              <motion.div
                key={i}
                {...rm({ variants: SCALE_IN })}
                className="bg-black-light border border-offwhite/[0.06] rounded-sm p-6 flex flex-col gap-4 hover:border-yellow/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 text-[0.65rem] font-bold tracking-widest uppercase text-red-400/80 bg-red-400/10 px-2 py-1 rounded-sm mt-0.5">
                    Antes
                  </span>
                  <span className="text-offwhite/45 text-sm leading-snug">{card.before}</span>
                </div>
                <div className="w-full h-px bg-offwhite/[0.06]" />
                <div className="flex items-start gap-3">
                  <span className="shrink-0 text-[0.65rem] font-bold tracking-widest uppercase text-yellow bg-yellow/10 px-2 py-1 rounded-sm mt-0.5">
                    Depois
                  </span>
                  <span className="text-offwhite/85 text-sm font-semibold leading-snug">{card.after}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 4. Serviços ──────────────────────────────────────────────────── */}
      <section id="servicos-pd" className="py-24 bg-black-mid">
        <div className="max-w-site mx-auto px-10">
          <motion.div
            className="text-center mb-16"
            {...rm({ variants: FADE_UP, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
          >
            <span className="section-tag">O Que Fazemos</span>
            <h2 className="section-title mt-2">
              Serviços que<br />
              <em>constroem presença.</em>
            </h2>
            <p className="text-offwhite/50 max-w-lg mx-auto">
              Cada serviço foi pensado para trabalhar em conjunto — porque presença
              digital de verdade não é um post isolado. É um ecossistema.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            {...rm({ variants: STAGGER_CONTAINER, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
          >
            {services.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <motion.div
                  key={i}
                  {...rm({ variants: FADE_UP })}
                  className="group bg-black-light border border-offwhite/[0.06] rounded-sm p-7 flex flex-col gap-5 hover:border-yellow/30 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-11 h-11 bg-yellow/10 rounded-sm flex items-center justify-center group-hover:bg-yellow/20 transition-colors">
                    <Icon size={20} className="text-yellow" />
                  </div>
                  <div>
                    <h3 className="font-display text-[1.35rem] tracking-wide text-offwhite mb-2">
                      {svc.title}
                    </h3>
                    <p className="text-offwhite/48 text-sm leading-relaxed">{svc.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── 5. Timeline ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-black">
        <div className="max-w-site mx-auto px-10">
          <motion.div
            className="text-center mb-16"
            {...rm({ variants: FADE_UP, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
          >
            <span className="section-tag">Como Trabalhamos</span>
            <h2 className="section-title mt-2">
              Do zero ao<br />
              <em>resultado</em> concreto.
            </h2>
          </motion.div>

          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-7 top-4 bottom-4 w-px bg-yellow/15 hidden md:block" />

            <motion.div
              className="flex flex-col gap-10"
              {...rm({ variants: STAGGER_CONTAINER, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
            >
              {timeline.map((step) => (
                <motion.div
                  key={step.n}
                  {...rm({ variants: FADE_LEFT })}
                  className="flex gap-7 items-start"
                >
                  <div className="shrink-0 w-14 h-14 bg-black-mid border border-yellow/30 rounded-sm flex items-center justify-center relative z-10">
                    <span className="font-display text-yellow text-[1.05rem] tracking-wider">
                      {step.n}
                    </span>
                  </div>
                  <div className="pt-2">
                    <h3 className="font-display text-[1.4rem] tracking-wide text-offwhite leading-none">
                      {step.title}
                    </h3>
                    <p className="text-offwhite/50 text-sm leading-relaxed mt-2">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 6. Portfólio grid ────────────────────────────────────────────── */}
      <section className="py-24 bg-black-mid">
        <div className="max-w-site mx-auto px-10">
          <motion.div
            className="text-center mb-16"
            {...rm({ variants: FADE_UP, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
          >
            <span className="section-tag">Portfólio</span>
            <h2 className="section-title mt-2">
              Trabalhos que<br />
              <em>falam por si.</em>
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
            {...rm({ variants: STAGGER_CONTAINER, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <motion.div
                key={i}
                {...rm({ variants: SCALE_IN })}
                className="aspect-square bg-black-light border border-offwhite/[0.06] rounded-sm flex items-center justify-center text-offwhite/18 text-[0.65rem] uppercase tracking-widest hover:border-yellow/20 hover:text-yellow/25 transition-all"
              >
                Em breve
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="text-center mt-10"
            {...rm({ variants: FADE_UP, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
          >
            <a
              href="/projetos"
              className="inline-flex items-center gap-2 text-yellow border border-yellow/30 px-6 py-3 rounded-sm text-sm font-bold uppercase tracking-wide hover:bg-yellow hover:text-black transition-all"
            >
              Ver todos os projetos <ArrowRight size={15} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── 7. Sobre Bruno ───────────────────────────────────────────────── */}
      <section className="py-24 bg-black">
        <div className="max-w-site mx-auto px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              {...rm({ variants: FADE_LEFT, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
            >
              <span className="section-tag">Quem Faz Acontecer</span>
              <h2 className="section-title mt-2">
                +20 anos de<br />
                <em>mercado.</em><br />
                Um propósito.
              </h2>
              <p className="text-offwhite/60 leading-relaxed mb-4">
                Sou <strong className="text-yellow">Bruno Chaves</strong>, designer gráfico
                com mais de 20 anos de experiência em comunicação visual. Atuei em agências,
                clubes de futebol, distribuidoras e projetos digitais — sempre com foco em
                criar marcas que funcionam de verdade.
              </p>
              <p className="text-offwhite/45 leading-relaxed mb-8">
                Expandi minha atuação para o desenvolvimento front-end e para o marketing
                digital. Hoje essa combinação — estratégia, design e tecnologia — é o que
                diferencia a BBold e entrega resultados concretos para cada cliente.
              </p>
              <a
                href="/#quem-somos"
                className="inline-flex items-center gap-2 text-yellow text-sm font-bold uppercase tracking-wide hover:gap-3 transition-all duration-200"
              >
                Conhecer a história completa <ArrowRight size={15} />
              </a>
            </motion.div>

            <motion.div
              {...rm({ variants: FADE_RIGHT, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
              className="relative"
            >
              <div className="aspect-[4/5] bg-black-light border border-offwhite/[0.06] rounded-sm overflow-hidden flex items-center justify-center">
                <span className="text-offwhite/20 text-xs uppercase tracking-widest">Foto</span>
              </div>
              <div className="absolute -bottom-5 -right-5 w-24 h-24 bg-yellow rounded-full flex flex-col items-center justify-center text-center shadow-[0_8px_24px_rgba(245,197,24,0.35)]">
                <span className="font-display text-[1.9rem] text-black leading-none">+20</span>
                <span className="text-[0.52rem] font-bold uppercase tracking-wide text-black/80 leading-tight">
                  anos de<br />experiência
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 8. Manifesto ─────────────────────────────────────────────────── */}
      <section className="py-32 bg-yellow relative overflow-hidden">
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[clamp(8rem,20vw,18rem)] text-black/[0.05] whitespace-nowrap select-none pointer-events-none">
          BBOLD
        </span>
        <div className="max-w-site mx-auto px-10 text-center relative z-10">
          <motion.div
            {...rm({ variants: SCALE_IN, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
          >
            <h2 className="font-display text-[clamp(2.4rem,6vw,5rem)] leading-none tracking-wide text-black mb-8">
              Sua marca é o que<br />
              as pessoas dizem<br />
              quando você não<br />
              está na sala.
            </h2>
            <p className="text-black/60 text-[1.05rem] leading-relaxed max-w-2xl mx-auto mb-10">
              E o que elas dizem depende do que você mostra online. Cada post, cada cor,
              cada palavra comunica algo sobre o seu negócio. A questão é: você está
              comunicando o que deveria?
            </p>
            <a
              href={`${WA_BASE}?text=Ol%C3%A1%2C+quero+trabalhar+meu+posicionamento+digital+com+a+BBold!`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-black text-yellow font-bold tracking-wide uppercase text-sm px-10 py-4 rounded-sm hover:bg-black/80 transition-colors"
            >
              Começar agora <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── 9. Quiz diagnóstico ──────────────────────────────────────────── */}
      <section id="diagnostico-pd" className="py-24 bg-black">
        <div className="max-w-site mx-auto px-10">
          <motion.div
            className="text-center mb-12"
            {...rm({ variants: FADE_UP, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
          >
            <span className="section-tag">Diagnóstico Rápido</span>
            <h2 className="section-title mt-2">
              Como está sua<br />
              <em>presença digital?</em>
            </h2>
            <p className="text-offwhite/50 max-w-md mx-auto">
              5 perguntas. Resultado imediato. Descubra onde você está e o que
              precisa fazer para crescer.
            </p>
          </motion.div>

          <motion.div
            {...rm({ variants: SCALE_IN, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-black-light border border-offwhite/[0.06] rounded-sm p-8 md:p-12">

              {/* intro */}
              {quizStep === 0 && (
                <div className="text-center flex flex-col items-center gap-6">
                  <div className="w-16 h-16 bg-yellow/10 rounded-full flex items-center justify-center">
                    <MessageSquare size={26} className="text-yellow" />
                  </div>
                  <div>
                    <h3 className="font-display text-[1.7rem] tracking-wide text-offwhite mb-2">
                      Pronto para o diagnóstico?
                    </h3>
                    <p className="text-offwhite/45 text-sm">
                      5 perguntas rápidas · Resultado imediato
                    </p>
                  </div>
                  <button
                    onClick={() => setQuizStep(1)}
                    className="bg-yellow text-black font-bold uppercase tracking-wide text-sm px-10 py-4 rounded-sm hover:bg-yellow-dark transition-colors"
                  >
                    Iniciar diagnóstico →
                  </button>
                </div>
              )}

              {/* questions */}
              {quizStep >= 1 && quizStep <= quizQuestions.length && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={quizStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.28 }}
                  >
                    {/* progress bar */}
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-offwhite/35 text-xs uppercase tracking-widest">
                        {quizStep} / {quizQuestions.length}
                      </span>
                      <div className="flex gap-1.5">
                        {quizQuestions.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${
                              i < quizStep ? "bg-yellow w-8" : "bg-offwhite/10 w-4"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <h3 className="font-display text-[1.4rem] md:text-[1.75rem] tracking-wide text-offwhite mb-10 leading-snug">
                      {quizQuestions[quizStep - 1]}
                    </h3>

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleAnswer(true)}
                        className="flex-1 border border-yellow/30 text-yellow font-bold uppercase tracking-wide text-sm py-4 rounded-sm hover:bg-yellow hover:text-black transition-all"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => handleAnswer(false)}
                        className="flex-1 border border-offwhite/12 text-offwhite/45 font-bold uppercase tracking-wide text-sm py-4 rounded-sm hover:border-offwhite/35 hover:text-offwhite/70 transition-all"
                      >
                        Não
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* result */}
              {quizStep === 6 && (
                <motion.div
                  key="quiz-result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center flex flex-col items-center gap-6"
                >
                  <div className={`w-20 h-20 ${result.bg} rounded-full flex items-center justify-center`}>
                    <span className={`font-display text-[2rem] ${result.color}`}>
                      {score}/5
                    </span>
                  </div>
                  <div>
                    <span className={`font-display text-[1.7rem] tracking-wide ${result.color}`}>
                      {result.label}
                    </span>
                    <p className="text-offwhite/55 leading-relaxed mt-3 max-w-md mx-auto text-sm">
                      {result.msg}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <a
                      href={`${WA_BASE}?text=Fiz+o+diagn%C3%B3stico+de+presen%C3%A7a+digital+e+quero+evoluir+minha+marca!`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-yellow text-black font-bold uppercase tracking-wide text-sm px-8 py-4 rounded-sm hover:bg-yellow-dark transition-colors"
                    >
                      Falar com especialista →
                    </a>
                    <button
                      onClick={resetQuiz}
                      className="flex items-center justify-center gap-2 border border-offwhite/12 text-offwhite/40 font-bold uppercase tracking-wide text-xs px-6 py-4 rounded-sm hover:border-offwhite/35 hover:text-offwhite/70 transition-all"
                    >
                      <RotateCcw size={13} /> Refazer
                    </button>
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-black-mid border-t border-offwhite/[0.05]">
        <div className="max-w-site mx-auto px-10 text-center">
          <motion.div
            {...rm({ variants: FADE_UP, initial: "hidden", whileInView: "visible", viewport: VIEWPORT })}
          >
            <h2 className="font-display text-[clamp(2rem,5vw,3.6rem)] tracking-wide text-offwhite mb-4 leading-none">
              Pronto para construir<br />
              sua <em className="text-yellow">presença digital?</em>
            </h2>
            <p className="text-offwhite/45 max-w-md mx-auto mb-8 leading-relaxed">
              Entre em contato e vamos conversar sobre como posicionar sua marca
              de forma estratégica e consistente.
            </p>
            <a
              href={`${WA_BASE}?text=Ol%C3%A1+Bruno%2C+vim+pela+p%C3%A1gina+de+presen%C3%A7a+digital+e+quero+come%C3%A7ar!`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-yellow text-black font-bold tracking-wide uppercase px-10 py-4 rounded-sm hover:bg-yellow-dark transition-colors"
            >
              <MessageSquare size={17} /> Falar pelo WhatsApp
            </a>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
