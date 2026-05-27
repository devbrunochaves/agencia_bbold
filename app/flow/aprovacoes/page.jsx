'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import FlowHeader from '@/components/flow/FlowHeader'
import MetricCard from '@/components/flow/MetricCard'
import Icon from '@/components/flow/FlowIcons'
import ApprovalModal from '@/components/flow/ApprovalModal'
import ApprovalDetailModal from '@/components/flow/ApprovalDetailModal'
import { supabase } from '@/lib/supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ['Aguardando revisão','Ajustes solicitados','Liberado p/ cliente','Aprovado','Reprovado']

const STATUS_CFG = {
  'Aguardando revisão':  { color:'#F59E0B', bg:'rgba(245,158,11,0.15)',  border:'rgba(245,158,11,0.3)'  },
  'Ajustes solicitados': { color:'#EF4444', bg:'rgba(239,68,68,0.15)',   border:'rgba(239,68,68,0.3)'   },
  'Liberado p/ cliente': { color:'#3B82F6', bg:'rgba(59,130,246,0.15)', border:'rgba(59,130,246,0.3)'  },
  'Aprovado':            { color:'#22C55E', bg:'rgba(34,197,94,0.15)',   border:'rgba(34,197,94,0.3)'   },
  'Reprovado':           { color:'#8B5CF6', bg:'rgba(139,92,246,0.15)', border:'rgba(139,92,246,0.3)'  },
}

const PRIORITY_BORDER = {
  'Urgente':'#EF4444', 'Alta':'#F59E0B', 'Média':'#3B82F6', 'Baixa':'#4B5563',
}

// ─── Field mapping ────────────────────────────────────────────────────────────

function fromDB(row) {
  return {
    id:           row.id,
    title:        row.title        ?? '',
    client:       row.client       ?? '',
    format:       row.format       ?? '',
    responsible:  row.responsible  ?? '',
    deadline:     row.deadline     ?? '',
    priority:     row.priority     ?? 'Média',
    status:       row.status       ?? 'Aguardando revisão',
    copy:         row.copy         ?? '',
    observations: row.observations ?? '',
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
  }
}

function toDB(form) {
  return {
    title:        form.title        || '',
    client:       form.client       || '',
    format:       form.format       || '',
    responsible:  form.responsible  || '',
    deadline:     form.deadline     || null,
    priority:     form.priority     || 'Média',
    status:       form.status       || 'Aguardando revisão',
    copy:         form.copy         || '',
    observations: form.observations || '',
  }
}

