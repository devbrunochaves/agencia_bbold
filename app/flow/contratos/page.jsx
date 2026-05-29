'use client'

import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { supabase } from '@/lib/supabase'
import FlowHeader from '@/components/flow/FlowHeader'
import Icon from '@/components/flow/FlowIcons'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value) {
  const num = parseFloat(value) || 0
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(iso) {
  if (!iso) return '—'
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

function calcEndDate(startDateIso, durationMonths) {
  if (!startDateIso || !durationMonths) return '—'
  const d = new Date(startDateIso + 'T00:00:00')
  d.setMonth(d.getMonth() + parseInt(durationMonths, 10))
  const day   = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year  = d.getFullYear()
  return `${day}/${month}/${year}`
}

function todayDisplay() {
  const d = new Date()
  const day   = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year  = d.getFullYear()
  return `${day}/${month}/${year}`
}

const STATUS_STYLES = {
  ativo:     { background: 'rgba(34,197,94,0.15)',  color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)',  label: 'Ativo'     },
  encerrado: { background: 'rgba(113,113,122,0.15)', color: '#A1A1AA', border: '1px solid rgba(113,113,122,0.3)', label: 'Encerrado' },
  cancelado: { background: 'rgba(239,68,68,0.15)',  color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)',  label: 'Cancelado' },
  renovado:  { background: 'rgba(59,130,246,0.15)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)', label: 'Renovado'  },
}

const STATUS_OPTIONS = ['ativo', 'encerrado', 'cancelado', 'renovado']

// ─── PDF Generation ───────────────────────────────────────────────────────────

function generateContractPDF(data) {
  const doc    = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW  = 210
  const margin = 20
  const contentW = pageW - margin * 2
  let y = 20

  function checkPage(needed) {
    if (y + needed > 270) {
      doc.addPage()
      y = 20
    }
  }

  function addLine() {
    checkPage(6)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageW - margin, y)
    y += 6
  }

  function sectionTitle(text) {
    checkPage(12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text(text.toUpperCase(), margin, y)
    y += 6
    doc.setTextColor(0, 0, 0)
  }

  function row(label, value) {
    checkPage(7)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(label + ':', margin, y)
    doc.setFont('helvetica', 'normal')
    const labelW = doc.getTextWidth(label + ': ')
    const maxW = contentW - labelW - 5
    const lines = doc.splitTextToSize(String(value || '—'), maxW)
    doc.text(lines, margin + labelW + 2, y)
    y += lines.length * 6
  }

  function paragraph(text) {
    checkPage(10)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(String(text || ''), contentW)
    lines.forEach(line => {
      checkPage(6)
      doc.text(line, margin, y)
      y += 6
    })
  }

  // — Header —
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageW / 2, y, { align: 'center' })
  y += 8

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('BBold Agência Digital', pageW / 2, y, { align: 'center' })
  y += 8

  addLine()

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const contractNum = Date.now()
  doc.text(`Contrato Nº: ${contractNum}   |   Data: ${todayDisplay()}`, margin, y)
  y += 10

  addLine()

  // — Contratante —
  sectionTitle('CONTRATANTE')
  row('Nome / Razão Social', data.client_name)
  row('CPF / CNPJ', data.client_doc)
  row('Responsável', data.client_responsible)
  row('E-mail', data.client_email)
  row('Telefone', data.client_phone)
  row('Endereço', data.client_address)
  y += 4

  addLine()

  // — Contratada —
  sectionTitle('CONTRATADA')
  row('Empresa', '59.676.407 BRUNO CHAVES DOS SANTOS')
  row('CNPJ', '59.676.407/0001-86')
  row('Endereço', 'Rua Basílio da Gama, 430, Bloco 1A, Apto 1206, Jardim Limoeiro, Serra/ES')
  row('E-mail', 'brunochavesdev@gmail.com')
  row('Telefone', '(27) 9734-1557')
  y += 4

  addLine()

  // — Objeto —
  sectionTitle('OBJETO DO CONTRATO')
  paragraph(data.services)
  y += 4

  addLine()

  // — Condições Comerciais —
  sectionTitle('CONDIÇÕES COMERCIAIS')
  row('Pacote', data.package_name)
  row('Valor Mensal', 'R$ ' + formatCurrency(data.monthly_value))
  row('Data de Início', formatDate(data.start_date))
  row('Prazo', data.duration_months + ' meses')
  row('Vencimento', 'Dia ' + data.due_day + ' de cada mês')
  y += 4

  addLine()

  // — Cláusulas —
  sectionTitle('CLÁUSULAS')
  const clausulas = [
    '1. Prestação de serviços de marketing digital.',
    '2. Prazo mínimo de 3 meses.',
    '3. Sem multa rescisória.',
    '4. Aviso prévio obrigatório de 30 dias.',
    '5. Entregas conforme pacote contratado.',
    '6. Pagamento mensal recorrente.',
    '7. Direitos autorais dos materiais produzidos transferidos ao cliente após pagamento.',
  ]
  clausulas.forEach(c => {
    checkPage(7)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(c, contentW)
    lines.forEach(line => {
      checkPage(6)
      doc.text(line, margin, y)
      y += 6
    })
  })
  y += 4

  // — Observações —
  if (data.observations && data.observations.trim()) {
    addLine()
    sectionTitle('OBSERVAÇÕES')
    paragraph(data.observations)
    y += 4
  }

  addLine()

  // — Assinaturas —
  checkPage(40)
  sectionTitle('ASSINATURAS')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Serra/ES, ${todayDisplay()}`, margin, y)
  y += 14

  doc.line(margin, y, margin + 70, y)
  doc.line(pageW - margin - 70, y, pageW - margin, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.text('CONTRATANTE', margin, y)
  doc.text('CONTRATADA', pageW - margin - 70, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  const clientLines = doc.splitTextToSize(data.client_name || '', 70)
  doc.text(clientLines, margin, y)
  doc.text('59.676.407 BRUNO CHAVES DOS SANTOS', pageW - margin - 70, y)

  const safeClientName = (data.client_name || 'contrato').replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`contrato_${safeClientName}_${Date.now()}.pdf`)
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', gap:12 }}>
      <div style={{ color:'var(--f-muted)', opacity:0.4 }}>
        <Icon name="doc" size={48}/>
      </div>
      <h3 style={{ fontSize:15, fontWeight:700, color:'var(--f-muted)', margin:0 }}>Nenhum contrato ainda</h3>
      <p style={{ fontSize:13, color:'var(--f-muted-dim)', margin:0 }}>Clique em "Novo Contrato" para criar o primeiro.</p>
    </div>
  )
}

// ─── Contract Row ─────────────────────────────────────────────────────────────

function ContractRow({ contract, onDownload, onStatusChange, statusOpenId, setStatusOpenId }) {
  const st = STATUS_STYLES[contract.status] || STATUS_STYLES.ativo
  const isOpen = statusOpenId === contract.id

  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'1fr 1fr auto auto auto auto',
      gap:12,
      alignItems:'center',
      padding:'14px 20px',
      borderBottom:'1px solid var(--f-border)',
      transition:'background 0.12s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--f-card-h)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Cliente + Pacote */}
      <div style={{ display:'flex', flexDirection:'column', gap:3, minWidth:0 }}>
        <span style={{ fontWeight:700, fontSize:14, color:'var(--f-text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {contract.client_name}
        </span>
        <span style={{ fontSize:12, color:'var(--f-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {contract.package_name}
        </span>
      </div>

      {/* Valor + Datas */}
      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
        <span style={{ fontWeight:700, fontSize:14, color:'var(--f-yellow)' }}>
          R$ {formatCurrency(contract.monthly_value)}<span style={{ fontSize:11, fontWeight:400, color:'var(--f-muted)' }}>/mês</span>
        </span>
        <span style={{ fontSize:11, color:'var(--f-muted)' }}>
          {formatDate(contract.start_date)} → {calcEndDate(contract.start_date, contract.duration_months)}
        </span>
      </div>

      {/* Status badge + dropdown */}
      <div style={{ position:'relative' }}>
        <button
          onClick={() => setStatusOpenId(isOpen ? null : contract.id)}
          style={{
            display:'inline-flex', alignItems:'center', gap:5,
            padding:'4px 10px', borderRadius:99,
            fontSize:11, fontWeight:700, cursor:'pointer',
            fontFamily:'inherit', whiteSpace:'nowrap',
            ...st,
          }}
        >
          {st.label} ▾
        </button>

        {isOpen && (
          <div style={{
            position:'absolute', top:'calc(100% + 6px)', right:0,
            background:'var(--f-card)', border:'1px solid var(--f-border)',
            borderRadius:8, overflow:'hidden', zIndex:100,
            boxShadow:'0 8px 24px rgba(0,0,0,0.4)', minWidth:140,
          }}>
            {STATUS_OPTIONS.map(opt => {
              const s = STATUS_STYLES[opt]
              return (
                <button
                  key={opt}
                  onClick={() => { onStatusChange(contract.id, opt); setStatusOpenId(null) }}
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    width:'100%', padding:'10px 14px',
                    background: contract.status === opt ? 'var(--f-bg)' : 'none',
                    border:'none', color:s.color,
                    fontSize:12, fontWeight:600, cursor:'pointer',
                    fontFamily:'inherit', textAlign:'left',
                    transition:'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--f-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = contract.status === opt ? 'var(--f-bg)' : 'none'}
                >
                  <div style={{ width:7, height:7, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
                  {s.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Duration */}
      <span style={{ fontSize:12, color:'var(--f-muted)', whiteSpace:'nowrap' }}>
        {contract.duration_months} {contract.duration_months === 1 ? 'mês' : 'meses'}
      </span>

      {/* Venc */}
      <span style={{ fontSize:12, color:'var(--f-muted)', whiteSpace:'nowrap' }}>
        Dia {contract.due_day}
      </span>

      {/* Download */}
      <button
        onClick={() => onDownload(contract)}
        title="Baixar PDF"
        style={{
          display:'flex', alignItems:'center', gap:5,
          padding:'7px 12px', borderRadius:'var(--f-r-sm)',
          background:'var(--f-bg)', border:'1px solid var(--f-border)',
          color:'var(--f-muted)', fontSize:11, fontWeight:700,
          cursor:'pointer', fontFamily:'inherit',
          transition:'color 0.15s, border-color 0.15s',
          whiteSpace:'nowrap',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--f-yellow)'; e.currentTarget.style.borderColor = 'var(--f-yellow)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--f-muted)'; e.currentTarget.style.borderColor = 'var(--f-border)' }}
      >
        <Icon name="download" size={12}/> PDF
      </button>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  client_name: '', client_doc: '', client_responsible: '',
  client_email: '', client_phone: '', client_address: '',
  package_name: '', monthly_value: '', start_date: '',
  duration_months: '', due_day: '', services: '', observations: '',
}

const labelStyle = {
  display:'block', fontSize:11, fontWeight:700,
  letterSpacing:'0.07em', textTransform:'uppercase',
  color:'var(--f-muted)', marginBottom:6,
}

const inputStyle = {
  width:'100%', background:'var(--f-bg)',
  border:'1px solid var(--f-border)',
  borderRadius:8, padding:'10px 12px',
  color:'var(--f-text)', fontSize:14,
  fontFamily:'inherit', outline:'none',
  boxSizing:'border-box',
  transition:'border-color 0.15s',
}

function Field({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function SectionHeader({ title }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      margin:'24px 0 16px',
    }}>
      <div style={{ height:1, flex:1, background:'var(--f-border)' }}/>
      <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--f-muted-dim)', whiteSpace:'nowrap' }}>
        {title}
      </span>
      <div style={{ height:1, flex:1, background:'var(--f-border)' }}/>
    </div>
  )
}

function CreateModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm]       = useState(INITIAL_FORM)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function inp(key, type = 'text', placeholder = '') {
    return (
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={e => set(key, e.target.value)}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = 'var(--f-yellow)'}
        onBlur={e => e.target.style.borderColor = 'var(--f-border)'}
      />
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // Validation
    const required = ['client_name', 'package_name', 'monthly_value', 'start_date', 'duration_months', 'due_day', 'services']
    for (const k of required) {
      if (!form[k] || String(form[k]).trim() === '') {
        setError('Preencha todos os campos obrigatórios.')
        return
      }
    }

    setSaving(true)
    try {
      // Generate PDF first
      generateContractPDF(form)

      // Insert to Supabase
      const { error: dbError } = await supabase.from('contracts').insert({
        client_name:      form.client_name.trim(),
        client_doc:       form.client_doc.trim(),
        client_responsible: form.client_responsible.trim(),
        client_email:     form.client_email.trim(),
        client_phone:     form.client_phone.trim(),
        client_address:   form.client_address.trim(),
        package_name:     form.package_name.trim(),
        monthly_value:    parseFloat(form.monthly_value) || 0,
        start_date:       form.start_date,
        duration_months:  parseInt(form.duration_months, 10) || 0,
        due_day:          parseInt(form.due_day, 10) || 1,
        services:         form.services.trim(),
        observations:     form.observations.trim(),
        status:           'ativo',
      })

      if (dbError) throw dbError

      setForm(INITIAL_FORM)
      onSuccess()
      onClose()
    } catch (err) {
      setError('Erro ao salvar contrato: ' + (err.message || err))
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}
    >
      <div
        style={{ background:'var(--f-card)', borderRadius:16, maxWidth:600, width:'100%', maxHeight:'90vh', overflow:'auto', position:'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid var(--f-border)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'var(--f-card)', zIndex:10 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:800, color:'var(--f-text)', margin:0 }}>Novo Contrato</h2>
            <p style={{ fontSize:12, color:'var(--f-muted)', margin:'3px 0 0' }}>Preencha os dados para gerar o PDF e salvar.</p>
          </div>
          <button
            onClick={onClose}
            style={{ background:'none', border:'none', color:'var(--f-muted)', cursor:'pointer', display:'flex', alignItems:'center', padding:4, borderRadius:6, transition:'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--f-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--f-muted)'}
          >
            <Icon name="xmark" size={18}/>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding:'0 24px 24px' }}>
          <SectionHeader title="Cliente"/>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <Field label="Nome / Razão Social *">{inp('client_name', 'text', 'Ex: João Silva ou Empresa LTDA')}</Field>
            </div>
            <Field label="CPF / CNPJ">{inp('client_doc', 'text', 'Ex: 000.000.000-00')}</Field>
            <Field label="Responsável">{inp('client_responsible', 'text', 'Nome do responsável')}</Field>
            <Field label="E-mail">{inp('client_email', 'email', 'email@exemplo.com')}</Field>
            <Field label="Telefone">{inp('client_phone', 'text', '(27) 99999-0000')}</Field>
            <div style={{ gridColumn:'1 / -1' }}>
              <Field label="Endereço completo">{inp('client_address', 'text', 'Rua, Número, Bairro, Cidade/UF')}</Field>
            </div>
          </div>

          <SectionHeader title="Comercial"/>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ gridColumn:'1 / -1' }}>
              <Field label="Nome do pacote *">{inp('package_name', 'text', 'Ex: Pacote Redes Sociais Pro')}</Field>
            </div>
            <Field label="Valor mensal (R$) *">{inp('monthly_value', 'number', '0.00')}</Field>
            <Field label="Data de início *">{inp('start_date', 'date')}</Field>
            <Field label="Prazo contratual (meses) *">{inp('duration_months', 'number', '3')}</Field>
            <Field label="Dia de vencimento *">{inp('due_day', 'number', '10')}</Field>
          </div>

          <SectionHeader title="Serviços"/>

          <Field label="Serviços inclusos *">
            <textarea
              value={form.services}
              onChange={e => set('services', e.target.value)}
              placeholder="Descreva todos os serviços inclusos no pacote..."
              rows={6}
              style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }}
              onFocus={e => e.target.style.borderColor = 'var(--f-yellow)'}
              onBlur={e => e.target.style.borderColor = 'var(--f-border)'}
            />
          </Field>

          <SectionHeader title="Observações"/>

          <Field label="Observações (opcional)">
            <textarea
              value={form.observations}
              onChange={e => set('observations', e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
              style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }}
              onFocus={e => e.target.style.borderColor = 'var(--f-yellow)'}
              onBlur={e => e.target.style.borderColor = 'var(--f-border)'}
            />
          </Field>

          {error && (
            <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#EF4444', fontSize:13 }}>
              {error}
            </div>
          )}

          <div style={{ marginTop:20, display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding:'10px 20px', borderRadius:8, background:'transparent', border:'1px solid var(--f-border)', color:'var(--f-muted)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'color 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--f-text)'; e.currentTarget.style.borderColor = 'var(--f-border-s)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--f-muted)'; e.currentTarget.style.borderColor = 'var(--f-border)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 22px', borderRadius:8, background: saving ? 'var(--f-border)' : '#FFD22E', color: saving ? 'var(--f-muted)' : '#000', fontSize:13, fontWeight:800, cursor: saving ? 'not-allowed' : 'pointer', border:'none', fontFamily:'inherit', transition:'opacity 0.15s' }}
            >
              {saving ? (
                <><Icon name="refresh" size={14}/> Gerando…</>
              ) : (
                <><Icon name="doc" size={14}/> Gerar Contrato</>
              )}
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

  async function loadContracts() {
    const { data } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })
    setContracts(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadContracts()
  }, [])

  async function handleStatusChange(id, newStatus) {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
    await supabase.from('contracts').update({ status: newStatus }).eq('id', id)
  }

  function handleDownload(contract) {
    generateContractPDF(contract)
  }

  function handleSuccess() {
    loadContracts()
  }

  const ativo     = contracts.filter(c => c.status === 'ativo').length
  const encerrado = contracts.filter(c => c.status === 'encerrado').length
  const total     = contracts.length

  return (
    <>
      <FlowHeader
        title="Contratos"
        subtitle={`${total} contrato${total !== 1 ? 's' : ''} · ${ativo} ativo${ativo !== 1 ? 's' : ''}`}
        actions={
          <button
            onClick={() => setModalOpen(true)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:'var(--f-r-sm)', background:'#FFD22E', color:'#000', fontSize:13, fontWeight:800, border:'none', cursor:'pointer', fontFamily:'inherit', transition:'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Icon name="plus" size={14}/> Novo Contrato
          </button>
        }
      />

      <main className="f-content">
        {/* Stats strip */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
          {[
            { label:'Total', value:total, color:'var(--f-muted)' },
            { label:'Ativos', value:ativo, color:'#22C55E' },
            { label:'Encerrados', value:encerrado, color:'#A1A1AA' },
            { label:'Cancelados', value:contracts.filter(c => c.status === 'cancelado').length, color:'#EF4444' },
            { label:'Renovados', value:contracts.filter(c => c.status === 'renovado').length, color:'#3B82F6' },
          ].map(s => (
            <div key={s.label} style={{ flex:'1 1 100px', minWidth:90, background:'var(--f-card)', border:'1px solid var(--f-border)', borderRadius:12, padding:'14px 18px', display:'flex', flexDirection:'column', gap:4 }}>
              <span style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</span>
              <span style={{ fontSize:11, fontWeight:600, color:'var(--f-muted)', letterSpacing:'0.05em', textTransform:'uppercase' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background:'var(--f-card)', border:'1px solid var(--f-border)', borderRadius:12, overflow:'hidden' }}>
          {/* Table header */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'1fr 1fr auto auto auto auto',
            gap:12,
            padding:'10px 20px',
            borderBottom:'1px solid var(--f-border)',
            background:'var(--f-bg)',
          }}>
            {['Cliente / Pacote', 'Valor / Período', 'Status', 'Prazo', 'Venc.', ''].map((h, i) => (
              <span key={i} style={{ fontSize:10, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--f-muted-dim)' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px', gap:10, color:'var(--f-muted)' }}>
              <Icon name="refresh" size={18}/> <span style={{ fontSize:14 }}>Carregando contratos…</span>
            </div>
          ) : contracts.length === 0 ? (
            <EmptyState/>
          ) : (
            contracts.map(c => (
              <ContractRow
                key={c.id}
                contract={c}
                onDownload={handleDownload}
                onStatusChange={handleStatusChange}
                statusOpenId={statusOpenId}
                setStatusOpenId={setStatusOpenId}
              />
            ))
          )}
        </div>
      </main>

      {/* Click outside closes status dropdown */}
      {statusOpenId && (
        <div
          style={{ position:'fixed', inset:0, zIndex:99 }}
          onClick={() => setStatusOpenId(null)}
        />
      )}

      <CreateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
