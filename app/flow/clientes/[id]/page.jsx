'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import FlowHeader from '@/components/flow/FlowHeader'
import StatusBadge from '@/components/flow/StatusBadge'
import MetricCard from '@/components/flow/MetricCard'
import Icon from '@/components/flow/FlowIcons'

// ─── Mock operation data (client-specific) ────────────────────────────────────

const MOCK_CONTENTS = [
  { title:'Reels — Antes e Depois',  format:'Reels',    deadline:'28 Mai', status:'Produção',             responsible:'Ana Lima'   },
  { title:'Carrossel — Dicas',       format:'Carrossel',deadline:'31 Mai', status:'Briefing',             responsible:'Pedro H.'   },
  { title:'Stories — Semana 4',      format:'Stories',  deadline:'01 Jun', status:'Agendado',             responsible:'Ana Lima'   },
  { title:'Post Feed — Resultado',   format:'Feed',     deadline:'25 Mai', status:'Publicado',            responsible:'Carlos M.'  },
  { title:'Reels — Treino Especial', format:'Reels',    deadline:'26 Mai', status:'Aguardando Aprovação', responsible:'Pedro H.'   },
]

const MOCK_APPROVALS = [
  { title:'Reels — Treino Especial', status:'Aguardando revisão',  date:'26 Mai' },
  { title:'Post — Semana 3',         status:'Liberado p/ cliente', date:'22 Mai' },
]

