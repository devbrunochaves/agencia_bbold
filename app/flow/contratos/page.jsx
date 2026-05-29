'use client'

import { useState, useEffect, useRef } from 'react'
import { jsPDF } from 'jspdf'
import { supabase } from '@/lib/supabase'
import FlowHeader from '@/components/flow/FlowHeader'
import Icon from '@/components/flow/FlowIcons'

// ─── BBOLD Fixed Data ─────────────────────────────────────────────────────────

const BBOLD = {
  empresa:  '59.676.407 BRUNO CHAVES DOS SANTOS',
  cnpj:     '59.676.407/0001-86',
  endereco: 'Rua Basílio da Gama, 430, Bloco 1A, Apto 1206, Jardim Limoeiro, Serra/ES',
  email:    'brunochavesdev@gmail.com',
  telefone: '(27) 9734-1557',
}

// ─── Service Catalog ──────────────────────────────────────────────────────────

const SERVICE_CATALOG = [
  {
    id: 'gestao_redes',
    label: 'Gestão de Redes Sociais',
    scope: 'Planejamento estratégico, criação e publicação de conteúdo para redes sociais (Instagram, Facebook e demais plataformas acordadas), incluindo criação de artes e legendas, calendário editorial mensal, monitoramento de comentários e relatório de desempenho.',
    limit: 'Não inclui produção de vídeos longos, tráfego pago, fotografia ou filmagem in loco.',
  },
  {
    id: 'trafego_pago',
    label: 'Tráfego Pago (Meta Ads / Google Ads)',
    scope: 'Criação, otimização e gestão de campanhas pagas nas plataformas Meta Ads (Facebook/Instagram) e/ou Google Ads, incluindo configuração de públicos, criação de anúncios, otimização contínua e relatório mensal de performance.',
    limit: 'O valor do investimento em mídia (verba de anúncios) não está incluído na taxa de gestão e é de responsabilidade exclusiva da CONTRATANTE.',
  },
  {
    id: 'identidade_visual',
    label: 'Identidade Visual',
    scope: 'Criação de identidade visual completa incluindo logotipo (com variações), paleta de cores, tipografia, papelaria básica e manual de marca em PDF.',
    limit: 'Inclui até 3 conceitos iniciais e 2 rodadas de revisão. Não inclui animações, embalagens ou sinalização física.',
  },
  {
    id: 'criacao_site',
    label: 'Criação de Site',
    scope: 'Desenvolvimento de site institucional/landing page responsivo, incluindo design personalizado, programação, hospedagem no primeiro ano, configuração de domínio e integração com Google Analytics.',
    limit: 'Não inclui e-commerce, sistema de pagamento ou aplicativo mobile.',
  },
  {
    id: 'seo',
    label: 'SEO (Otimização para Mecanismos de Busca)',
    scope: 'Otimização do site para mecanismos de busca incluindo auditoria técnica, otimização on-page, criação de conteúdo para blog, link building e relatório mensal de posicionamento.',
    limit: 'Resultados dependem de fatores externos e não há garantia de posicionamento específico. Prazo mínimo estimado para resultados expressivos: 90 dias.',
  },
  {
    id: 'producao_conteudo',
    label: 'Produção de Conteúdo',
    scope: 'Criação de conteúdo textual e visual para uso digital, incluindo posts para redes sociais, textos para site/blog e materiais digitais conforme calendário acordado.',
    limit: 'Não inclui produção de vídeos longos ou fotografia profissional.',
  },
  {
    id: 'email_marketing',
    label: 'E-mail Marketing',
    scope: 'Criação e envio de campanhas de e-mail marketing, incluindo design dos e-mails, copywriting, segmentação de lista, configuração de automações básicas e relatório de métricas (abertura, cliques, conversões).',
    limit: 'A lista de contatos deve ser fornecida pela CONTRATANTE. Não inclui criação ou aquisição de listas.',
  },
  {
    id: 'consultoria',
    label: 'Consultoria Digital',
    scope: 'Sessões de consultoria estratégica em marketing digital por videoconferência, incluindo diagnóstico da presença digital, plano de ação e acompanhamento de métricas conforme agenda acordada.',
    limit: 'Não inclui execução direta das ações recomendadas, exceto se contratadas em pacote separado.',
  },
]

const PAYMENT_METHODS = ['Pix', 'Cartão de Crédito', 'Boleto']

const STATUS_MAP = {
  ativo:     { bg: 'rgba(34,197,94,0.15)',   color: '#22C55E', border: 'rgba(34,197,94,0.3)',   label: 'Ativo'     },
  encerrado: { bg: 'rgba(113,113,122,0.15)', color: '#A1A1AA', border: 'rgba(113,113,122,0.3)', label: 'Encerrado' },
  cancelado: { bg: 'rgba(239,68,68,0.15)',   color: '#EF4444', border: 'rgba(239,68,68,0.3)',   label: 'Cancelado' },
  renovado:  { bg: 'rgba(59,130,246,0.15)',  color: '#3B82F6', border: 'rgba(59,130,246,0.3)',  label: 'Renovado'  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(v) {
  return parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function calcEnd(startIso, months) {
  if (!startIso || !months) return '—'
  const d = new Date(startIso + 'T12:00:00')
  d.setMonth(d.getMonth() + parseInt(months, 10))
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function todaySlash() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function todayLong() {
  const d = new Date()
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`
}

function makeContractNum() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*9000)+1000)}`
}

const NUM_WORDS = ['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez',
  'onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove','vinte',
  'vinte e um','vinte e dois','vinte e três','vinte e quatro','vinte e cinco',
  'vinte e seis','vinte e sete','vinte e oito','vinte e nove','trinta']

function numWords(n) { return NUM_WORDS[parseInt(n,10)] || String(n) }

function maskDoc(v) {
  const d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 11) {
    if (d.length > 9) return d.slice(0,3)+'.'+d.slice(3,6)+'.'+d.slice(6,9)+'-'+d.slice(9)
    if (d.length > 6) return d.slice(0,3)+'.'+d.slice(3,6)+'.'+d.slice(6)
    if (d.length > 3) return d.slice(0,3)+'.'+d.slice(3)
    return d
  }
  if (d.length > 12) return d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5,8)+'/'+d.slice(8,12)+'-'+d.slice(12)
  if (d.length > 8)  return d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5,8)+'/'+d.slice(8)
  if (d.length > 5)  return d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5)
  if (d.length > 2)  return d.slice(0,2)+'.'+d.slice(2)
  return d
}

function maskPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2)  return '(' + d
  if (d.length <= 6)  return '(' + d.slice(0,2) + ') ' + d.slice(2)
  if (d.length <= 10) return '(' + d.slice(0,2) + ') ' + d.slice(2,6) + '-' + d.slice(6)
  return '(' + d.slice(0,2) + ') ' + d.slice(2,7) + '-' + d.slice(7)
}

// ─── PDF Builder ──────────────────────────────────────────────────────────────

class PDF {
  constructor() {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4' })
    this.W = 210; this.H = 297
    this.L = 22; this.R = 22; this.T = 22; this.B = 20
    this.cW = this.W - this.L - this.R
    this.y = this.T
    this._pages = 1
  }

  guard(need = 10) {
    if (this.y + need > this.H - this.B) { this.doc.addPage(); this.y = this.T; this._pages++ }
  }

  sp(mm = 4) { this.y += mm }

  hr(gray = 210) {
    this.guard(6)
    this.doc.setDrawColor(gray, gray, gray)
    this.doc.setLineWidth(0.25)
    this.doc.line(this.L, this.y, this.W - this.R, this.y)
    this.y += 5
  }

  // Section header with dark bar
  sec(num, title) {
    this.guard(16)
    this.sp(3)
    this.doc.setFillColor(30, 30, 30)
    this.doc.rect(this.L, this.y - 3, this.cW, 9, 'F')
    this.doc.setFontSize(8.5)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(255, 210, 46)
    this.doc.text(`${num}`, this.L + 4, this.y + 2.5)
    this.doc.setTextColor(255, 255, 255)
    this.doc.text(`– ${title}`, this.L + 4 + this.doc.getTextWidth(`${num}`) + 1, this.y + 2.5)
    this.y += 12
  }

  // Body text
  p(text, indent = 0, size = 9.5) {
    if (!text) return
    this.doc.setFontSize(size)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(50, 50, 50)
    const lines = this.doc.splitTextToSize(String(text), this.cW - indent)
    for (const l of lines) {
      this.guard(6)
      this.doc.text(l, this.L + indent, this.y)
      this.y += 5.2
    }
  }

  bold(text, indent = 0, size = 9.5) {
    if (!text) return
    this.doc.setFontSize(size)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(25, 25, 25)
    const lines = this.doc.splitTextToSize(String(text), this.cW - indent)
    for (const l of lines) {
      this.guard(6)
      this.doc.text(l, this.L + indent, this.y)
      this.y += 5.2
    }
    this.doc.setFont('helvetica', 'normal')
  }

  // Key: value inline
  kv(label, value, indent = 4) {
    this.guard(7)
    this.doc.setFontSize(9.5)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(25, 25, 25)
    this.doc.text(label + ' ', this.L + indent, this.y)
    const lw = this.doc.getTextWidth(label + ' ')
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(60, 60, 60)
    const vlines = this.doc.splitTextToSize(String(value || '—'), this.cW - indent - lw - 2)
    this.doc.text(vlines[0], this.L + indent + lw, this.y)
    this.y += 5.2
    for (let i = 1; i < vlines.length; i++) {
      this.guard(6); this.doc.text(vlines[i], this.L + indent + lw, this.y); this.y += 5.2
    }
  }

  // Bullet item
  bullet(text, indent = 6) {
    this.guard(7)
    this.doc.setFontSize(9.5)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(50, 50, 50)
    this.doc.text('•', this.L + indent - 3.5, this.y)
    const lines = this.doc.splitTextToSize(text, this.cW - indent)
    for (const l of lines) { this.guard(6); this.doc.text(l, this.L + indent, this.y); this.y += 5.2 }
  }

  // Numbered sub-item: I – text
  sub(letter, text) {
    this.guard(7)
    this.doc.setFontSize(9.5)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(50, 50, 50)
    const prefix = `${letter} –`
    this.doc.text(prefix, this.L + 4, this.y)
    const pw = this.doc.getTextWidth(prefix + ' ')
    const lines = this.doc.splitTextToSize(text, this.cW - 4 - pw)
    this.doc.text(lines[0], this.L + 4 + pw, this.y)
    this.y += 5.2
    for (let i = 1; i < lines.length; i++) {
      this.guard(6); this.doc.text(lines[i], this.L + 4 + pw, this.y); this.y += 5.2
    }
  }

  // Paragraph header: "Parágrafo Xº –"
  par(label, text) {
    this.sp(2)
    this.guard(10)
    this.doc.setFontSize(9.5)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(30, 30, 30)
    const prefix = `${label} – `
    this.doc.text(prefix, this.L + 4, this.y)
    const pw = this.doc.getTextWidth(prefix)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(50, 50, 50)
    const lines = this.doc.splitTextToSize(text, this.cW - 4 - pw)
    this.doc.text(lines[0], this.L + 4 + pw, this.y)
    this.y += 5.2
    for (let i = 1; i < lines.length; i++) { this.guard(6); this.doc.text(lines[i], this.L + 4, this.y); this.y += 5.2 }
  }

  // Page footers (called last)
  footers(num) {
    const total = this.doc.getNumberOfPages()
    for (let i = 1; i <= total; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(7.5)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(160, 160, 160)
      this.doc.setDrawColor(210, 210, 210)
      this.doc.setLineWidth(0.2)
      this.doc.line(this.L, this.H - 13, this.W - this.R, this.H - 13)
      this.doc.text(`Contrato Nº ${num}  ·  BBold Agência Digital  ·  ${BBOLD.cnpj}`, this.L, this.H - 8)
      this.doc.text(`Página ${i} / ${total}`, this.W - this.R, this.H - 8, { align: 'right' })
    }
  }

  save(fn) { this.doc.save(fn) }
}

// ─── PDF Generation ───────────────────────────────────────────────────────────