function fmtDeadline(iso) {
  if (!iso) return '—'
  const [, m, d] = iso.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${Number(d)} ${months[Number(m)-1]}`
}

function isPast(iso) {
  if (!iso) return false
  return new Date(iso) < new Date(new Date().toDateString())
}

function isApprovedToday(item) {
  if (!item.updatedAt) return false
  return item.status === 'Aprovado' && new Date(item.updatedAt).toDateString() === new Date().toDateString()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AprovacoesPage() {
  const [items,       setItems]      = useState([])
  const [clientNames, setClientNames]= useState([])
  const [loading,     setLoading]    = useState(true)
  const [modalOpen,   setModalOpen]  = useState(false)
  const [editing,     setEditing]    = useState(null)
  const [viewing,     setViewing]    = useState(null)
  const [search,      setSearch]     = useState('')
  const [fStatus,     setFStatus]    = useState('')
  const [toast,       setToast]      = useState(null)
  const [adjustTarget,setAdjustTarget]=useState(null)
  const [rejectTarget,setRejectTarget]=useState(null)
  const [adjustNote,  setAdjustNote] = useState('')
  const [rejectNote,  setRejectNote] = useState('')

  // ─── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [{ data: rows }, { data: clientRows }] = await Promise.all([
        supabase.from('approvals').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('name').order('name'),
      ])
      setItems((rows ?? []).map(fromDB))
      setClientNames((clientRows ?? []).map(r => r.name))
      setLoading(false)
    }
    load()
  }, [])

  function flash(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ─── CRUD helpers ──────────────────────────────────────────────────────────

  async function dbUpdate(id, patch) {
    const current = items.find(i => i.id === id)
    if (!current) return
    const { data, error } = await supabase
      .from('approvals').update(toDB({ ...current, ...patch })).eq('id', id).select().single()
    if (!error && data) setItems(prev => prev.map(i => i.id === id ? fromDB(data) : i))
    return error
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  async function handleSave(form) {
    if (editing) {
      const { data, error } = await supabase
        .from('approvals').update(toDB(form)).eq('id', editing.id).select().single()
      if (error) { flash('Erro ao salvar.', 'warn'); return }
      setItems(prev => prev.map(i => i.id === editing.id ? fromDB(data) : i))
      flash('Aprovação atualizada!')
    } else {
      const { data, error } = await supabase
        .from('approvals').insert({ ...toDB(form), status:'Aguardando revisão' }).select().single()
      if (error) { flash('Erro ao criar.', 'warn'); return }
      setItems(prev => [fromDB(data), ...prev])
      flash('Aprovação criada!')
    }
    setModalOpen(false); setEditing(null)
  }

  async function handleApprove(id)  { await dbUpdate(id, { status:'Aprovado' }); flash('Conteúdo aprovado! ✓') }
  async function handleRelease(id)  { await dbUpdate(id, { status:'Liberado p/ cliente' }); flash('Liberado para o cliente!') }

  async function handleAdjust() {
    if (!adjustTarget) return
    const err = await dbUpdate(adjustTarget.id, { status:'Ajustes solicitados', observations: adjustNote || adjustTarget.observations })
    if (!err) flash('Ajuste solicitado.', 'warn')
    setAdjustTarget(null); setAdjustNote('')
  }

  async function handleReject() {
    if (!rejectTarget) return
    const err = await dbUpdate(rejectTarget.id, { status:'Reprovado', observations: rejectNote || rejectTarget.observations })
    if (!err) flash('Aprovação reprovada.', 'warn')
    setRejectTarget(null); setRejectNote('')
  }

  // ─── Metrics ───────────────────────────────────────────────────────────────
  const metrics = useMemo(() => ({
    pendentes:     items.filter(i => i.status === 'Aguardando revisão').length,
    urgentes:      items.filter(i => i.priority === 'Urgente' || (isPast(i.deadline) && !['Aprovado','Liberado p/ cliente','Reprovado'].includes(i.status))).length,
    aprovadosHoje: items.filter(isApprovedToday).length,
    reprovados:    items.filter(i => i.status === 'Reprovado').length,
  }), [items])

  const filtered = useMemo(() => items.filter(i => {
    if (fStatus && i.status !== fStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        i.title.toLowerCase().includes(q) ||
        i.client.toLowerCase().includes(q) ||
        i.format.toLowerCase().includes(q) ||
        (i.responsible || '').toLowerCase().includes(q) ||
        i.status.toLowerCase().includes(q)
      )
    }
    return true
  }), [items, fStatus, search])

  const selectStyle = { background:'var(--f-card)', border:'1px solid var(--f-border)', borderRadius:8, color:'var(--f-muted)', fontSize:13, padding:'7px 10px', cursor:'pointer', outline:'none' }
  const liveViewing = viewing ? items.find(i => i.id === viewing.id) ?? viewing : null

  return (
    <>
      <FlowHeader
        title="Aprovações"
        subtitle="Revise conteúdos internamente antes de liberar para o cliente."
        actions={
          <button className="f-btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
            <Icon name="plus" size={14}/> <span>Nova Aprovação</span>
          </button>
        }
      />

      <main className="f-content">
        <div className="f-metrics-grid">
          <MetricCard icon="clock"    value={String(metrics.pendentes)}     label="Pendentes"      desc="aguardando revisão"  accentColor="#F59E0B" trend={0} />
          <MetricCard icon="alert"    value={String(metrics.urgentes)}      label="Urgentes"       desc="prazo crítico"       accentColor="#EF4444" trend={0} />
          <MetricCard icon="thumbsup" value={String(metrics.aprovadosHoje)} label="Aprovados hoje" desc="neste dia"           accentColor="#22C55E" trend={0} />
          <MetricCard icon="xmark"    value={String(metrics.reprovados)}    label="Reprovados"     desc="precisam de revisão" accentColor="#8B5CF6" trend={0} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <select style={{ ...selectStyle, width:'100%' }} value={fStatus} onChange={e => setFStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--f-muted)', pointerEvents:'none' }}>
              <Icon name="search" size={14}/>
            </div>
            <input className="f-input" style={{ paddingLeft:34 }} placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
        </div>

        {(fStatus || search) && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:'var(--f-muted)' }}>{filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}</span>
            <button className="f-btn-ghost" style={{ fontSize:12 }} onClick={() => { setFStatus(''); setSearch('') }}>Limpar filtros</button>
          </div>
        )}

        {loading ? (
          <div className="f-empty-state" style={{ padding:'60px 20px' }}>
            <Icon name="refresh" size={32}/>
            <h3>Carregando…</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="f-empty-state" style={{ padding:'60px 20px' }}>
            <Icon name="check" size={40}/>
            <h3>Nenhuma aprovação encontrada</h3>
            <p>Crie uma nova aprovação ou ajuste os filtros.</p>
            <button className="f-btn-primary" style={{ marginTop:12 }} onClick={() => { setEditing(null); setModalOpen(true) }}>
              <Icon name="plus" size={14}/> Nova Aprovação
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map(item => (
              <ApprovalCard
                key={item.id}
                item={item}
                onView={() => setViewing(item)}
                onEdit={() => { setEditing(item); setModalOpen(true) }}
                onApprove={() => handleApprove(item.id)}
                onRelease={() => handleRelease(item.id)}
                onRequestAdjust={() => { setAdjustNote(item.observations || ''); setAdjustTarget(item) }}
                onReject={() => { setRejectNote(item.observations || ''); setRejectTarget(item) }}
              />
            ))}
          </div>
        )}
      </main>

      <ApprovalModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
        editing={editing}
        clients={clientNames}
      />

      <ApprovalDetailModal
        isOpen={!!viewing}
        approval={liveViewing}
        onClose={() => setViewing(null)}
        onEdit={() => { setEditing(liveViewing); setModalOpen(true) }}
        onApprove={() => handleApprove(liveViewing.id)}
        onRelease={() => handleRelease(liveViewing.id)}
        onRequestAdjust={() => { setAdjustNote(liveViewing.observations || ''); setAdjustTarget(liveViewing); setViewing(null) }}
        onReject={() => { setRejectNote(liveViewing.observations || ''); setRejectTarget(liveViewing); setViewing(null) }}
      />

      {adjustTarget && (
        <MiniModal
          title="Solicitar ajuste" icon="refresh" iconColor="#F59E0B"
          placeholder="Descreva o que precisa ser ajustado..."
          value={adjustNote} onChange={setAdjustNote}
          onCancel={() => { setAdjustTarget(null); setAdjustNote('') }}
          onConfirm={handleAdjust}
          confirmLabel="Solicitar ajuste" confirmColor="#F59E0B"
          confirmBg="rgba(245,158,11,0.12)" confirmBorder="rgba(245,158,11,0.3)"
        />
      )}

      {rejectTarget && (
        <MiniModal
          title="Reprovar conteúdo" icon="xmark" iconColor="#EF4444"
          placeholder="Informe o motivo da reprovação..."
          value={rejectNote} onChange={setRejectNote}
          onCancel={() => { setRejectTarget(null); setRejectNote('') }}
          onConfirm={handleReject}
          confirmLabel="Confirmar reprovação" confirmColor="#EF4444"
          confirmBg="rgba(239,68,68,0.12)" confirmBorder="rgba(239,68,68,0.3)"
        />
      )}

      {toast && (
        <div style={{
          position:'fixed', bottom:24, right:24, zIndex:300,
          background: toast.type === 'warn' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
          border:`1px solid ${toast.type === 'warn' ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.35)'}`,
          borderRadius:10, padding:'11px 18px',
          color: toast.type === 'warn' ? '#EF4444' : '#22C55E',
          fontSize:13, fontWeight:600, boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}

