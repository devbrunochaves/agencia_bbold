'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import FlowHeader from '@/components/flow/FlowHeader'
import StatusBadge from '@/components/flow/StatusBadge'
import MetricCard from '@/components/flow/MetricCard'
import Icon from '@/components/flow/FlowIcons'
import { supabase } from '@/lib/supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_PERF     = 'bbold_flow_performance'
const LS_CONTENTS = 'bbold_flow_contents'
const LS_APPROVALS= 'bbold_flow_approvals'

const METRIC_OPTIONS = [
  'Seguidores Instagram',
  'Seguidores TikTok',
  'Seguidores Facebook',
  'Seguidores YouTube',
  'Engajamento (%)',
  'Alcance médio',
  'Impressões',
  'Cliques no perfil',
  'Visitas ao site',
  'Outro',
]

const WEEK_LABELS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const MONTH_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().split('T')[0] }

function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d} ${MONTH_SHORT[Number(m)-1]} ${y}`
}

function calcGrowthPct(prev, curr) {
  if (prev == null) return null
  if (prev === 0) return curr > 0 ? null : 0
  return ((curr - prev) / Math.abs(prev)) * 100
}

function fmtPct(pct) {
  if (pct == null) return '—'
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

function fmtDiff(prev, curr) {
  if (prev == null) return '—'
  const d = curr - prev
  const s = d >= 0 ? '+' : ''
  return `${s}${d.toLocaleString('pt-BR')}`
}

function groupByMetric(records) {
  const g = {}
  for (const r of records) {
    if (!g[r.metric]) g[r.metric] = []
    g[r.metric].push(r)
  }
  for (const k in g) g[k].sort((a,b) => a.recordedAt.localeCompare(b.recordedAt))
  return g
}

function buildCells(year, month) {
  const first = new Date(year, month, 1).getDay()
  const days  = new Date(year, month + 1, 0).getDate()
  const cells = Array(first).fill(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  while (cells.length % 7) cells.push(null)
  return cells
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer',
        background:'transparent', border:'none', fontFamily:'inherit',
        color: active ? 'var(--f-yellow)' : 'var(--f-muted)',
        borderBottom: active ? '2px solid var(--f-yellow)' : '2px solid transparent',
        transition:'all 0.15s', whiteSpace:'nowrap',
      }}
    >{children}</button>
  )
}

function SectionTitle({ title, client, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
      <div>
        <h2 style={{ fontSize:11, fontWeight:700, color:'var(--f-muted-dim)', letterSpacing:'0.1em', textTransform:'uppercase', margin:0 }}>
          {title} — {client?.name?.toUpperCase()}
        </h2>
      </div>
      {action}
    </div>
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

function Sparkline({ records, color = '#FFD22E' }) {
  if (records.length < 2) return null
  const vals = records.map(r => r.value)
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const range = maxV - minV || 1
  const W = 800, H = 36, PX = 6, PY = 5

  const pts = records.map((r, i) => ({
    x: PX + (i / (records.length - 1)) * (W - PX * 2),
    y: (H - PY) - ((r.value - minV) / range) * (H - PY * 2),
    v: r.value,
  }))

  const line = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `${pts[0].x},${H} ${line} ${pts[pts.length-1].x},${H}`
  const gradId = `sg${color.replace(/[^a-zA-Z0-9]/g,'')}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:H, display:'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`}/>
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color}/>
      ))}
    </svg>
  )
}

function GrowthBadge({ pct }) {
  if (pct == null) return <span style={{ fontSize:11, color:'var(--f-muted)' }}>Base</span>
  const color = pct > 0 ? '#22C55E' : pct < 0 ? '#EF4444' : 'var(--f-muted)'
  const bg    = pct > 0 ? 'rgba(34,197,94,0.12)' : pct < 0 ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)'
  return (
    <span style={{ fontSize:11, fontWeight:700, color, background:bg, borderRadius:99, padding:'2px 8px' }}>
      {fmtPct(pct)}
    </span>
  )
}

// ─── Geral Tab ────────────────────────────────────────────────────────────────