function buildPDF(data, signMode = false) {
  const pb     = new PDF()
  const num    = makeContractNum()
  const svcIds = Array.isArray(data.selected_services) ? data.selected_services : []
  const svcs   = SERVICE_CATALOG.filter(s => svcIds.includes(s.id))
  const pm     = data.payment_method || 'Pix'
  const revs   = parseInt(data.revisions, 10) || 2
  const d      = pb.doc

  // ── BBOLD header bar ──────────────────────────────────────────────────────
  d.setFillColor(18, 18, 18)
  d.rect(0, 0, pb.W, 28, 'F')
  d.setFillColor(255, 210, 46)
  d.rect(0, 0, 5, 28, 'F')
  d.setFontSize(16); d.setFont('helvetica', 'bold'); d.setTextColor(255, 210, 46)
  d.text('BBold', pb.L + 4, 11)
  d.setFontSize(8); d.setFont('helvetica', 'normal'); d.setTextColor(160, 160, 160)
  d.text('Agência Digital de Marketing', pb.L + 4, 18)
  d.setFontSize(7); d.setTextColor(100, 100, 100)
  d.text(`${BBOLD.cnpj}   ·   ${BBOLD.email}   ·   ${BBOLD.telefone}`, pb.L + 4, 24)
  d.setFontSize(8); d.setFont('helvetica', 'bold'); d.setTextColor(120, 120, 120)
  d.text(`CONTRATO Nº ${num}`, pb.W - pb.R, 12, { align: 'right' })
  d.setFontSize(7.5); d.setFont('helvetica', 'normal'); d.setTextColor(100, 100, 100)
  d.text(todaySlash(), pb.W - pb.R, 20, { align: 'right' })

  pb.y = 44

  // ── Title ─────────────────────────────────────────────────────────────────
  d.setFontSize(13); d.setFont('helvetica', 'bold'); d.setTextColor(20, 20, 20)
  d.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL', pb.W / 2, pb.y, { align: 'center' })
  pb.y += 9
  d.setFontSize(9); d.setFont('helvetica', 'normal'); d.setTextColor(100, 100, 100)
  d.text(`Contrato Nº ${num}`, pb.W / 2, pb.y, { align: 'center' })
  pb.y += 12

  pb.p('Pelo presente instrumento particular, de um lado:')
  pb.sp(8)

  // ── CONTRATADA ────────────────────────────────────────────────────────────
  d.setFontSize(10); d.setFont('helvetica', 'bold'); d.setTextColor(20, 20, 20)
  d.text('CONTRATADA', pb.L, pb.y)
  pb.y += 1.5
  d.setDrawColor(200, 200, 200); d.setLineWidth(0.4)
  d.line(pb.L, pb.y, pb.L + 46, pb.y)
  pb.y += 7
  pb.kv('Empresa:', BBOLD.empresa)
  pb.kv('CNPJ:', BBOLD.cnpj)
  pb.kv('Endereço:', BBOLD.endereco + ', CEP 29164-083')
  pb.kv('E-mail:', BBOLD.email)
  pb.kv('Telefone:', BBOLD.telefone)
  pb.sp(4)
  pb.p('doravante denominada simplesmente CONTRATADA.')
  pb.sp(8)
  pb.p('E de outro lado:')
  pb.sp(8)

  // ── CONTRATANTE ───────────────────────────────────────────────────────────
  d.setFontSize(10); d.setFont('helvetica', 'bold'); d.setTextColor(20, 20, 20)
  d.text('CONTRATANTE', pb.L, pb.y)
  pb.y += 1.5
  d.setDrawColor(200, 200, 200); d.setLineWidth(0.4)
  d.line(pb.L, pb.y, pb.L + 51, pb.y)
  pb.y += 7
  pb.kv('Nome / Razão Social:', data.client_name)
  if (data.client_doc)         pb.kv('CPF/CNPJ:', data.client_doc)
  if (data.client_responsible) pb.kv('Representante:', data.client_responsible)
  if (data.client_email)       pb.kv('E-mail:', data.client_email)
  if (data.client_phone)       pb.kv('Telefone:', data.client_phone)
  if (data.client_address)     pb.kv('Endereço:', data.client_address)
  pb.sp(4)
  pb.p('doravante denominado simplesmente CONTRATANTE.')
  pb.sp(6)
  pb.p('As partes acima identificadas têm entre si justo e contratado o presente Contrato de Prestação de Serviços de Marketing Digital, mediante as cláusulas e condições abaixo.')
  pb.hr()

  // ── CLÁUSULA 1 ────────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 1', 'DO OBJETO')
  pb.sp(3)
  pb.p('O presente contrato tem como objeto a prestação de serviços de marketing digital pela CONTRATADA à CONTRATANTE, conforme escopo contratado.')
  pb.sp(4)
  pb.bold('Serviços inclusos:', 4)
  pb.sp(2)
  if (svcs.length > 0) {
    for (const s of svcs) pb.bullet(s.label)
  } else if (data.services && data.services.trim()) {
    pb.p(data.services, 6)
  } else {
    pb.p('Conforme acordado entre as partes.', 6)
  }
  pb.sp(3)
  pb.par('Parágrafo único', 'Qualquer atividade não expressamente prevista neste contrato será considerada serviço adicional e poderá ser objeto de orçamento complementar.')
  pb.hr()

  // ── CLÁUSULA 2 ────────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 2', 'DO ESCOPO DOS SERVIÇOS')
  pb.sp(3)
  pb.p('A CONTRATADA executará os serviços contratados conforme o plano selecionado.')
  pb.sp(4)
  pb.bold('Entregas previstas:', 4)
  pb.sp(2)
  if (svcs.length > 0) {
    for (const s of svcs) {
      pb.guard(16)
      pb.doc.setFontSize(9.5); pb.doc.setFont('helvetica', 'bold'); pb.doc.setTextColor(20, 20, 20)
      pb.doc.text('» ' + s.label, pb.L + 6, pb.y); pb.y += 5.5
      pb.p(s.scope, 10); pb.sp(2)
    }
  }
  if (data.services && data.services.trim()) {
    pb.sp(2); pb.bold('Entregas adicionais:', 4); pb.sp(2); pb.p(data.services, 6)
  }
  pb.sp(4)
  pb.bold('Não estão inclusos neste contrato:', 4)
  pb.sp(2)
  const excl = [
    ...(!svcIds.includes('trafego_pago') ? ['Gestão de tráfego pago (quando não contratado)'] : []),
    ...(!svcIds.includes('criacao_site') ? ['Desenvolvimento de websites (quando não contratado)'] : []),
    'Produção audiovisual profissional externa',
    'Impressos e materiais gráficos físicos',
    'Cobertura presencial extraordinária',
    'Serviços não descritos neste contrato',
  ]
  for (const item of excl) pb.bullet(item)
  pb.hr()

  // ── CLÁUSULA 3 ────────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 3', 'DO PRAZO E VIGÊNCIA')
  pb.sp(3)
  pb.p(`O presente contrato terá vigência inicial de ${data.duration_months} (${numWords(data.duration_months)}) meses, iniciando-se em ${fmtDate(data.start_date)}.`)
  pb.par('Parágrafo Primeiro', 'As partes reconhecem que os serviços de marketing digital demandam período mínimo de implementação, análise e otimização, razão pela qual o prazo mínimo recomendado é de 03 (três) meses.')
  pb.par('Parágrafo Segundo', 'Após o período inicial contratado, o contrato poderá ser renovado mediante comum acordo entre as partes.')
  pb.hr()

  // ── CLÁUSULA 4 ────────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 4', 'DOS VALORES E FORMA DE PAGAMENTO')
  pb.sp(3)
  pb.p('Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor de:')
  pb.sp(5)
  d.setFontSize(18); d.setFont('helvetica', 'bold'); d.setTextColor(20, 20, 20)
  d.text(`R$ ${fmtCurrency(data.monthly_value)}/mês`, pb.W / 2, pb.y, { align: 'center' })
  pb.y += 12
  pb.p(`Vencimento: dia ${data.due_day} (${numWords(data.due_day)}) de cada mês.`)
  pb.sp(2)
  pb.p(`Forma de pagamento: ${pm}.`)
  pb.par('Parágrafo Primeiro', 'Os pagamentos deverão ser efetuados dentro do prazo estipulado.')
  pb.par('Parágrafo Segundo', 'A CONTRATADA poderá emitir nota fiscal quando aplicável.')
  pb.hr()

  // ── CLÁUSULA 5 ────────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 5', 'DA INADIMPLÊNCIA')
  pb.sp(3)
  pb.p('O atraso superior a 05 (cinco) dias poderá ocasionar suspensão temporária dos serviços até regularização financeira.')
  pb.sp(3)
  pb.p('O atraso superior a 30 (trinta) dias poderá resultar na rescisão contratual por iniciativa da CONTRATADA.')
  pb.hr()

  // ── CLÁUSULA 6 ────────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 6', 'DAS OBRIGAÇÕES DA CONTRATANTE')
  pb.sp(3)
  pb.p('Constituem obrigações da CONTRATANTE:')
  pb.sp(2)
  pb.sub('I',   'Fornecer informações necessárias à execução dos serviços;')
  pb.sub('II',  'Disponibilizar acessos às plataformas quando necessário;')
  pb.sub('III', 'Fornecer materiais institucionais, identidade visual e demais conteúdos solicitados;')
  pb.sub('IV',  'Aprovar ou solicitar ajustes nos materiais enviados dentro dos prazos estabelecidos;')
  pb.sub('V',   'Efetuar os pagamentos nas datas acordadas.')
  pb.hr()

  // ── CLÁUSULA 7 ────────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 7', 'DAS OBRIGAÇÕES DA CONTRATADA')
  pb.sp(3)
  pb.p('Constituem obrigações da CONTRATADA:')
  pb.sp(2)
  pb.sub('I',   'Executar os serviços contratados com zelo e profissionalismo;')
  pb.sub('II',  'Cumprir os prazos acordados;')
  pb.sub('III', 'Manter comunicação ativa com a CONTRATANTE;')
  pb.sub('IV',  'Desenvolver estratégias compatíveis com os objetivos apresentados;')
  pb.sub('V',   'Preservar o sigilo das informações recebidas.')
  pb.hr()

  // ── CLÁUSULA 8 ────────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 8', 'DO PROCESSO DE APROVAÇÃO')
  pb.sp(3)
  pb.p('Todo material produzido será enviado para aprovação da CONTRATANTE.')
  pb.par('Parágrafo Primeiro', 'A CONTRATANTE terá prazo de até 03 (três) dias úteis para aprovar ou solicitar ajustes.')
  pb.par('Parágrafo Segundo', 'A ausência de manifestação dentro do prazo poderá ser considerada aprovação tácita para não comprometer o cronograma.')
  pb.hr()

  // ── CLÁUSULA 9 ────────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 9', 'DAS REVISÕES E ALTERAÇÕES')
  pb.sp(3)
  pb.p(`O contrato contempla até ${revs} (${numWords(revs)}) revisões por material.`)
  pb.sp(3)
  pb.p('Solicitações que alterem substancialmente o briefing inicial ou excedam a quantidade prevista poderão ser orçadas separadamente.')
  pb.hr()

  // ── CLÁUSULA 10 ───────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 10', 'DA PROPRIEDADE INTELECTUAL')
  pb.sp(3)
  pb.p('Após a quitação integral dos pagamentos referentes aos serviços prestados, os materiais produzidos para a CONTRATANTE passarão a ser de sua propriedade.')
  pb.par('Parágrafo Primeiro', 'Permanecem de propriedade exclusiva da CONTRATADA: metodologias, processos internos, estruturas estratégicas, templates, frameworks e ferramentas próprias.')
  pb.par('Parágrafo Segundo', 'A contratação dos serviços não implica cessão de propriedade intelectual sobre métodos e processos internos da CONTRATADA.')
  pb.hr()

  // ── CLÁUSULA 11 ───────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 11', 'DA CONFIDENCIALIDADE')
  pb.sp(3)
  pb.p('As partes comprometem-se a manter sigilo sobre quaisquer informações confidenciais compartilhadas durante a vigência deste contrato.')
  pb.sp(3)
  pb.p('O dever de confidencialidade permanecerá válido mesmo após o encerramento contratual.')
  pb.hr()

  // ── CLÁUSULA 12 ───────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 12', 'DA LGPD')
  pb.sp(3)
  pb.p('As partes comprometem-se a cumprir a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), adotando medidas adequadas para proteção dos dados eventualmente compartilhados.')
  pb.hr()

  // ── CLÁUSULA 13 ───────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 13', 'DO USO DE PORTFÓLIO')
  pb.sp(3)
  pb.p('A CONTRATANTE autoriza a CONTRATADA a utilizar os materiais desenvolvidos para fins de portfólio, divulgação institucional, apresentação comercial e marketing próprio da BBOLD.')
  pb.sp(3)
  pb.p('Caso exista necessidade de confidencialidade específica, deverá haver manifestação formal da CONTRATANTE.')
  pb.hr()

  // ── CLÁUSULA 14 ───────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 14', 'DA RESCISÃO')
  pb.sp(3)
  pb.p('O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio mínimo de 30 (trinta) dias.')
  pb.par('Parágrafo Primeiro', 'Não haverá multa rescisória.')
  pb.par('Parágrafo Segundo', 'Durante o período de aviso prévio, a CONTRATADA realizará a conclusão das atividades em andamento e a transferência dos acessos necessários.')
  pb.par('Parágrafo Terceiro', 'Os valores já vencidos permanecerão devidos.')
  pb.hr()

  // ── CLÁUSULA 15 ───────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 15', 'DAS DISPOSIÇÕES GERAIS')
  pb.sp(3)
  pb.p('Nenhuma alteração deste contrato terá validade sem registro formal entre as partes.')
  pb.sp(3)
  pb.p('A eventual tolerância de qualquer descumprimento contratual não implicará renúncia de direitos.')
  pb.sp(3)
  pb.p('Este contrato substitui quaisquer entendimentos anteriores relacionados ao objeto contratado.')
  pb.hr()

  // ── CLÁUSULA 16 ───────────────────────────────────────────────────────────
  pb.sec('CLÁUSULA 16', 'DO FORO')
  pb.sp(3)
  pb.p('Fica eleito o foro da Comarca da Serra, Estado do Espírito Santo, para dirimir quaisquer controvérsias decorrentes deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.')
  pb.sp(4)
  pb.p('E por estarem de pleno acordo, firmam o presente instrumento.')

  if (data.observations && data.observations.trim()) {
    pb.hr()
    pb.sec('ANEXO', 'OBSERVAÇÕES E DISPOSIÇÕES ESPECÍFICAS')
    pb.sp(3)
    pb.p(data.observations)
  }

  // ── SIGNATURES ────────────────────────────────────────────────────────────
  pb.guard(signMode ? 85 : 60)
  pb.sp(10)
  pb.hr(180)

  const d2 = pb.doc
  d2.setFontSize(9); d2.setFont('helvetica', 'normal'); d2.setTextColor(80, 80, 80)
  d2.text(`Serra/ES, ${todayLong()}.`, pb.L, pb.y)
  pb.y += 16

  const sigY = pb.y
  const half = pb.L + pb.cW / 2

  d2.setDrawColor(80, 80, 80); d2.setLineWidth(0.4)
  d2.line(pb.L, sigY, half - 8, sigY)
  d2.line(half + 8, sigY, pb.W - pb.R, sigY)

  d2.setFontSize(9); d2.setFont('helvetica', 'bold'); d2.setTextColor(25, 25, 25)
  d2.text('CONTRATANTE', pb.L, sigY + 6)
  d2.text('CONTRATADA', half + 8, sigY + 6)

  d2.setFont('helvetica', 'normal'); d2.setTextColor(60, 60, 60); d2.setFontSize(8.5)
  const cnL = d2.splitTextToSize(data.client_name || '', half - pb.L - 10)
  d2.text(cnL, pb.L, sigY + 12)
  if (data.client_doc) d2.text(data.client_doc, pb.L, sigY + 18)
  d2.text(BBOLD.empresa, half + 8, sigY + 12)
  d2.text(BBOLD.cnpj, half + 8, sigY + 18)
  pb.y = sigY + 26

  if (signMode) {
    pb.sp(10)
    d2.setFontSize(7.5); d2.setTextColor(100, 100, 100)
    const sL = pb.L, sR = half + 8, sY = pb.y
    d2.text('Assinatura: ________________________________', sL, sY)
    d2.text('Data: ___/___/______   CPF/CNPJ: ___________________', sL, sY + 6)
    d2.text('Assinatura: ________________________________', sR, sY)
    d2.text('Data: ___/___/______   CPF/CNPJ: ___________________', sR, sY + 6)
    pb.y += 16
    d2.setDrawColor(200, 200, 200); d2.setLineWidth(0.3)
    d2.roundedRect(pb.L, pb.y, pb.cW, 22, 2, 2, 'D')
    d2.setFontSize(7.5); d2.setFont('helvetica', 'bold'); d2.setTextColor(120, 120, 120)
    d2.text('TESTEMUNHAS', pb.L + 4, pb.y + 7)
    d2.setFont('helvetica', 'normal'); d2.setTextColor(60, 60, 60)
    d2.text('1. Nome: ________________________________  Assinatura: ___________________  CPF: _______________', pb.L + 4, pb.y + 14)
    d2.text('2. Nome: ________________________________  Assinatura: ___________________  CPF: _______________', pb.L + 4, pb.y + 20)
    pb.y += 30
    pb.sp(6)
    d2.setFillColor(245, 248, 255); d2.setDrawColor(180, 200, 255)
    d2.roundedRect(pb.L, pb.y, pb.cW, 18, 2, 2, 'FD')
    d2.setFontSize(8); d2.setFont('helvetica', 'bold'); d2.setTextColor(60, 80, 200)
    d2.text('ASSINATURA DIGITAL', pb.L + 4, pb.y + 7)
    d2.setFont('helvetica', 'normal'); d2.setTextColor(80, 80, 80)
    d2.text('Este documento pode ser assinado digitalmente via D4Sign, DocuSign ou plataforma similar.', pb.L + 4, pb.y + 13)
    d2.text('A assinatura eletrônica tem plena validade jurídica conforme Lei nº 14.063/2020.', pb.L + 4, pb.y + 18)
  }

  pb.footers(num)

  const safe = (data.client_name || 'contrato').replace(/[^\w]/g, '_').toLowerCase()
  pb.save(`contrato_${safe}_${new Date().toISOString().slice(0,10)}${signMode ? '_assinatura' : ''}.pdf`)
}