// ─── Approval Card ────────────────────────────────────────────────────────────

function ApprovalCard({ item, onView, onEdit, onApprove, onRelease, onRequestAdjust, onReject }) {
  const sCfg    = STATUS_CFG[item.status] ?? { color:'#A1A1AA', bg:'rgba(161,161,170,0.15)', border:'rgba(161,161,170,0.3)' }
  const pastDue = isPast(item.deadline) && !['Aprovado','Liberado p/ cliente','Reprovado'].includes(item.status)
  const borderL = PRIORITY_BORDER[item.priority] || 'var(--f-border)'

  return (
    <div
      style={{ background:'var(--f-card)', border:'1px solid var(--f-border)', borderRadius:14, overflow:'hidden', borderLeft:`3px solid ${borderL}`, cursor:'pointer' }}
      onClick={onView}
    >
      <div style={{ padding:'14px 16px 10px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--f-text)', marginBottom:6, lineHeight:1.3 }}>{item.title}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
            <span className="f-client-chip" style={{ fontSize:11 }}>{item.client}</span>
            <span className="f-format-chip" style={{ fontSize:11 }}>{item.format}</span>
            <span style={{ fontSize:11, color:'var(--f-muted)', display:'flex', alignItems:'center', gap:3 }}>
              <Icon name="user" size={10}/>{item.responsible}
            </span>
            {item.deadline && (
              <span style={{ fontSize:11, color: pastDue ? '#EF4444' : 'var(--f-muted)', display:'flex', alignItems:'center', gap:3, fontWeight: pastDue ? 600 : 400 }}>
                <Icon name="clock" size={10}/>{fmtDeadline(item.deadline)}{pastDue ? ' ⚠' : ''}
              </span>
            )}
          </div>
        </div>
        <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, color:sCfg.color, background:sCfg.bg, border:`1px solid ${sCfg.border}`, flexShrink:0, whiteSpace:'nowrap' }}>
          {item.status}
        </span>
      </div>

      {item.copy && (
        <div style={{ padding:'0 16px 10px' }}>
          <p style={{ fontSize:12, color:'var(--f-muted)', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {item.copy}
          </p>
        </div>
      )}

      <div style={{ borderTop:'1px solid var(--f-border)', padding:'8px 12px', display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end', alignItems:'center' }} onClick={e => e.stopPropagation()}>
        <button className="f-cfc-action-btn" onClick={onEdit} title="Editar" style={{ width:30, height:30 }}><Icon name="edit" size={13}/></button>

        {item.status === 'Aguardando revisão' && (
          <>
            <SmallBtn color="#EF4444" bg="rgba(239,68,68,0.10)" border="rgba(239,68,68,0.25)" onClick={onReject}><Icon name="xmark" size={12}/> Reprovar</SmallBtn>
            <SmallBtn color="#F59E0B" bg="rgba(245,158,11,0.10)" border="rgba(245,158,11,0.25)" onClick={onRequestAdjust}><Icon name="refresh" size={12}/> Ajuste</SmallBtn>
            <SmallBtn color="#22C55E" bg="rgba(34,197,94,0.10)" border="rgba(34,197,94,0.25)" onClick={onApprove}><Icon name="thumbsup" size={12}/> Aprovar</SmallBtn>
          </>
        )}
        {item.status === 'Ajustes solicitados' && (
          <SmallBtn color="#22C55E" bg="rgba(34,197,94,0.10)" border="rgba(34,197,94,0.25)" onClick={onApprove}><Icon name="thumbsup" size={12}/> Aprovar assim mesmo</SmallBtn>
        )}
        {item.status === 'Aprovado' && (
          <SmallBtn color="#3B82F6" bg="rgba(59,130,246,0.10)" border="rgba(59,130,246,0.25)" onClick={onRelease}><Icon name="zap" size={12}/> Liberar p/ cliente</SmallBtn>
        )}
        {item.status === 'Liberado p/ cliente' && (
          <span style={{ fontSize:11, color:'#3B82F6', display:'flex', alignItems:'center', gap:4 }}><Icon name="check" size={12}/> Liberado</span>
        )}
        {item.status === 'Reprovado' && (
          <span style={{ fontSize:11, color:'#8B5CF6', display:'flex', alignItems:'center', gap:4 }}><Icon name="xmark" size={12}/> Reprovado</span>
        )}
        <button className="f-btn-ghost" onClick={onView} style={{ fontSize:11, padding:'4px 10px', display:'flex', alignItems:'center', gap:4 }}><Icon name="eye" size={12}/> Ver</button>
      </div>
    </div>
  )
}

function SmallBtn({ color, bg, border, onClick, children }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:7, background:bg, border:`1px solid ${border}`, color, cursor:'pointer', fontWeight:600, fontSize:11, fontFamily:'var(--f-font)', whiteSpace:'nowrap' }}>
      {children}
    </button>
  )
}

