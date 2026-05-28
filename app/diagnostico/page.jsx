'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import './diagnostico.css'

const WPP = 'https://wa.me/5527997341557'

const SEG_LABELS = {
  alimentacao: 'Restaurante/Alimentação',
  beleza: 'Beleza/Estética',
  saude: 'Saúde/Bem-estar',
  varejo: 'Varejo/Loja',
  servicos: 'Serviços Profissionais',
  construcao: 'Construção/Reformas',
  educacao: 'Educação/Cursos',
  imobiliaria: 'Imobiliária',
  outro: 'Outro',
}

function phoneMask(v) {
  const d = v.replace(/\D/g, '')
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

export default function DiagnosticoPage() {
  const [formData, setFormData] = useState({ name: '', phone: '', segment: '' })
  const [formState, setFormState] = useState('idle') // 'idle' | 'success'
  const [wppLink, setWppLink] = useState(WPP)
  const [bottomData, setBottomData] = useState({ name: '', phone: '' })
  const [bottomDone, setBottomDone] = useState(false)
  const formRef = useRef(null)

  function scrollToForm(e) {
    e.preventDefault()
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handlePhoneChange(e) {
    setFormData(p => ({ ...p, phone: phoneMask(e.target.value) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { name, phone, segment } = formData
    const segLabel = SEG_LABELS[segment] || segment

    await supabase.from('leads').insert({ name, phone, segment })

    const msg = encodeURIComponent(
      `Olá! Me chamo ${name} e acabei de solicitar o diagnóstico gratuito de presença digital pelo site da BBold. Meu negócio é do segmento de ${segLabel}. Aguardo o contato! 😊`
    )
    setWppLink(`${WPP}?text=${msg}`)
    setFormState('success')
  }

  function handleBottomSubmit(e) {
    e.preventDefault()
    const { name } = bottomData
    const msg = encodeURIComponent(`Olá! Me chamo ${name} e quero o diagnóstico gratuito de presença digital da BBold!`)
    window.open(`${WPP}?text=${msg}`, '_blank')
    setBottomDone(true)
  }

  return (
    <div className="dg">

      {/* NAV */}
      <nav className="dg-nav">
        <a href="#" className="dg-nav__logo">B<span>B</span>OLD</a>
        <button className="dg-nav__cta" onClick={scrollToForm}>Quero o diagnóstico</button>
      </nav>

      {/* HERO */}
      <section className="dg-hero">
        <div className="dg-hero__left">
          <div className="dg-hero__badge">100% Gratuito · Sem Compromisso</div>
          <h1 className="dg-hero__h1">
            SEU NEGÓCIO<br/>ESTÁ PERDENDO<br/>CLIENTES
            <em><br/>SEM PERCEBER.</em>
          </h1>
          <p className="dg-hero__sub">
            A BBold analisa sua presença digital — Instagram, site e Google — e te mostra <strong>exatamente o que está te custando clientes agora.</strong> Grátis, direto e sem enrolação.
          </p>

          <div className="dg-hero__proof">
            <div className="dg-proof-item"><div className="dg-proof-item__dot" />Mais de 15 anos de experiência</div>
            <div className="dg-proof-item"><div className="dg-proof-item__dot" />Atendemos todo o Brasil</div>
            <div className="dg-proof-item"><div className="dg-proof-item__dot" />Sem compromisso</div>
          </div>

          <div className="dg-hero__logos">
            <span>Plataformas:</span>
            <div className="dg-platform-pill">Instagram</div>
            <div className="dg-platform-pill">Google</div>
            <div className="dg-platform-pill">Site</div>
            <div className="dg-platform-pill">Meta Ads</div>
          </div>
        </div>

        {/* FORM CARD */}
        <div className="dg-form-card" id="form" ref={formRef}>
          {formState === 'idle' ? (
            <>
              <div className="dg-form-card__title">DIAGNÓSTICO<br/><em>GRATUITO</em></div>
              <p className="dg-form-card__sub">Preencha abaixo. Vamos analisar a sua presença digital e entrar em contato pelo WhatsApp com os resultados.</p>

              <form onSubmit={handleSubmit}>
                <div className="dg-form-group">
                  <label>Seu nome</label>
                  <input
                    type="text"
                    placeholder="Como você se chama?"
                    required
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="dg-form-group">
                  <label>WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    required
                    value={formData.phone}
                    onChange={handlePhoneChange}
                  />
                </div>
                <div className="dg-form-group">
                  <label>Segmento do negócio</label>
                  <select
                    required
                    value={formData.segment}
                    onChange={e => setFormData(p => ({ ...p, segment: e.target.value }))}
                  >
                    <option value="" disabled>Qual é o seu negócio?</option>
                    <option value="alimentacao">Restaurante / Alimentação</option>
                    <option value="beleza">Beleza / Estética</option>
                    <option value="saude">Saúde / Bem-estar</option>
                    <option value="varejo">Varejo / Loja</option>
                    <option value="servicos">Serviços Profissionais</option>
                    <option value="construcao">Construção / Reformas</option>
                    <option value="educacao">Educação / Cursos</option>
                    <option value="imobiliaria">Imobiliária</option>
                    <option value="outro">Outro segmento</option>
                  </select>
                </div>
                <button type="submit" className="dg-form-btn">QUERO MEU DIAGNÓSTICO GRÁTIS →</button>
              </form>
              <p className="dg-form-note">🔒 Seus dados não serão compartilhados. Entramos em contato em até 24h pelo WhatsApp.</p>
            </>
          ) : (
            <div className="dg-success">
              <div className="dg-success__icon">🎯</div>
              <div className="dg-success__title">RECEBIDO<br/><em>COM SUCESSO!</em></div>
              <p className="dg-success__text">Vamos analisar sua presença digital e entrar em contato pelo WhatsApp em até 24 horas com os resultados. Enquanto isso, você pode nos chamar diretamente:</p>
              <a className="dg-wpp-btn" href={wppLink} target="_blank" rel="noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.876L0 24l6.327-1.504A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.028-1.38l-.36-.214-3.753.892.933-3.648-.234-.374A9.818 9.818 0 1112 21.818z"/>
                </svg>
                Falar no WhatsApp agora
              </a>
            </div>
          )}
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="dg-section">
        <div className="dg-section__label">O que você vai receber</div>
        <h2 className="dg-section__h2">UMA ANÁLISE<br/><em>REAL E HONESTA</em></h2>
        <p className="dg-section__sub">Não é um relatório genérico. É uma análise específica do seu negócio — com os pontos exatos que estão te custando clientes.</p>

        <div className="dg-wyg-grid">
          <div className="dg-wyg-card">
            <div className="dg-wyg-card__num">01 · INSTAGRAM</div>
            <div className="dg-wyg-card__title">Análise do seu perfil</div>
            <div className="dg-wyg-card__text">Bio, consistência de conteúdo, posicionamento visual, frequência de posts e o que está impedindo o crescimento orgânico.</div>
          </div>
          <div className="dg-wyg-card">
            <div className="dg-wyg-card__num">02 · SITE</div>
            <div className="dg-wyg-card__title">O que seu site comunica</div>
            <div className="dg-wyg-card__text">Clareza da mensagem, hierarquia visual, velocidade, chamada para ação e se está convertendo visitas em contatos.</div>
          </div>
          <div className="dg-wyg-card">
            <div className="dg-wyg-card__num">03 · GOOGLE</div>
            <div className="dg-wyg-card__title">Como você aparece nas buscas</div>
            <div className="dg-wyg-card__text">Google Meu Negócio, presença nas buscas locais, avaliações e se você está aparecendo antes do concorrente.</div>
          </div>
          <div className="dg-wyg-card">
            <div className="dg-wyg-card__num">04 · DIAGNÓSTICO</div>
            <div className="dg-wyg-card__title">Prioridades de melhoria</div>
            <div className="dg-wyg-card__text">Os 3 a 5 pontos críticos do seu negócio, em ordem de impacto. Você sai da conversa sabendo exatamente o que fazer primeiro.</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <div className="dg-hiw-wrap">
        <div className="dg-hiw-inner">
          <div className="dg-section__label">Como funciona</div>
          <h2 className="dg-section__h2">SIMPLES,<br/><em>DIRETO E RÁPIDO.</em></h2>

          <div className="dg-hiw-steps">
            <div>
              <div className="dg-hiw-step__num">01</div>
              <div className="dg-hiw-step__tag">Você faz</div>
              <div className="dg-hiw-step__title">Preenche o formulário</div>
              <div className="dg-hiw-step__text">Só nome, WhatsApp e segmento do negócio. Leva menos de 1 minuto. Nada de formulário longo ou e-mail.</div>
            </div>
            <div>
              <div className="dg-hiw-step__num">02</div>
              <div className="dg-hiw-step__tag">A BBold faz</div>
              <div className="dg-hiw-step__title">Analisamos sua presença</div>
              <div className="dg-hiw-step__text">Nossa equipe analisa seu Instagram, site e Google em até 24h — com olhar estratégico de quem entende de posicionamento digital.</div>
            </div>
            <div>
              <div className="dg-hiw-step__num">03</div>
              <div className="dg-hiw-step__tag">Resultado</div>
              <div className="dg-hiw-step__title">Você recebe o diagnóstico</div>
              <div className="dg-hiw-step__text">Direto pelo WhatsApp — os pontos críticos do seu negócio digital, com clareza e sem enrolação. Depois disso, você decide o que fazer.</div>
            </div>
          </div>
        </div>
      </div>

      {/* WHO IS IT FOR */}
      <section className="dg-section">
        <div className="dg-section__label">Para quem é esse diagnóstico</div>
        <h2 className="dg-section__h2">SE VOCÊ SE IDENTIFICA<br/><em>COM ALGUM DESSES...</em></h2>
        <p className="dg-section__sub" style={{ marginBottom: 32 }}>Você está no lugar certo.</p>

        <div className="dg-for-list">
          <div className="dg-for-item">
            <div className="dg-for-item__icon">📉</div>
            <div className="dg-for-item__text"><strong>Seu Instagram está parado ou sem estratégia</strong> — você sabe que precisa postar, mas não tem tempo ou não sabe por onde começar.</div>
          </div>
          <div className="dg-for-item">
            <div className="dg-for-item__icon">🔍</div>
            <div className="dg-for-item__text"><strong>Seu negócio não aparece quando pesquisam no Google</strong> — o concorrente aparece, você não. E você nem sabe por quê.</div>
          </div>
          <div className="dg-for-item">
            <div className="dg-for-item__icon">💸</div>
            <div className="dg-for-item__text"><strong>Você já investiu em anúncios mas não teve resultado</strong> — gastou dinheiro, não gerou clientes. O problema provavelmente não era o anúncio.</div>
          </div>
          <div className="dg-for-item">
            <div className="dg-for-item__icon">🎨</div>
            <div className="dg-for-item__text"><strong>Sua identidade visual não transmite o valor do seu negócio</strong> — o serviço é bom, mas a marca não sustenta o preço que você cobra.</div>
          </div>
          <div className="dg-for-item">
            <div className="dg-for-item__icon">🚀</div>
            <div className="dg-for-item__text"><strong>Você quer crescer no digital mas não sabe por onde começar</strong> — tem vontade, mas falta direção. O diagnóstico resolve isso.</div>
          </div>
        </div>
      </section>

      {/* ABOUT BBOLD */}
      <div style={{ background: '#111111', borderTop: '1px solid rgba(240,239,232,0.08)', borderBottom: '1px solid rgba(240,239,232,0.08)' }}>
        <div className="dg-about-wrap">
          <div>
            <div className="dg-section__label" style={{ marginBottom: 16 }}>Quem vai fazer a análise</div>
            <h2 className="dg-about__h2">NÃO SOMOS UMA<br/>AGÊNCIA.<br/><em>SOMOS SEU PARCEIRO<br/>DIGITAL.</em></h2>
            <p className="dg-about__text">A BBold tem mais de 15 anos de experiência em design, marketing digital e desenvolvimento web. Não terceirizamos — tudo é feito pelo mesmo profissional, com a mesma visão estratégica do início ao fim.</p>
            <div className="dg-about__stats">
              <div className="dg-stat-box"><div className="dg-stat-box__val">15+</div><div className="dg-stat-box__label">Anos de experiência em design e digital</div></div>
              <div className="dg-stat-box"><div className="dg-stat-box__val">🇧🇷</div><div className="dg-stat-box__label">Atendemos empresas em todo o Brasil</div></div>
              <div className="dg-stat-box"><div className="dg-stat-box__val">360°</div><div className="dg-stat-box__label">Assessoria completa: identidade, conteúdo, tráfego e site</div></div>
              <div className="dg-stat-box"><div className="dg-stat-box__val">24h</div><div className="dg-stat-box__label">Prazo máximo para retorno do diagnóstico</div></div>
            </div>
          </div>
          <div>
            <div className="dg-section__label" style={{ marginBottom: 16 }}>O que a BBold oferece</div>
            <div className="dg-about__services">
              <div className="dg-svc-row"><div className="dg-svc-row__dot"/><div className="dg-svc-row__name">Identidade Visual + Fundação Digital</div><div className="dg-svc-row__price">A partir de R$1.500</div></div>
              <div className="dg-svc-row"><div className="dg-svc-row__dot"/><div className="dg-svc-row__name">Gestão de Redes Sociais</div><div className="dg-svc-row__price">R$800/mês</div></div>
              <div className="dg-svc-row"><div className="dg-svc-row__dot"/><div className="dg-svc-row__name">Presença Digital Completa</div><div className="dg-svc-row__price">R$1.400/mês</div></div>
              <div className="dg-svc-row"><div className="dg-svc-row__dot"/><div className="dg-svc-row__name">Tráfego Pago (Meta + Google)</div><div className="dg-svc-row__price">A partir de R$900/mês</div></div>
              <div className="dg-svc-row"><div className="dg-svc-row__dot"/><div className="dg-svc-row__name">Full Service BBold</div><div className="dg-svc-row__price">A partir de R$3.500/mês</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div className="dg-bottom-cta">
        <h2>PRONTO PARA<br/>APARECER<br/><em>DE VERDADE?</em></h2>
        <p>Preencha abaixo e receba sua análise de presença digital — gratuita, objetiva e sem compromisso.</p>
        {bottomDone ? (
          <p style={{ color: 'rgba(0,0,0,0.7)', fontWeight: 700, fontSize: 16, padding: '10px 0' }}>✓ Redirecionando para o WhatsApp...</p>
        ) : (
          <form className="dg-bottom-form" onSubmit={handleBottomSubmit}>
            <input
              type="text"
              placeholder="Seu nome"
              required
              value={bottomData.name}
              onChange={e => setBottomData(p => ({ ...p, name: e.target.value }))}
            />
            <input
              type="tel"
              placeholder="WhatsApp"
              required
              value={bottomData.phone}
              onChange={e => setBottomData(p => ({ ...p, phone: phoneMask(e.target.value) }))}
            />
            <button type="submit" className="dg-bottom-form-btn">QUERO →</button>
          </form>
        )}
        <p className="dg-bottom-note">🔒 Sem spam. Entramos em contato em até 24h.</p>
      </div>

      {/* FOOTER */}
      <footer className="dg-footer">
        <div className="dg-footer__logo">B<span>B</span>OLD</div>
        <div className="dg-footer__text">@agencia.bbold · (27) 9 9734-1557 · Todo o Brasil</div>
        <div className="dg-footer__links">
          <a href="https://agenciabbold.com.br" target="_blank" rel="noreferrer">Site</a>
          <a href="https://instagram.com/agencia.bbold" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://wa.me/5527997341557" target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
      </footer>

    </div>
  )
}