// ─── UI Styles ────────────────────────────────────────────────────────────────

const inputS = {
  width:'100%', background:'var(--f-bg)', border:'1px solid var(--f-border)',
  borderRadius:8, padding:'10px 12px', color:'var(--f-text)', fontSize:14,
  fontFamily:'inherit', outline:'none', boxSizing:'border-box', transition:'border-color .15s',
}

const labelS = {
  display:'block', fontSize:11, fontWeight:700, letterSpacing:'.07em',
  textTransform:'uppercase', color:'var(--f-muted)', marginBottom:6,
}

function Fld({ label, children, span }) {
  return (
    <div style={span ? { gridColumn:'1 / -1' } : {}}>
      <label style={labelS}>{label}</label>
      {children}
    </div>
  )
}

function SecHd({ title }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'22px 0 14px' }}>
      <div style={{ height:1, flex:1, background:'var(--f-border)' }}/>
      <span style={{ fontSize:10, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--f-muted)', whiteSpace:'nowrap' }}>{title}</span>
      <div style={{ height:1, flex:1, background:'var(--f-border)' }}/>
    </div>
  )
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

function DeleteDialog({ contract, onConfirm, onCancel }) {
  if (!contract) return null
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onCancel}>
      <div style={{ background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:18, padding:28, maxWidth:380, width:'100%', textAlign:'center' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width:52, height:52, borderRadius:14, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:'var(--f-red)' }}>
          <Icon name="trash" size={22}/>
        </div>
        <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:'0 0 8px' }}>Excluir contrato</h3>
        <p style={{ fontSize:13, color:'#A1A1AA', margin:'0 0 24px', lineHeight:1.6 }}>
          Tem certeza que deseja excluir o contrato de <strong style={{ color:'#fff' }}>{contract.client_name}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button className="f-btn-secondary" onClick={onCancel}>Cancelar</button>
          <button onClick={onConfirm}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', background:'rgba(239,68,68,0.14)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'var(--f-r-sm)', color:'var(--f-red)', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            <Icon name="trash" size={14}/> Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Contract Row ─────────────────────────────────────────────────────────────

