'use client'

import { useEffect } from 'react'
import Icon from './FlowIcons'
import StatusBadge from './StatusBadge'

const STATUS_CFG = {
  'Briefing':             { color:'#8B5CF6', bg:'rgba(139,92,246,0.15)' },
  'Produção':             { color:'#3B82F6', bg:'rgba(59,130,246,0.15)' },
  'Revisão':              { color:'#F59E0B', bg:'rgba(245,158,11,0.15)' },
  'Aguardando Aprovação': { color:'#F59E0B', bg:'rgba(245,158,11,0.15)' },
  'Agendado':             { color:'#22C55E', bg:'rgba(34,197,94,0.15)' },
  'Publicado':            { color:'#A1A1AA', bg:'rgba(161,161,170,0.15)' },
  'Atrasado':             { color:'#EF4444', bg:'rgba(239,68,68,0.15)' },
}

function fmtDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-')
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return `${Number(d)} de ${months[Number(m) - 1]} de ${y}`
}

export default function ContentDetailModal({ isOpen, onClose, content, onEdit }) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen || !content) return null

  const cfg = STATUS_CFG[content.status] ?? { color:'#A1A1AA', bg:'rgba(161,161,170,0.15)' }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0', animation:'overlayIn 0.18s ease' }}
      onClick={onClose}
    >
      <div
        style={{ width:'100%', maxWidth:640, maxHeight:'92vh', overflowY:'auto', background:'#1E1E1E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px 20px 0 0', boxShadow:'0 -24px 80px rgba(0,0,0,0.6)', animation:'slideUp 0.28s cubic-bezier(.4,0,.2,1)', scrollbarWidth:'thin' }}
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
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                <span
                  style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.color}30` }}
                >
                  {content.status}
                </span>
                <StatusBadge status={content.priority}/>
                {content.format && (
                  <span className="f-format-chip" style={{ fontSize:11 }}>{content.format}</span>
                )}
              </div>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', lineHeight:1.3 }}>
                {content.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#A1A1AA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
            >
              <Icon name="xmark" size={16}/>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:20 }}>

          {/* Key info grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <InfoBlock icon="users" label="Cliente" value={content.client}/>
            <InfoBlock icon="file"  label="Formato" value={content.format}/>
            <InfoBlock icon="bell"  label="Canal"   value={content.channel || '—'}/>
            <InfoBlock icon="user"  label="Responsável" value={content.responsible}/>
            <InfoBlock icon="calendar" label="Data de publicação" value={fmtDate(content.pubDate) || '—'}/>
            <InfoBlock icon="clock"    label="Horário" value={content.pubTime || '—'}/>
          </div>

          {/* Attachment placeholder */}
          <div>
            <span style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Anexo / Arquivo</span>
            <div style={{ border:'2px dashed rgba(255,255,255,0.1)', borderRadius:12, padding:'28px 20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, color:'var(--f-muted)', background:'rgba(255,255,255,0.02)', cursor:'not-allowed' }}>
              {content.format === 'Reels' || content.format === 'Stories' ? (
                <Icon name="video" size={28}/>
              ) : content.format === 'Blog' || content.format === 'Landing Page' ? (
                <Icon name="doc" size={28}/>
              ) : (
                <Icon name="image" size={28}/>
              )}
              <span style={{ fontSize:12, fontWeight:500 }}>
                {content.format === 'Reels' ? 'Vídeo do Reels' :
                 content.format === 'Stories' ? 'Vídeo/Imagem do Stories' :
                 content.format === 'Carrossel' ? 'Slides do Carrossel' :
                 content.format === 'Feed' ? 'Imagem do Feed' :
                 content.format === 'Blog' ? 'Texto do Blog' :
                 'Arquivo'}
              </span>
              <span style={{ fontSize:11, color:'var(--f-muted-dim)' }}>Upload de arquivos em breve</span>
            </div>
          </div>

          {/* Copy / Legenda */}
          {content.copy ? (
            <div>
              <span style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Legenda / Copy</span>
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px', fontSize:13, color:'var(--f-text)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>
                {content.copy}
              </div>
            </div>
          ) : (
            <EmptyField icon="doc" label="Legenda / Copy" hint="Nenhuma legenda cadastrada"/>
          )}

          {/* Link */}
          {content.link ? (
            <div>
              <span style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Link de referência</span>
              <a
                href={content.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize:13, color:'var(--f-yellow)', textDecoration:'none', display:'flex', alignItems:'center', gap:6, wordBreak:'break-all' }}
              >
                <Icon name="arrow" size={13}/>{content.link}
              </a>
            </div>
          ) : null}

          {/* Observations */}
          {content.observations ? (
            <div>
              <span style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Observações</span>
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px', fontSize:13, color:'var(--f-muted)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>
                {content.observations}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 22px 32px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:10, justifyContent:'flex-end', position:'sticky', bottom:0, background:'#1E1E1E' }}>
          <button className="f-btn-ghost" onClick={onClose}>Fechar</button>
          <button
            className="f-btn-primary"
            onClick={() => { onClose(); onEdit() }}
          >
            <Icon name="edit" size={14}/> Editar conteúdo
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoBlock({ icon, label, value }) {
  return (
    <div>
      <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>
        <Icon name={icon} size={11}/>{label}
      </span>
      <span style={{ fontSize:13, fontWeight:600, color:'var(--f-text)' }}>{value}</span>
    </div>
  )
}

function EmptyField({ icon, label, hint }) {
  return (
    <div>
      <span style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>{label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(255,255,255,0.02)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' }}>
        <Icon name={icon} size={15} style={{ color:'var(--f-muted-dim)', flexShrink:0 }}/>
        <span style={{ fontSize:12, color:'var(--f-muted-dim)' }}>{hint}</span>
      </div>
    </div>
  )
}
