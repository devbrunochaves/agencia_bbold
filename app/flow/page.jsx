'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FlowHeader from '@/components/flow/FlowHeader'
import MetricCard from '@/components/flow/MetricCard'
import StatusBadge from '@/components/flow/StatusBadge'
import Icon from '@/components/flow/FlowIcons'
import { supabase } from '@/lib/supabase'

const FORMAT_COLORS = {
  'Reels':     '#FFD22E',
  'Feed':      '#22C55E',
  'Stories':   '#3B82F6',
  'Carrossel': '#8B5CF6',
  'Blog':      '#F59E0B',
  'Landing':   '#06B6D4',
}

const CLIENT_STATUS_COLOR = { Ativo: '#22C55E', Atenção: '#F59E0B', Pausado: '#EF4444' }

const KANBAN_COLS = [
  { id: 'Briefing',             label: 'Briefing',  color: '#8B5CF6' },
  { id: 'Produção',             label: 'Produção',  color: '#3B82F6' },
  { id: 'Aguardando Aprovação', label: 'Aprovação', color: '#F59E0B' },
  { id: 'Agendado',             label: 'Agendado',  color: '#22C55E' },
  { id: 'Publicado',            label: 'Publicado', color: '#A1A1AA' },
]

const WEEK_LABELS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTH_PT    = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtDate(iso) {
  if (!iso) return '—'
  const [,m,d] = iso.split('-')
  return `${Number(d)} ${MONTH_PT[Number(m)-1]}`
}

function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(' ').filter(Boolean)
  return p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : p[0].slice(0,2).toUpperCase()
}