function ContractRow({ c, onDownload, onDownloadSig, onStatusChange, onDelete, statusOpenId, setStatusOpenId }) {
  const st = STATUS_MAP[c.status] || STATUS_MAP.ativo
  const isOpen = statusOpenId === c.id
  const btnRef = useRef(null)
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 })

  function handleStatusToggle() {
    if (!isOpen && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    }
    setStatusOpenId(isOpen ? null : c.id)
  }

  return (
    <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--f-border)', transition:'background .12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--f-card-h)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

      {/* Row layout */}
      <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        {/* Client + package */}
        <div style={{ flex:'2 1 160px', minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, color:'var(--f-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.client_name}</div>
          <div style={{ fontSize:12, color:'var(--f-muted)', marginTop:2 }}>{c.package_name}</div>
        </div>

        {/* Value + period */}
        <div style={{ flex:'1 1 120px' }}>
          <div style={{ fontWeight:700, fontSize:13, color:'var(--f-yellow)' }}>R$ {fmtCurrency(c.monthly_value)}<span style={{ fontSize:11, fontWeight:400, color:'var(--f-muted)' }}>/mês</span></div>
          <div style={{ fontSize:11, color:'var(--f-muted)', marginTop:2 }}>{fmtDate(c.start_date)} → {calcEnd(c.start_date, c.duration_months)}</div>
        </div>

        {/* Duration */}
        <div style={{ fontSize:12, color:'var(--f-muted)', whiteSpace:'nowrap', flex:'0 0 auto' }}>
          {c.duration_months} {c.duration_months === 1 ? 'mês' : 'meses'} · Dia {c.due_day}
        </div>

        {/* Status */}
        <div style={{ position:'relative', flex:'0 0 auto' }}>
          <button ref={btnRef} onClick={handleStatusToggle}
            style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
            {st.label} ▾
          </button>
          {isOpen && (
            <div style={{ position:'fixed', top:dropPos.top, right:dropPos.right, background:'var(--f-card)', border:'1px solid var(--f-border)', borderRadius:8, overflow:'hidden', zIndex:300, boxShadow:'0 8px 24px rgba(0,0,0,0.4)', minWidth:140 }}>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <button key={k} onClick={() => { onStatusChange(c.id, k); setStatusOpenId(null) }}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 14px', background: c.status === k ? 'var(--f-bg)' : 'none', border:'none', color:v.color, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--f-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = c.status === k ? 'var(--f-bg)' : 'none'}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:v.color }}/>{v.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:6, flex:'0 0 auto' }}>
          <button onClick={() => onDownload(c)} title="Baixar contrato PDF"
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:'var(--f-r-sm)', background:'var(--f-bg)', border:'1px solid var(--f-border)', color:'var(--f-muted)', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'color .15s, border-color .15s', whiteSpace:'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--f-yellow)'; e.currentTarget.style.borderColor = 'var(--f-yellow)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--f-muted)'; e.currentTarget.style.borderColor = 'var(--f-border)' }}>
            <Icon name="download" size={12}/> PDF
          </button>
          <button onClick={() => onDownloadSig(c)} title="Baixar versão para assinatura"
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:'var(--f-r-sm)', background:'var(--f-bg)', border:'1px solid var(--f-border)', color:'var(--f-muted)', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'color .15s, border-color .15s', whiteSpace:'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#3B82F6'; e.currentTarget.style.borderColor = '#3B82F6' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--f-muted)'; e.currentTarget.style.borderColor = 'var(--f-border)' }}>
            <Icon name="edit" size={12}/> Assinar
          </button>
          <button onClick={() => onDelete(c)} title="Excluir contrato"
            style={{ display:'flex', alignItems:'center', padding:'6px 8px', borderRadius:'var(--f-r-sm)', background:'none', border:'1px solid var(--f-border)', color:'var(--f-muted)', cursor:'pointer', transition:'color .15s, border-color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#EF4444' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--f-muted)'; e.currentTarget.style.borderColor = 'var(--f-border)' }}>
            <Icon name="trash" size={13}/>
          </button>
        </div>
      </div>

      {/* Services pills */}
      {Array.isArray(c.selected_services) && c.selected_services.length > 0 && (
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8 }}>
          {c.selected_services.map(id => {
            const s = SERVICE_CATALOG.find(x => x.id === id)
            return s ? (
              <span key={id} style={{ fontSize:10, background:'var(--f-bg)', border:'1px solid var(--f-border)', borderRadius:100, padding:'2px 8px', color:'var(--f-muted)' }}>{s.label}</span>
            ) : null
          })}
        </div>
      )}
    </div>
  )
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