function GeralTab({ client, contents, approvals, onTabChange }) {
  const accentColor = client.color || '#FFD22E'
  const clientSlug  = encodeURIComponent(client.name)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, paddingTop:16 }}>
      {/* Metrics */}
      <div className="f-metrics-grid">
        <MetricCard icon="file"     value={String(client.contents || 0)} label="Conteúdos/mês"    desc="contratados no plano"    accentColor={accentColor} trend={8}  />
        <MetricCard icon="check"    value={String(approvals.length)}      label="Em aprovação"      desc="aguardando revisão"      accentColor="#F59E0B"     trend={0}  />
        <MetricCard icon="calendar" value="—"                             label="Publicados"         desc="neste mês"               accentColor="#22C55E"     trend={0}  />
        <MetricCard icon="trending" value="—"                             label="Engajamento médio"  desc="registre na Performance" accentColor="#3B82F6"     trend={0}  />
      </div>

      <div className="f-detail-grid">
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
            {contents.length > 0 ? contents.map((c, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom: i < contents.length - 1 ? '1px solid var(--f-border)' : 'none' }}>
                <div style={{ width:34, height:34, borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid var(--f-border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--f-muted)', flexShrink:0 }}>
                  <Icon name="file" size={14}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--f-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                  <div style={{ fontSize:11, color:'var(--f-muted)', marginTop:2 }}>{c.format} · {c.responsible}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                  <StatusBadge status={c.status}/>
                  <span style={{ fontSize:10, color:'var(--f-muted)' }}>{c.deadline || c.pub_date || ''}</span>
                </div>
              </div>
            )) : (
              <div style={{ padding:'32px 20px', textAlign:'center', color:'var(--f-muted)', fontSize:13 }}>
                Nenhum conteúdo cadastrado ainda
              </div>
            )}
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
              {approvals.length > 0 ? approvals.map((a, i) => (
                <div key={i} style={{ padding:'10px 18px', borderBottom: i < approvals.length - 1 ? '1px solid var(--f-border)' : 'none' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--f-text)', marginBottom:4 }}>{a.title}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <StatusBadge status={a.status}/>
                    <span style={{ fontSize:10, color:'var(--f-muted)' }}>{a.date || a.deadline || ''}</span>
                  </div>
                </div>
              )) : (
                <div style={{ padding:'20px 18px', textAlign:'center', color:'var(--f-muted)', fontSize:12 }}>
                  Nenhuma aprovação pendente
                </div>
              )}
            </div>
          </div>

          {/* Acesso Rápido */}
          <div className="f-card">
            <div className="f-card-header" style={{ padding:'14px 18px 12px' }}>
              <h2 className="f-card-title" style={{ fontSize:14 }}>Acesso Rápido</h2>
            </div>
            <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:6 }}>
              {[
                { label:'Calendário',  icon:'calendar', action:() => onTabChange('calendario') },
                { label:'Biblioteca',  icon:'folder',   href:`/flow/biblioteca/${clientSlug}` },
                { label:'Performance', icon:'chart',    action:() => onTabChange('performance') },
                { label:'Workflow',    icon:'workflow', href:'/flow/workflow' },
              ].map(item => item.href ? (
                <Link key={item.label} href={item.href} className="f-nav-item" style={{ textDecoration:'none', borderRadius:8, padding:'8px 10px' }}>
                  <span className="f-nav-icon"><Icon name={item.icon} size={15}/></span>
                  <span className="f-nav-text">{item.label}</span>
                  <Icon name="arrow" size={13}/>
                </Link>
              ) : (
                <button key={item.label} onClick={item.action} className="f-nav-item" style={{ background:'transparent', border:'none', fontFamily:'inherit', textAlign:'left', cursor:'pointer', borderRadius:8, padding:'8px 10px', width:'100%' }}>
                  <span className="f-nav-icon"><Icon name={item.icon} size={15}/></span>
                  <span className="f-nav-text">{item.label}</span>
                  <Icon name="arrow" size={13}/>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Calendário Tab ───────────────────────────────────────────────────────────

function CalendarioTab({ client, contents }) {
  const now    = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const today  = now.getDate()
  const cells  = useMemo(() => buildCells(year, month), [year, month])
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  // Map contents to days (expects pub_date as 'YYYY-MM-DD')
  const eventsByDay = useMemo(() => {
    const map = {}
    for (const c of contents) {
      if (!c.pub_date) continue
      const [cy, cm, cd] = c.pub_date.split('-').map(Number)
      if (cy === year && cm - 1 === month) {
        if (!map[cd]) map[cd] = []
        map[cd].push(c)
      }
    }
    return map
  }, [contents, year, month])

  // Upcoming: contents this month sorted by day
  const upcoming = useMemo(() =>
    contents
      .filter(c => {
        if (!c.pub_date) return false
        const [cy, cm] = c.pub_date.split('-').map(Number)
        return cy === year && cm - 1 === month
      })
      .sort((a,b) => a.pub_date.localeCompare(b.pub_date))
  , [contents, year, month])

  function prev() {
    if (month === 0) { setYear(y => y-1); setMonth(11) }
    else setMonth(m => m-1)
  }
  function next() {
    if (month === 11) { setYear(y => y+1); setMonth(0) }
    else setMonth(m => m+1)
  }

  const accentColor = client.color || '#FFD22E'

  return (
    <div style={{ paddingTop:16 }}>
      <SectionTitle title="Calendário" client={client} action={
        <Link href="/flow/calendario" className="f-btn-ghost" style={{ textDecoration:'none', fontSize:12 }}>
          Ver calendário geral <Icon name="arrow" size={13}/>
        </Link>
      }/>

      <div className="f-detail-grid" style={{ gap:16 }}>
        {/* Mini calendar */}
        <div className="f-card">
          <div className="f-card-header">
            <div className="f-card-title">{MONTH_PT[month]} {year}</div>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={prev} className="f-btn-ghost f-btn-icon" style={{ width:30, height:30, transform:'scaleX(-1)' }}><Icon name="arrow" size={14}/></button>
              <button onClick={next} className="f-btn-ghost f-btn-icon" style={{ width:30, height:30 }}><Icon name="arrow" size={14}/></button>
            </div>
          </div>
          <div className="f-cal-grid">
            {WEEK_LABELS.map(w => (
              <span key={w} className="f-cal-week-label" style={{ padding:'4px 0 10px' }}>{w}</span>
            ))}
            {cells.map((day, idx) => (
              <div
                key={idx}
                className={`f-cal-day${!day ? ' is-empty' : ''}${day === today && isCurrentMonth ? ' is-today' : ''}`}
                style={{ minHeight:46, cursor: day ? 'pointer' : 'default' }}
              >
                {day && (
                  <>
                    <span className="f-cal-num">{day}</span>
                    <div style={{ display:'flex', gap:2, flexWrap:'wrap', justifyContent:'center' }}>
                      {(eventsByDay[day] || []).slice(0,2).map((e,i) => (
                        <span key={i} className="f-cal-dot" style={{ background: accentColor }}/>
                      ))}
                      {(eventsByDay[day] || []).length > 2 && (
                        <span style={{ fontSize:9, color:'var(--f-muted)' }}>+{eventsByDay[day].length - 2}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="f-cal-legend" style={{ padding:'0 16px 16px' }}>
            <div className="f-cal-legend-item">
              <span className="f-cal-dot" style={{ background: accentColor }}/>
              <span>Conteúdo agendado</span>
            </div>
          </div>
        </div>

        {/* Upcoming for this client */}
        <div className="f-card" style={{ overflow:'hidden' }}>
          <div className="f-card-header">
            <div>
              <div className="f-card-title">Publicações de {MONTH_PT[month]}</div>
              <p className="f-card-subtitle">{upcoming.length} agendamento{upcoming.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div style={{ paddingBottom:4 }}>
            {upcoming.length > 0 ? upcoming.map((item, idx) => (
              <div key={idx} style={{ padding:'12px 18px', borderBottom: idx < upcoming.length - 1 ? '1px solid var(--f-border)' : 'none', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:8, background:`${accentColor}18`, border:`1px solid ${accentColor}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:accentColor }}>
                  <Icon name="file" size={15}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--f-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</div>
                  <div style={{ fontSize:11, color:'var(--f-muted)', marginTop:2 }}>{item.format} · {item.responsible}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                  <StatusBadge status={item.status}/>
                  <span style={{ fontSize:11, color:'var(--f-muted)' }}>{fmtDate(item.pub_date)}</span>
                </div>
              </div>
            )) : (
              <div style={{ padding:'48px 20px', textAlign:'center', color:'var(--f-muted)' }}>
                <Icon name="calendar" size={36}/>
                <p style={{ marginTop:12, fontSize:13 }}>Nenhum conteúdo agendado para este mês</p>
                <p style={{ fontSize:12, marginTop:4, color:'var(--f-muted-dim)' }}>Cadastre conteúdos em <Link href="/flow/conteudos" style={{ color:'var(--f-yellow)', textDecoration:'none' }}>Conteúdos</Link></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Performance Tab ──────────────────────────────────────────────────────────

function PerformanceTab({ client, records, onAdd, onDelete }) {
  const groups = useMemo(() => groupByMetric(records), [records])
  const metricKeys = Object.keys(groups)
  const accentColor = client.color || '#FFD22E'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, paddingTop:16 }}>
      <SectionTitle title="Performance" client={client} action={
        <button className="f-btn-primary" onClick={onAdd} style={{ fontSize:12 }}>
          <Icon name="plus" size={13}/> Registrar Indicadores
        </button>
      }/>

      {metricKeys.length === 0 ? (
        <div className="f-card">
          <div className="f-empty-state" style={{ padding:'56px 24px' }}>
            <Icon name="chart" size={40}/>
            <h3>Nenhum indicador registrado</h3>
            <p>Comece registrando os dados iniciais do cliente — seguidores, engajamento, alcance…</p>
            <button className="f-btn-primary" onClick={onAdd} style={{ marginTop:12 }}>
              <Icon name="plus" size={14}/> Registrar primeiro indicador
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
            {metricKeys.map(metric => {
              const recs = groups[metric]
              const latest = recs[recs.length - 1]
              const prev   = recs.length > 1 ? recs[recs.length - 2] : null
              const pct    = prev ? calcGrowthPct(prev.value, latest.value) : null
              return (
                <div key={metric} className="f-card" style={{ padding:'16px 18px' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>{metric}</div>
                  <div style={{ fontSize:26, fontWeight:900, color:accentColor, lineHeight:1 }}>
                    {latest.value.toLocaleString('pt-BR')}
                  </div>
                  <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
                    <GrowthBadge pct={pct}/>
                    <span style={{ fontSize:11, color:'var(--f-muted)' }}>vs. período anterior</span>
                  </div>
                  <div style={{ fontSize:10, color:'var(--f-muted-dim)', marginTop:4 }}>
                    Atualizado em {fmtDate(latest.recordedAt)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Per-metric history */}
          {metricKeys.map(metric => {
            const recs = groups[metric]
            return (
              <div key={metric} className="f-card">
                <div className="f-card-header">
                  <div>
                    <h2 className="f-card-title">{metric}</h2>
                    <p className="f-card-subtitle">{recs.length} registro{recs.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid var(--f-border)' }}>
                        {['Data','Valor','Variação','Crescimento %','Obs.',''].map(h => (
                          <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recs.map((r, i) => {
                        const prev = i > 0 ? recs[i-1] : null
                        const pct  = prev ? calcGrowthPct(prev.value, r.value) : null
                        const diff = prev ? fmtDiff(prev.value, r.value) : '—'
                        const pctColor = pct == null ? 'var(--f-muted)' : pct > 0 ? '#22C55E' : pct < 0 ? '#EF4444' : 'var(--f-muted)'
                        return (
                          <tr key={r.id} style={{ borderBottom: i < recs.length - 1 ? '1px solid var(--f-border)' : 'none' }}>
                            <td style={{ padding:'12px 16px', color:'var(--f-text)', fontWeight:600 }}>{fmtDate(r.recordedAt)}</td>
                            <td style={{ padding:'12px 16px', color:accentColor, fontWeight:800, fontSize:14 }}>{r.value.toLocaleString('pt-BR')}</td>
                            <td style={{ padding:'12px 16px', color: pct == null ? 'var(--f-muted)' : pct >= 0 ? '#22C55E' : '#EF4444', fontWeight:600 }}>
                              {diff}
                            </td>
                            <td style={{ padding:'12px 16px' }}>
                              <GrowthBadge pct={pct}/>
                            </td>
                            <td style={{ padding:'12px 16px', color:'var(--f-muted)', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {r.notes || '—'}
                            </td>
                            <td style={{ padding:'12px 8px', textAlign:'right' }}>
                              <button
                                onClick={() => onDelete(r.id)}
                                style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--f-muted-dim)', padding:4, borderRadius:6, transition:'color 0.15s' }}
                                title="Excluir registro"
                                onMouseEnter={e => e.currentTarget.style.color='var(--f-red)'}
                                onMouseLeave={e => e.currentTarget.style.color='var(--f-muted-dim)'}
                              >
                                <Icon name="trash" size={13}/>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Sparkline — evolução no tempo */}
                {recs.length > 1 && (() => {
                  const total = calcGrowthPct(recs[0].value, recs[recs.length-1].value)
                  return (
                    <div style={{ padding:'10px 16px 12px', borderTop:'1px solid var(--f-border)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ fontSize:11, color:'var(--f-muted)' }}>Evolução desde o início</span>
                        <GrowthBadge pct={total}/>
                      </div>
                      <Sparkline records={recs} color={accentColor}/>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

// ─── Performance Modal ────────────────────────────────────────────────────────

function PerfModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    metric: 'Seguidores Instagram',
    customMetric: '',
    value: '',
    recordedAt: todayISO(),
    notes: '',
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function submit(e) {
    e.preventDefault()
    const name = form.metric === 'Outro' ? form.customMetric.trim() : form.metric
    if (!name || !form.value) return
    onSave({ ...form, metricName: name })
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(5px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'overlayIn 0.18s ease' }}
      onClick={onClose}
    >
      <div
        style={{ width:'100%', maxWidth:480, background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, boxShadow:'0 32px 96px rgba(0,0,0,0.7)', animation:'modalIn 0.22s cubic-bezier(.4,0,.2,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'22px 24px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>Registrar Indicadores</h2>
            <p style={{ fontSize:12, color:'#A1A1AA', margin:'3px 0 0' }}>Registre os dados do período para acompanhar a evolução</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#A1A1AA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon name="xmark" size={16}/>
          </button>
        </div>

        <form onSubmit={submit} style={{ padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Indicador */}
          <div>
            <label className="f-field-label">Indicador *</label>
            <select className="f-select" value={form.metric} onChange={e => set('metric', e.target.value)}>
              {METRIC_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {form.metric === 'Outro' && (
            <div>
              <label className="f-field-label">Nome do indicador *</label>
              <input className="f-input" value={form.customMetric} onChange={e => set('customMetric', e.target.value)} placeholder="Ex: Leads gerados"/>
            </div>
          )}

          {/* Valor + Data */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label className="f-field-label">Valor *</label>
              <input className="f-input" type="number" min="0" value={form.value} onChange={e => set('value', e.target.value)} placeholder="Ex: 435"/>
            </div>
            <div>
              <label className="f-field-label">Data do registro</label>
              <input className="f-input" type="date" value={form.recordedAt} onChange={e => set('recordedAt', e.target.value)}/>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="f-field-label">Observações</label>
            <textarea className="f-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Ex: Crescimento pós campanha de lançamento" rows={2} style={{ resize:'vertical', minHeight:60 }}/>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" className="f-btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="f-btn-primary">
              <Icon name="check" size={14}/> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { id } = useParams()
  const [client,   setClient]  = useState(null)
  const [loading,  setLoading] = useState(true)
  const [tab,      setTab]     = useState('geral')
  const [perfRecords, setPerf] = useState([])
  const [perfModal,   setModal]= useState(false)
  const [contents, setContents]= useState([])
  const [approvals,setApprovals]=useState([])

  // Load client from Supabase
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
      if (!error && data) setClient(data)
      setLoading(false)
    }
    load()
  }, [id])

  // Load performance records
  useEffect(() => {
    if (!id) return
    try {
      const all = JSON.parse(localStorage.getItem(LS_PERF) || '[]')
      setPerf(all.filter(r => r.clientId === id))
    } catch {}
  }, [id])

  // Load contents & approvals from localStorage (not yet on Supabase)
  useEffect(() => {
    if (!client) return
    try {
      const all = JSON.parse(localStorage.getItem(LS_CONTENTS) || '[]')
      setContents(all.filter(c => c.client === client.name).slice(0, 5))
    } catch {}
    try {
      const all = JSON.parse(localStorage.getItem(LS_APPROVALS) || '[]')
      setApprovals(all.filter(a => a.client === client.name).slice(0, 3))
    } catch {}
  }, [client])

  function handleAddPerf(formData) {
    const rec = {
      id: Date.now().toString(),
      clientId: id,
      metric: formData.metricName,
      value: Number(formData.value) || 0,
      recordedAt: formData.recordedAt,
      notes: formData.notes,
    }
    try {
      const all = JSON.parse(localStorage.getItem(LS_PERF) || '[]')
      all.push(rec)
      localStorage.setItem(LS_PERF, JSON.stringify(all))
    } catch {}
    setPerf(prev => [...prev, rec])
    setModal(false)
  }

  function handleDeletePerf(recId) {
    try {
      const all = JSON.parse(localStorage.getItem(LS_PERF) || '[]')
      localStorage.setItem(LS_PERF, JSON.stringify(all.filter(r => r.id !== recId)))
    } catch {}
    setPerf(prev => prev.filter(r => r.id !== recId))
  }

  if (loading) return (
    <>
      <FlowHeader title="Carregando…" subtitle=""/>
      <main className="f-content">
        <div style={{ padding:60, textAlign:'center', color:'var(--f-muted)' }}><Icon name="refresh" size={28}/></div>
      </main>
    </>
  )

  if (!client) return (
    <>
      <FlowHeader title="Cliente não encontrado" subtitle="" actions={
        <Link href="/flow/clientes" className="f-btn-ghost"><Icon name="arrow" size={14}/> Voltar</Link>
      }/>
      <main className="f-content">
        <div className="f-empty-state" style={{ paddingTop:80 }}>
          <Icon name="alert" size={40}/>
          <h3>Este cliente não existe ou foi removido.</h3>
          <Link href="/flow/clientes" className="f-btn-primary" style={{ marginTop:12, textDecoration:'none' }}>
            <Icon name="users" size={14}/> Ver todos os clientes
          </Link>
        </div>
      </main>
    </>
  )

  const accentColor = client.color || '#FFD22E'

  const TABS = [
    { key:'geral',       label:'Visão Geral' },
    { key:'calendario',  label:'Calendário'  },
    { key:'performance', label:'Performance' },
  ]

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
        {/* Profile card */}
        <div className="f-card">
          <div style={{ padding:'24px', display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'flex-start' }}>
            <div style={{ width:72, height:72, borderRadius:18, background:`${accentColor}20`, border:`2px solid ${accentColor}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:900, color:accentColor, flexShrink:0 }}>
              {client.initials}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'12px 24px' }}>
              <InfoRow label="Status"><StatusBadge status={client.status}/></InfoRow>
              <InfoRow label="Plano">{client.plan}</InfoRow>
              <InfoRow label="Responsável">{client.responsible}</InfoRow>
              <InfoRow label="Conteúdos/mês">
                <span style={{ fontWeight:800, color:accentColor, fontSize:16 }}>{client.contents}</span>
              </InfoRow>
              {client.instagram && <InfoRow label="Instagram"><span style={{ color:'var(--f-muted)' }}>{client.instagram}</span></InfoRow>}
              {client.whatsapp  && <InfoRow label="WhatsApp"><span style={{ color:'var(--f-muted)' }}>{client.whatsapp}</span></InfoRow>}
              {client.email     && <InfoRow label="E-mail"><span style={{ color:'var(--f-muted)', fontSize:12 }}>{client.email}</span></InfoRow>}
              {client.observations && <InfoRow label="Observações" full><span style={{ color:'var(--f-muted)', lineHeight:1.5 }}>{client.observations}</span></InfoRow>}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--f-border)', overflowX:'auto' }}>
          {TABS.map(t => (
            <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </TabBtn>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'geral' && (
          <GeralTab client={client} contents={contents} approvals={approvals} onTabChange={setTab}/>
        )}
        {tab === 'calendario' && (
          <CalendarioTab client={client} contents={contents}/>
        )}
        {tab === 'performance' && (
          <PerformanceTab
            client={client}
            records={perfRecords}
            onAdd={() => setModal(true)}
            onDelete={handleDeletePerf}
          />
        )}
      </main>

      {perfModal && (
        <PerfModal onClose={() => setModal(false)} onSave={handleAddPerf}/>
      )}
    </>
  )
}