export default function FlowDashboard() {
  const router = useRouter()
  const now    = new Date()

  const [loading,  setLoading]  = useState(true)
  const [contents, setContents] = useState([])
  const [clients,  setClients]  = useState([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: cData }, { data: clData }] = await Promise.all([
        supabase.from('contents')
          .select('id,title,format,status,client,responsible,pub_date,priority')
          .order('pub_date', { ascending: true }),
        supabase.from('clients')
          .select('id,name,niche,color,status')
          .order('name'),
      ])
      setContents(cData ?? [])
      setClients(clData  ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // ── Metrics ─────────────────────────────────────────────────────────────────
  const monthStr            = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const activeClients       = clients.filter(c => c.status === 'Ativo').length
  const inProduction        = contents.filter(c => !['Publicado','Atrasado'].includes(c.status)).length
  const pendingApprovals    = contents.filter(c => c.status === 'Aguardando Aprovação').length
  const publishedThisMonth  = contents.filter(c => c.status === 'Publicado' && c.pub_date?.startsWith(monthStr)).length

  // ── Workflow table: active items (non-published), up to 8 ──────────────────
  const workflowItems = contents.filter(c => c.status !== 'Publicado').slice(0, 8)

  // ── Kanban grouping ─────────────────────────────────────────────────────────
  const kanban = {}
  KANBAN_COLS.forEach(c => { kanban[c.id] = [] })
  contents.forEach(c => { if (kanban[c.status]) kanban[c.status].push(c) })

  // ── Calendar: current month ─────────────────────────────────────────────────
  const calContents = contents.filter(c => c.pub_date?.startsWith(monthStr))
  const calEvents   = {}
  calContents.forEach(c => {
    const d = parseInt(c.pub_date.split('-')[2])
    if (!calEvents[d]) calEvents[d] = []
    calEvents[d].push(c.format)
  })
  const firstDay  = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
  const totalDays = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()
  const calCells  = []
  for (let i = 0; i < firstDay; i++) calCells.push(null)
  for (let d = 1; d <= totalDays; d++) calCells.push(d)

  // ── Top clients with content count ─────────────────────────────────────────
  const cCount = {}
  contents.forEach(c => { if (c.client) cCount[c.client] = (cCount[c.client] || 0) + 1 })
  const topClients = clients
    .map(c => ({ ...c, contentCount: cCount[c.name] || 0 }))
    .sort((a,b) => b.contentCount - a.contentCount)
    .slice(0, 4)

  // ── Legend: formats present in this month ───────────────────────────────────
  const legendFormats = [...new Set(calContents.map(c => c.format))].filter(f => FORMAT_COLORS[f])

  return (
    <>
      <FlowHeader
        title="Cockpit Interno"
        subtitle="Controle sua operação de conteúdo em um único fluxo."
        actions={
          <>
            <button className="f-btn-secondary" onClick={() => router.push('/flow/conteudos')}>
              <Icon name="plus" size={14} /> <span>Novo Conteúdo</span>
            </button>
            <button className="f-btn-primary" onClick={() => router.push('/flow/clientes')}>
              <Icon name="plus" size={14} /> <span>Novo Cliente</span>
            </button>
          </>
        }
      />
      <main className="f-content">

        {/* Metrics */}
        <div className="f-metrics-grid">
          <MetricCard icon="users"    value={loading ? '…' : String(activeClients)}      label="Clientes Ativos"      desc={`${clients.length} total`}            accentColor="#FFD22E" />
          <MetricCard icon="file"     value={loading ? '…' : String(inProduction)}       label="Em Produção"          desc="Conteúdos ativos"                     accentColor="#3B82F6" />
          <MetricCard icon="clock"    value={loading ? '…' : String(pendingApprovals)}   label="Aprovações Pendentes" desc="Aguardando aprovação"                  accentColor="#F59E0B" />
          <MetricCard icon="trending" value={loading ? '…' : String(publishedThisMonth)} label="Publicações no Mês"   desc={MONTH_NAMES[now.getMonth()]}          accentColor="#22C55E" />
        </div>

        {/* Workflow Table */}
        <div className="f-card">
          <div className="f-card-header">
            <div>
              <h2 className="f-card-title">Workflow Ativo</h2>
              <p className="f-card-subtitle">Conteúdos em andamento · {workflowItems.length} itens</p>
            </div>
            <button className="f-btn-ghost" onClick={() => router.push('/flow/conteudos')}>
              Ver todos <Icon name="arrow" size={14} />
            </button>
          </div>
          {loading ? (
            <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--f-muted)' }}>Carregando...</div>
          ) : workflowItems.length === 0 ? (
            <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--f-muted)', fontSize:13 }}>Nenhum conteúdo ativo.</div>
          ) : (
            <div className="f-table-wrap">
              <table className="f-table">
                <thead>
                  <tr><th>Conteúdo</th><th>Cliente</th><th>Formato</th><th>Prazo</th><th>Responsável</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {workflowItems.map(item => (
                    <tr key={item.id} className="f-table-row">
                      <td><span className="f-content-title">{item.title}</span></td>
                      <td><span className="f-client-chip">{item.client}</span></td>
                      <td><span className="f-format-chip">{item.format}</span></td>
                      <td>
                        <span className={`f-deadline${item.status === 'Atrasado' ? ' is-late' : ''}`}>
                          <Icon name="clock" size={12} />{fmtDate(item.pub_date)}
                        </span>
                      </td>
                      <td>
                        <div className="f-responsible">
                          <div className="f-avatar-sm">{initials(item.responsible)}</div>
                          <span>{item.responsible || '—'}</span>
                        </div>
                      </td>
                      <td><StatusBadge status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Kanban */}
        <div className="f-card">
          <div className="f-card-header">
            <div>
              <h2 className="f-card-title">Kanban de Produção</h2>
              <p className="f-card-subtitle">Visão por etapa do fluxo</p>
            </div>
            <button className="f-btn-ghost" onClick={() => router.push('/flow/workflow')}>
              Ver workflow <Icon name="arrow" size={14} />
            </button>
          </div>
          {loading ? (
            <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--f-muted)' }}>Carregando...</div>
          ) : (
            <div className="f-kanban">
              {KANBAN_COLS.map(col => (
                <div key={col.id} className="f-kanban-col">
                  <div className="f-kanban-col-head">
                    <span className="f-kanban-dot" style={{ background: col.color }} />
                    <span className="f-kanban-label">{col.label}</span>
                    <span className="f-kanban-count">{kanban[col.id].length}</span>
                  </div>
                  <div className="f-kanban-cards">
                    {kanban[col.id].slice(0, 5).map(card => (
                      <div key={card.id} className="f-kanban-card">
                        <span className="f-kanban-card-accent" style={{ background: col.color }} />
                        <div className="f-kanban-card-body">
                          <span className="f-kanban-card-title">{card.title}</span>
                          <span className="f-kanban-card-client">{card.client}</span>
                        </div>
                      </div>
                    ))}
                    {kanban[col.id].length > 5 && (
                      <div style={{ padding:'5px 8px', fontSize:11, color:'var(--f-muted)', textAlign:'center' }}>
                        +{kanban[col.id].length - 5} mais
                      </div>
                    )}
                    {kanban[col.id].length === 0 && (
                      <div style={{ padding:'10px 8px', fontSize:11, color:'var(--f-muted-dim)', textAlign:'center' }}>Vazio</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div className="f-bottom-row">

          {/* Editorial Calendar */}
          <div className="f-card f-calendar-card">
            <div className="f-card-header">
              <div>
                <h2 className="f-card-title">Calendário Editorial</h2>
                <p className="f-card-subtitle">{MONTH_NAMES[now.getMonth()]} {now.getFullYear()}</p>
              </div>
            </div>
            {loading ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--f-muted)' }}>Carregando...</div>
            ) : (
              <>
                <div className="f-cal-week-row">
                  {WEEK_LABELS.map(d => <span key={d} className="f-cal-week-label">{d}</span>)}
                </div>
                <div className="f-cal-grid">
                  {calCells.map((day, i) => (
                    <div key={i} className={`f-cal-day${!day ? ' is-empty' : ''}${day === now.getDate() ? ' is-today' : ''}`} style={{ minHeight:40 }}>
                      {day && (
                        <>
                          <span className="f-cal-num">{day}</span>
                          {calEvents[day] && (
                            <span className="f-cal-dot" style={{ background: FORMAT_COLORS[calEvents[day][0]] ?? 'var(--f-muted)' }} />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {legendFormats.length > 0 && (
                  <div className="f-cal-legend">
                    {legendFormats.map(fmt => (
                      <span key={fmt} className="f-cal-legend-item">
                        <span className="f-cal-dot" style={{ background: FORMAT_COLORS[fmt] }} />{fmt}
                      </span>
                    ))}
                    {calContents.some(c => c.status === 'Atrasado') && (
                      <span className="f-cal-legend-item">
                        <span className="f-cal-dot" style={{ background: '#EF4444' }} />Atrasado
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Client Cards */}
          <div className="f-card f-clients-card">
            <div className="f-card-header">
              <div>
                <h2 className="f-card-title">Clientes em Destaque</h2>
                <p className="f-card-subtitle">Operação do mês</p>
              </div>
              <button className="f-btn-ghost" onClick={() => router.push('/flow/clientes')}>
                Ver todos <Icon name="arrow" size={14} />
              </button>
            </div>
            {loading ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--f-muted)' }}>Carregando...</div>
            ) : topClients.length === 0 ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--f-muted)', fontSize:13 }}>Nenhum cliente cadastrado.</div>
            ) : (
              <div className="f-clients-grid">
                {topClients.map(c => {
                  const sc  = CLIENT_STATUS_COLOR[c.status] ?? '#A1A1AA'
                  const ini = initials(c.name)
                  return (
                    <div key={c.id} className="f-client-card" onClick={() => router.push(`/flow/clientes/${c.id}`)}>
                      <div className="f-client-card-top">
                        <div className="f-client-avatar" style={{ color: c.color || 'var(--f-yellow)' }}>{ini}</div>
                        <span className="f-client-status-dot" style={{ background: sc }} />
                      </div>
                      <div className="f-client-name">{c.name}</div>
                      <div className="f-client-niche">{c.niche || '—'}</div>
                      <div className="f-client-footer">
                        <div className="f-client-stat">
                          <span className="f-client-stat-val">{c.contentCount}</span>
                          <span className="f-client-stat-lbl">conteúdos</span>
                        </div>
                        <span className="f-client-badge" style={{ color: sc, background: `${sc}18` }}>{c.status || 'Ativo'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  )
}