const INIT = {
  client_name:'', client_doc:'', client_responsible:'', client_email:'', client_phone:'', client_address:'',
  package_name:'', monthly_value:'', start_date:'', duration_months:'', due_day:'', payment_method:'Pix',
  revisions:'2', services:'', observations:'', selected_services:[],
}

function CreateModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm]     = useState(INIT)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function toggleSvc(id) {
    setForm(p => {
      const arr = p.selected_services.includes(id)
        ? p.selected_services.filter(x => x !== id)
        : [...p.selected_services, id]
      return { ...p, selected_services: arr }
    })
  }

  function inp(k, type = 'text', placeholder = '') {
    return (
      <input type={type} value={form[k]} placeholder={placeholder}
        onChange={e => set(k, e.target.value)} style={inputS}
        onFocus={e => e.target.style.borderColor = 'var(--f-yellow)'}
        onBlur={e => e.target.style.borderColor = 'var(--f-border)'}/>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const req = ['client_name','package_name','monthly_value','start_date','duration_months','due_day']
    for (const k of req) {
      if (!form[k] || String(form[k]).trim() === '') { setError('Preencha todos os campos obrigatórios (*).'); return }
    }
    setSaving(true)
    try {
      buildPDF(form, false)
      const { error: dbErr } = await supabase.from('contracts').insert({
        client_name: form.client_name.trim(),
        client_doc: form.client_doc.trim(),
        client_responsible: form.client_responsible.trim(),
        client_email: form.client_email.trim(),
        client_phone: form.client_phone.trim(),
        client_address: form.client_address.trim(),
        package_name: form.package_name.trim(),
        monthly_value: parseFloat(form.monthly_value) || 0,
        start_date: form.start_date,
        duration_months: parseInt(form.duration_months, 10) || 0,
        due_day: parseInt(form.due_day, 10) || 1,
        payment_method: form.payment_method,
        revisions: parseInt(form.revisions, 10) || 2,
        services: form.services.trim(),
        observations: form.observations.trim(),
        selected_services: form.selected_services,
        status: 'ativo',
      })
      if (dbErr) throw dbErr
      setForm(INIT)
      onSuccess()
      onClose()
    } catch (err) {
      setError('Erro ao salvar: ' + (err.message || err))
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(5px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}>
      <div style={{ background:'var(--f-card)', borderRadius:16, maxWidth:660, width:'100%', maxHeight:'92vh', overflow:'auto', position:'relative' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'20px 24px 14px', borderBottom:'1px solid var(--f-border)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'var(--f-card)', zIndex:10 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:800, color:'var(--f-text)', margin:0 }}>Novo Contrato</h2>
            <p style={{ fontSize:12, color:'var(--f-muted)', margin:'3px 0 0' }}>Preencha os dados — o PDF profissional será gerado automaticamente.</p>
          </div>
          <button onClick={onClose}
            style={{ background:'none', border:'none', color:'var(--f-muted)', cursor:'pointer', display:'flex', padding:4, borderRadius:6, transition:'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--f-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--f-muted)'}>
            <Icon name="xmark" size={18}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'0 24px 24px' }}>

          {/* CLIENTE */}
          <SecHd title="Cliente"/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Fld label="Nome / Razão Social *" span><input type="text" value={form.client_name} placeholder="Ex: João Silva ou Empresa LTDA" onChange={e => set('client_name', e.target.value)} style={inputS} onFocus={e => e.target.style.borderColor='var(--f-yellow)'} onBlur={e => e.target.style.borderColor='var(--f-border)'}/></Fld>
            <Fld label="CPF / CNPJ"><input type="text" value={form.client_doc} placeholder="000.000.000-00 ou 00.000.000/0000-00" onChange={e => set('client_doc', maskDoc(e.target.value))} style={inputS} onFocus={e => e.target.style.borderColor='var(--f-yellow)'} onBlur={e => e.target.style.borderColor='var(--f-border)'}/></Fld>
            <Fld label="Responsável">{inp('client_responsible','text','Nome do responsável')}</Fld>
            <Fld label="E-mail">{inp('client_email','email','email@exemplo.com')}</Fld>
            <Fld label="Telefone"><input type="text" value={form.client_phone} placeholder="(27) 99999-0000" onChange={e => set('client_phone', maskPhone(e.target.value))} style={inputS} onFocus={e => e.target.style.borderColor='var(--f-yellow)'} onBlur={e => e.target.style.borderColor='var(--f-border)'}/></Fld>
            <Fld label="Endereço completo" span>{inp('client_address','text','Rua, Número, Bairro, Cidade/UF')}</Fld>
          </div>

          {/* COMERCIAL */}
          <SecHd title="Comercial"/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Fld label="Nome do pacote *" span>{inp('package_name','text','Ex: Pacote Redes Sociais Pro')}</Fld>
            <Fld label="Valor mensal (R$) *">{inp('monthly_value','number','0.00')}</Fld>
            <Fld label="Forma de pagamento" span>
              <div style={{ display:'flex', gap:8 }}>
                {PAYMENT_METHODS.map(m => {
                  const on = form.payment_method === m
                  return (
                    <button key={m} type="button" onClick={() => set('payment_method', m)}
                      style={{ flex:1, padding:'11px 8px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight: on ? 700 : 400, background: on ? 'rgba(255,210,46,0.08)' : 'var(--f-bg)', border: on ? '1px solid rgba(255,210,46,0.5)' : '1px solid var(--f-border)', color: on ? 'var(--f-yellow)' : 'var(--f-muted)', transition:'all .15s' }}>
                      {m}
                    </button>
                  )
                })}
              </div>
            </Fld>
            <Fld label="Data de início *">{inp('start_date','date')}</Fld>
            <Fld label="Prazo contratual (meses) *">{inp('duration_months','number','3')}</Fld>
            <Fld label="Dia de vencimento *">{inp('due_day','number','10')}</Fld>
            <Fld label="Revisões por material">{inp('revisions','number','2')}</Fld>
          </div>

          {/* SERVIÇOS */}
          <SecHd title="Serviços Contratados"/>
          <p style={{ fontSize:12, color:'var(--f-muted)', marginBottom:12 }}>Selecione os serviços — o escopo do contrato será montado automaticamente.</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
            {SERVICE_CATALOG.map(s => {
              const on = form.selected_services.includes(s.id)
              return (
                <button key={s.id} type="button" onClick={() => toggleSvc(s.id)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', textAlign:'left', background: on ? 'rgba(255,210,46,0.08)' : 'var(--f-bg)', border: on ? '1px solid rgba(255,210,46,0.5)' : '1px solid var(--f-border)', color: on ? 'var(--f-yellow)' : 'var(--f-muted)', fontSize:13, fontWeight: on ? 700 : 400, transition:'all .15s' }}>
                  <div style={{ width:16, height:16, borderRadius:4, border: on ? '2px solid var(--f-yellow)' : '2px solid var(--f-border)', background: on ? 'var(--f-yellow)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>
                    {on && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  {s.label}
                </button>
              )
            })}
          </div>
          <Fld label="Detalhamento adicional dos serviços">
            <textarea value={form.services} onChange={e => set('services', e.target.value)}
              placeholder="Descreva aqui qualquer detalhe adicional sobre os serviços, entregas específicas ou itens fora do catálogo..."
              rows={5} style={{ ...inputS, resize:'vertical', lineHeight:1.6 }}
              onFocus={e => e.target.style.borderColor='var(--f-yellow)'} onBlur={e => e.target.style.borderColor='var(--f-border)'}/>
          </Fld>

          {/* OBSERVAÇÕES */}
          <SecHd title="Observações"/>
          <Fld label="Observações e disposições específicas (opcional)">
            <textarea value={form.observations} onChange={e => set('observations', e.target.value)}
              placeholder="Ex: renovação automática acordada, condições especiais, etc..."
              rows={3} style={{ ...inputS, resize:'vertical', lineHeight:1.6 }}
              onFocus={e => e.target.style.borderColor='var(--f-yellow)'} onBlur={e => e.target.style.borderColor='var(--f-border)'}/>
          </Fld>

          {error && (
            <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#EF4444', fontSize:13 }}>
              {error}
            </div>
          )}

          <div style={{ marginTop:20, display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose}
              style={{ padding:'10px 20px', borderRadius:8, background:'transparent', border:'1px solid var(--f-border)', color:'var(--f-muted)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 22px', borderRadius:8, background: saving ? 'var(--f-border)' : '#FFD22E', color: saving ? 'var(--f-muted)' : '#000', fontSize:13, fontWeight:800, cursor: saving ? 'not-allowed' : 'pointer', border:'none', fontFamily:'inherit' }}>
              {saving ? <><Icon name="refresh" size={14}/> Gerando…</> : <><Icon name="doc" size={14}/> Gerar Contrato</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContratosPage() {
  const [contracts, setContracts]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [modalOpen, setModalOpen]       = useState(false)
  const [statusOpenId, setStatusOpenId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function load() {
    const { data } = await supabase.from('contracts').select('*').order('created_at', { ascending: false })
    setContracts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleStatusChange(id, s) {
    setContracts(p => p.map(c => c.id === id ? { ...c, status: s } : c))
    await supabase.from('contracts').update({ status: s }).eq('id', id)
  }

  async function confirmDelete() {
    const id = deleteTarget.id
    setDeleteTarget(null)
    setContracts(p => p.filter(c => c.id !== id))
    await supabase.from('contracts').delete().eq('id', id)
  }

  const total     = contracts.length
  const ativos    = contracts.filter(c => c.status === 'ativo').length
  const mensalTotal = contracts.filter(c => c.status === 'ativo').reduce((s, c) => s + parseFloat(c.monthly_value || 0), 0)

  return (
    <>
      <FlowHeader
        title="Contratos"
        subtitle={`${total} contrato${total !== 1 ? 's' : ''} · ${ativos} ativo${ativos !== 1 ? 's' : ''}`}
        actions={
          <button onClick={() => setModalOpen(true)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:'var(--f-r-sm)', background:'#FFD22E', color:'#000', fontSize:13, fontWeight:800, border:'none', cursor:'pointer', fontFamily:'inherit', transition:'opacity .15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Icon name="plus" size={14}/> Novo Contrato
          </button>
        }
      />

      <main className="f-content">
        {/* Stats */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
          {[
            { label:'Total', value: total, color:'var(--f-muted)' },
            { label:'Ativos', value: ativos, color:'#22C55E' },
            { label:'Encerrados', value: contracts.filter(c=>c.status==='encerrado').length, color:'#A1A1AA' },
            { label:'Cancelados', value: contracts.filter(c=>c.status==='cancelado').length, color:'#EF4444' },
            { label:'Renovados', value: contracts.filter(c=>c.status==='renovado').length, color:'#3B82F6' },
            { label:'MRR Ativo', value: `R$ ${fmtCurrency(mensalTotal)}`, color:'#FFD22E' },
          ].map(s => (
            <div key={s.label} style={{ flex:'1 1 90px', minWidth:80, background:'var(--f-card)', border:'1px solid var(--f-border)', borderRadius:12, padding:'14px 16px', display:'flex', flexDirection:'column', gap:4 }}>
              <span style={{ fontSize:typeof s.value==='string' ? 14 : 22, fontWeight:800, color:s.color }}>{s.value}</span>
              <span style={{ fontSize:10, fontWeight:700, color:'var(--f-muted)', letterSpacing:'.06em', textTransform:'uppercase' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background:'var(--f-card)', border:'1px solid var(--f-border)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--f-border)', background:'var(--f-bg)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--f-muted)' }}>Histórico de Contratos</span>
            <span style={{ fontSize:11, color:'var(--f-muted)' }}>{total} registro{total !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'40px', gap:10, color:'var(--f-muted)' }}>
              <Icon name="refresh" size={18}/> <span style={{ fontSize:14 }}>Carregando contratos…</span>
            </div>
          ) : contracts.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 24px', gap:10 }}>
              <div style={{ color:'var(--f-muted)', opacity:.35 }}><Icon name="doc" size={48}/></div>
              <p style={{ fontSize:14, color:'var(--f-muted)', margin:0 }}>Nenhum contrato ainda.</p>
              <p style={{ fontSize:13, color:'var(--f-muted)', opacity:.6, margin:0 }}>Clique em "Novo Contrato" para criar o primeiro.</p>
            </div>
          ) : (
            contracts.map(c => (
              <ContractRow key={c.id} c={c}
                onDownload={c => buildPDF(c, false)}
                onDownloadSig={c => buildPDF(c, true)}
                onStatusChange={handleStatusChange}
                onDelete={setDeleteTarget}
                statusOpenId={statusOpenId}
                setStatusOpenId={setStatusOpenId}/>
            ))
          )}
        </div>
      </main>

      {statusOpenId && <div style={{ position:'fixed', inset:0, zIndex:299 }} onClick={() => setStatusOpenId(null)}/>}

      <CreateModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={load}/>

      <DeleteDialog contract={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)}/>
    </>
  )
}