function MiniModal({ title, icon, iconColor, placeholder, value, onChange, onCancel, onConfirm, confirmLabel, confirmColor, confirmBg, confirmBorder }) {
  const ref = useRef(null)
  useEffect(() => { setTimeout(() => ref.current?.focus(), 80) }, [])
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(5px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:'overlayIn 0.18s ease' }} onClick={onCancel}>
      <div style={{ width:'100%', maxWidth:420, background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:24, boxShadow:'0 32px 96px rgba(0,0,0,0.7)', animation:'modalIn 0.22s cubic-bezier(.4,0,.2,1)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:`${iconColor}18`, border:`1px solid ${iconColor}30`, display:'flex', alignItems:'center', justifyContent:'center', color:iconColor, flexShrink:0 }}>
            <Icon name={icon} size={16}/>
          </div>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', margin:0 }}>{title}</h3>
        </div>
        <textarea ref={ref} className="f-input" rows={4} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={{ resize:'vertical', minHeight:90, marginBottom:14 }}/>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="f-btn-ghost" onClick={onCancel}>Cancelar</button>
          <button onClick={onConfirm} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, background:confirmBg, border:`1px solid ${confirmBorder}`, color:confirmColor, cursor:'pointer', fontWeight:600, fontSize:13, fontFamily:'var(--f-font)' }}>
            <Icon name={icon} size={13}/>{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
