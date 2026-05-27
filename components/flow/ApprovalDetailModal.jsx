'use client'

import { useEffect } from 'react'
import Icon from './FlowIcons'
import StatusBadge from './StatusBadge'

const PRIORITY_CFG = {
  'Baixa':   { color:'#A1A1AA', bg:'rgba(161,161,170,0.15)' },
  'Média':   { color:'#3B82F6', bg:'rgba(59,130,246,0.15)' },
  'Alta':    { color:'#F59E0B', bg:'rgba(245,158,11,0.15)' },
  'Urgente': { color:'#EF4444', bg:'rgba(239,68,68,0.15)' },
}

const STATUS_CFG = {
  'Aguardando revisão':  { color:'#F59E0B', bg:'rgba(245,158,11,0.15)' },
  'Ajustes solicitados': { color:'#EF4444', bg:'rgba(239,68,68,0.15)' },
  'Liberado p/ cliente': { color:'#3B82F6', bg:'rgba(59,130,246,0.15)' },
  'Aprovado':            { color:'#22C55E', bg:'rgba(34,197,94,0.15)' },
  'Reprovado':           { color:'#8B5CF6', bg:'rgba(139,92,246,0.15)' },
}

function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${Number(d)} ${months[Number(m)-1]} ${y}`
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
}

export default function ApprovalDetailModal({ isOpen, onClose, approval, onEdit, onApprove, onRelease, onRequestAdjust, onReject }) {
  useEffect(() => {
    if (!isOpen) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  if (!isOpen || !approval) return null

  const sCfg = STATUS_CFG[approval.status] ?? { color:'#A1A1AA', bg:'rgba(161,161,170,0.15)' }
  const pCfg = PRIORITY_CFG[approval.priority] ?? { color:'#A1A1AA', bg:'rgba(161,161,170,0.15)' }
  const isPast = approval.deadline && new Date(approval.deadline) < new Date(new Date().toDateString())
  const isEditable = !['Aprovado','Liberado p/ cliente'].includes(approval.status)

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center', animation:'overlayIn 0.18s ease' }}
      onClick={onClose}
    >
      <div
        style={{ width:'100%', maxWidth:640, maxHeight:'94vh', overflowY:'auto', background:'#1E1E1E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px 20px 0 0', boxShadow:'0 -24px 80px rgba(0,0,0,0.6)', animation:'slideUp 0.28s cubic-bezier(.4,0,.2,1)', scrollbarWidth:'thin' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:36, height:4, borderRadius:99, background:'rgba(255,255,255,0.15)' }}/>
        </div>

        {/* Header */}
        <div style={{ padding:'12px 22px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, color:sCfg.color, background:sCfg.bg, border:`1px solid ${sCfg.color}30` }}>{approval.status}</span>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, color:pCfg.color, background:pCfg.bg, border:`1px solid ${pCfg.color}30` }}>{approval.priority}</span>
                {approval.format && <span className="f-format-chip" style={{ fontSize:11 }}>{approval.format}</span>}
              </div>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', lineHeight:1.3 }}>{approval.title}</h2>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#A1A1AA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="xmark" size={16}/>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:18 }}>
          {/* Info grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Info icon="users"    label="Cliente"      value={approval.client}/>
            <Info icon="file"     label="Formato"      value={approval.format}/>
            <Info icon="user"     label="Responsável"  value={approval.responsible}/>
            <Info icon="calendar" label="Prazo" value={
              <span style={{ color: isPast ? '#EF4444' : 'var(--f-text)', fontWeight:600, fontSize:13 }}>
                {fmtDate(approval.deadline)}{isPast ? ' ⚠ Vencido' : ''}
              </span>
            }/>
          </div>

          {/* Copy */}
          {approval.copy ? (
            <Section label="Legenda / Copy">
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px', fontSize:13, color:'var(--f-text)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>
                {approval.copy}
              </div>
            </Section>
          ) : null}

          {/* Observations */}
          {approval.observations ? (
            <Section label="Observações">
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px', fontSize:13, color:'var(--f-muted)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>
                {approval.observations}
              </div>
            </Section>
          ) : null}

          {/* Timeline */}
          <Section label="Histórico">
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <TimelineItem icon="plus"    label="Criado em"       value={fmtDateTime(approval.createdAt)} color="#A1A1AA"/>
              {approval.updatedAt !== approval.createdAt && (
                <TimelineItem icon="refresh" label="Última atualização" value={fmtDateTime(approval.updatedAt)} color="#3B82F6"/>
              )}
              <TimelineItem
                icon={approval.status === 'Aprovado' ? 'thumbsup' : approval.status === 'Reprovado' ? 'xmark' : approval.status === 'Liberado p/ cliente' ? 'check' : 'clock'}
                label="Status atual"
                value={approval.status}
                color={sCfg.color}
              />
            </div>
          </Section>
        </div>

        {/* Action footer */}
        <div style={{ padding:'14px 22px 32px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', flexWrap:'wrap', gap:8, position:'sticky', bottom:0, background:'#1E1E1E' }}>
          <button className="f-btn-ghost" onClick={onClose} style={{ marginRight:'auto' }}>Fechar</button>

          {isEditable && (
            <button className="f-btn-ghost" onClick={() => { onClose(); onEdit() }} style={{ fontSize:12 }}>
              <Icon name="edit" size={13}/> Editar
            </button>
          )}

          {approval.status === 'Aguardando revisão' && (
            <>
              <ActionBtn color="#EF4444" bg="rgba(239,68,68,0.12)" border="rgba(239,68,68,0.3)" onClick={() => { onClose(); onReject() }}>
                <Icon name="xmark" size={13}/> Reprovar
              </ActionBtn>
              <ActionBtn color="#F59E0B" bg="rgba(245,158,11,0.12)" border="rgba(245,158,11,0.3)" onClick={() => { onClose(); onRequestAdjust() }}>
                <Icon name="refresh" size={13}/> Solicitar ajuste
              </ActionBtn>
              <ActionBtn color="#22C55E" bg="rgba(34,197,94,0.12)" border="rgba(34,197,94,0.3)" onClick={() => { onClose(); onApprove() }}>
                <Icon name="thumbsup" size={13}/> Aprovar
              </ActionBtn>
            </>
          )}

          {approval.status === 'Ajustes solicitados' && (
            <>
              <ActionBtn color="#EF4444" bg="rgba(239,68,68,0.12)" border="rgba(239,68,68,0.3)" onClick={() => { onClose(); onReject() }}>
                <Icon name="xmark" size={13}/> Reprovar
              </ActionBtn>
              <ActionBtn color="#22C55E" bg="rgba(34,197,94,0.12)" border="rgba(34,197,94,0.3)" onClick={() => { onClose(); onApprove() }}>
                <Icon name="thumbsup" size={13}/> Aprovar assim mesmo
              </ActionBtn>
            </>
          )}

          {approval.status === 'Aprovado' && (
            <ActionBtn color="#3B82F6" bg="rgba(59,130,246,0.12)" border="rgba(59,130,246,0.3)" onClick={() => { onClose(); onRelease() }}>
              <Icon name="zap" size={13}/> Liberar p/ cliente
            </ActionBtn>
          )}
        </div>
      </div>
    </div>
  )
}

function Info({ icon, label, value }) {
  return (
    <div>
      <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>
        <Icon name={icon} size={11}/>{label}
      </span>
      {typeof value === 'string'
        ? <span style={{ fontSize:13, fontWeight:600, color:'var(--f-text)' }}>{value || '—'}</span>
        : value}
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div>
      <span style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>{label}</span>
      {children}
    </div>
  )
}

function TimelineItem({ icon, label, value, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:24, height:24, borderRadius:6, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color }}>
        <Icon name={icon} size={12}/>
      </div>
      <span style={{ fontSize:12, color:'var(--f-muted)', minWidth:130 }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600, color:'var(--f-text)' }}>{value}</span>
    </div>
  )
}

function ActionBtn({ color, bg, border, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:8, background:bg, border:`1px solid ${border}`, color, cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'var(--f-font)', transition:'opacity 0.15s' }}
    >
      {children}
    </button>
  )
}