const STATUS_COLOR = {
  Ativo:'#22C55E', Pausado:'#EF4444', 'Em onboarding':'#3B82F6', Atenção:'#F59E0B',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { id } = useParams()
  const [client,  setClient]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('bbold_flow_clients')
      if (raw) {
        const list = JSON.parse(raw)
        setClient(list.find(c => c.id === String(id)) ?? null)
      }
    } catch {}
    setLoading(false)
  }, [id])

  if (loading) {
    return (
      <>
        <FlowHeader title="Carregando…" subtitle="" />
        <main className="f-content">
          <div style={{ padding:60, textAlign:'center', color:'var(--f-muted)' }}>
            <Icon name="refresh" size={28}/>
          </div>
        </main>
      </>
    )
  }

  if (!client) {
    return (
      <>
        <FlowHeader title="Cliente não encontrado" subtitle="" actions={
          <Link href="/flow/clientes" className="f-btn-ghost"><Icon name="arrow" size={14} style={{ transform:'rotate(180deg)' }}/> Voltar</Link>
        }/>
        <main className="f-content">
          <div className="f-empty-state" style={{ paddingTop:80 }}>
            <Icon name="alert" size={40}/>
            <h3>Este cliente não existe ou foi removido.</h3>
            <p>Verifique a lista de clientes.</p>
            <Link href="/flow/clientes" className="f-btn-primary" style={{ marginTop:12, textDecoration:'none' }}>
              <Icon name="users" size={14}/> Ver todos os clientes
            </Link>
          </div>
        </main>
      </>
    )
  }

  const accentColor = client.color || '#FFD22E'
  const statusColor = STATUS_COLOR[client.status] || '#A1A1AA'

  return (
    <>
      <FlowHeader
        title={client.name}
        subtitle={`${client.niche} · Plano ${client.plan}`}
        actions={
          <Link href="/flow/clientes" className="f-btn-ghost" style={{ textDecoration:'none' }}>
            <Icon name="arrow" size={14} style={{ transform:'rotate(180deg)' }}/> Voltar
          </Link>
        }
      />

      <main className="f-content">
        {/* Client profile card */}
        <div className="f-card">
          <div style={{ padding:'24px', display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'flex-start' }}>
            {/* Avatar */}
            <div style={{ width:72, height:72, borderRadius:18, background:`${accentColor}20`, border:`2px solid ${accentColor}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:900, color:accentColor, flexShrink:0 }}>
              {client.initials}
            </div>

            {/* Info grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'12px 24px' }}>
              <InfoRow label="Status">
                <StatusBadge status={client.status}/>
              </InfoRow>
              <InfoRow label="Plano">{client.plan}</InfoRow>
              <InfoRow label="Responsável">{client.responsible}</InfoRow>
              <InfoRow label="Conteúdos/mês">
                <span style={{ fontWeight:800, color:accentColor, fontSize:16 }}>{client.contents}</span>
              </InfoRow>
              {client.instagram && (
                <InfoRow label="Instagram">
                  <span style={{ color:'var(--f-muted)' }}>{client.instagram}</span>
                </InfoRow>
              )}
              {client.whatsapp && (
                <InfoRow label="WhatsApp">
                  <span style={{ color:'var(--f-muted)' }}>{client.whatsapp}</span>
                </InfoRow>
              )}
              {client.email && (
                <InfoRow label="E-mail">
                  <span style={{ color:'var(--f-muted)', fontSize:12 }}>{client.email}</span>
                </InfoRow>
              )}
              {client.observations && (
                <InfoRow label="Observações" full>
                  <span style={{ color:'var(--f-muted)', lineHeight:1.5 }}>{client.observations}</span>
                </InfoRow>
              )}
            </div>
          </div>
        </div>

        {/* Operation metrics */}
        <div className="f-metrics-grid">
          <MetricCard icon="file"     value={String(client.contents)} label="Conteúdos/mês"    desc="contratados no plano"    accentColor={accentColor} trend={8}   />
          <MetricCard icon="check"    value="2"                        label="Em aprovação"      desc="aguardando revisão"      accentColor="#F59E0B"     trend={0}   />
          <MetricCard icon="calendar" value="12"                       label="Publicados"        desc="neste mês"               accentColor="#22C55E"     trend={20}  />
          <MetricCard icon="trending" value="6.4%"                     label="Engajamento médio" desc="vs. mês anterior"        accentColor="#3B82F6"     trend={15}  />
        </div>

        {/* Two-column grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, alignItems:'start' }}>
          {/* Conteúdos */}
          <div className="f-card">
            <div className="f-card-header">
              <div>
                <h2 className="f-card-title">Conteúdos do Cliente</h2>
                <p className="f-card-subtitle">Produção em andamento</p>
              </div>
              <Link href="/flow/conteudos" className="f-btn-ghost" style={{ textDecoration:'none', fontSize:12 }}>
                Ver todos <Icon name="arrow" size={13}/>
              </Link>
            </div>
            <div>
              {MOCK_CONTENTS.map((c, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom: i < MOCK_CONTENTS.length - 1 ? '1px solid var(--f-border)' : 'none' }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid var(--f-border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--f-muted)', flexShrink:0 }}>
                    <Icon name="file" size={14}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--f-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                    <div style={{ fontSize:11, color:'var(--f-muted)', marginTop:2 }}>{c.format} · {c.responsible}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                    <StatusBadge status={c.status}/>
                    <span style={{ fontSize:10, color:'var(--f-muted)' }}>{c.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Aprovações */}
            <div className="f-card">
              <div className="f-card-header" style={{ padding:'14px 18px 12px' }}>
                <div>
                  <h2 className="f-card-title" style={{ fontSize:14 }}>Aprovações</h2>
                  <p className="f-card-subtitle">Pendentes de revisão</p>
                </div>
                <Link href="/flow/aprovacoes" className="f-btn-ghost" style={{ textDecoration:'none', fontSize:11 }}>Ver <Icon name="arrow" size={12}/></Link>
              </div>
              <div>
                {MOCK_APPROVALS.map((a, i) => (
                  <div key={i} style={{ padding:'10px 18px', borderBottom: i < MOCK_APPROVALS.length - 1 ? '1px solid var(--f-border)' : 'none' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--f-text)', marginBottom:4 }}>{a.title}</div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <StatusBadge status={a.status}/>
                      <span style={{ fontSize:10, color:'var(--f-muted)' }}>{a.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="f-card">
              <div className="f-card-header" style={{ padding:'14px 18px 12px' }}>
                <h2 className="f-card-title" style={{ fontSize:14 }}>Acesso Rápido</h2>
              </div>
              <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:6 }}>
                {[
                  { label:'Calendário', icon:'calendar', href:'/flow/calendario' },
                  { label:'Biblioteca', icon:'folder',   href:'/flow/biblioteca' },
                  { label:'Performance',icon:'chart',    href:'/flow/performance' },
                  { label:'Workflow',   icon:'workflow', href:'/flow/workflow' },
                ].map(item => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="f-nav-item"
                    style={{ textDecoration:'none', borderRadius:8, padding:'8px 10px' }}
                  >
                    <span className="f-nav-icon"><Icon name={item.icon} size={15}/></span>
                    <span className="f-nav-text">{item.label}</span>
                    <Icon name="arrow" size={13}/>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

function InfoRow({ label, children, full }) {
  return (
    <div style={full ? { gridColumn:'1 / -1' } : {}}>
      <span style={{ display:'block', fontSize:10, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:600, color:'var(--f-text)', display:'block' }}>{children}</span>
    </div>
  )
}
