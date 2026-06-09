'use client'

import { useState, useEffect } from 'react'
import FlowHeader from '@/components/flow/FlowHeader'
import MetricCard from '@/components/flow/MetricCard'
import Icon from '@/components/flow/FlowIcons'
import { supabase } from '@/lib/supabase'

const MONTH_PT    = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTH_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const FALLBACK_COLORS = ['#FFD22E','#3B82F6','#22C55E','#8B5CF6','#F59E0B','#EF4444','#EC4899','#06B6D4']

function genMonthOptions(count = 12) {
  const opts = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    opts.push({ value: val, label: `${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}` })
  }
  return opts
}

function getMonthRange(ym) {
  const [y, m] = ym.split('-').map(Number)
  const start = `${ym}-01`
  const next  = m === 12 ? `${y+1}-01-01` : `${y}-${String(m+1).padStart(2,'0')}-01`
  return { start, end: next }
}

function fmtVal(v) {
  if (!v && v !== 0) return '—'
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M'
  if (v >= 10000)   return (v / 1000).toFixed(0) + 'K'
  if (v >= 1000)    return (v / 1000).toFixed(1) + 'K'
  return v % 1 !== 0 ? v.toFixed(1) : String(Math.round(v))
}

function detectMetric(metrics, keywords) {
  for (const kw of keywords) {
    const found = metrics.find(m => m.toLowerCase().includes(kw.toLowerCase()))
    if (found) return found
  }
  return null
}

export default function PerformancePage() {
  const now    = new Date()
  const MONTHS = genMonthOptions(12)
  const defVal = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`

  const [period,   setPeriod]   = useState(defVal)
  const [records,  setRecords]  = useState([])
  const [pubContents, setPubContents] = useState([])
  const [allPub,   setAllPub]   = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { start, end } = getMonthRange(period)

      // For monthly evolution always fetch last 6 months
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        .toISOString().slice(0,10)

      const [{ data: recs }, { data: cnts }, { data: allCnts }] = await Promise.all([
        supabase
          .from('performance_records')
          .select('metric, value, recorded_at, client_id, clients(id, name, color)')
          .gte('recorded_at', start)
          .lt('recorded_at', end)
          .order('recorded_at', { ascending: true }),
        supabase
          .from('contents')
          .select('id, title, format, status, client, pub_date')
          .eq('status', 'Publicado')
          .gte('pub_date', start)
          .lt('pub_date', end)
          .order('pub_date', { ascending: false }),
        supabase
          .from('contents')
          .select('pub_date')
          .eq('status', 'Publicado')
          .gte('pub_date', sixMonthsAgo)
          .order('pub_date', { ascending: true }),
      ])

      setRecords(recs ?? [])
      setPubContents(cnts ?? [])
      setAllPub(allCnts ?? [])
      setLoading(false)
    }
    load()
  }, [period])

  // ── Derive client map (id → {name, color}) ──────────────────────────────────
  const clientMap = {}
  let colorIdx = 0
  records.forEach(r => {
    if (r.client_id && r.clients && !clientMap[r.client_id]) {
      clientMap[r.client_id] = {
        name:  r.clients.name,
        color: r.clients.color || FALLBACK_COLORS[colorIdx++ % FALLBACK_COLORS.length],
      }
    }
  })

  // ── Latest value per {clientId, metric} ─────────────────────────────────────
  const latest = {}
  records.forEach(r => {
    const key = `${r.client_id}::${r.metric}`
    if (!latest[key] || r.recorded_at > (latest[key]?.recorded_at ?? '')) {
      latest[key] = { value: Number(r.value), recorded_at: r.recorded_at }
    }
  })

  // ── Unique metrics ───────────────────────────────────────────────────────────
  const metrics = [...new Set(records.map(r => r.metric))]

  const reachMetric = detectMetric(metrics, ['alcance', 'seguidores', 'visualiz', 'visitas']) ?? metrics[0]
  const engMetric   = detectMetric(metrics, ['interaç', 'engaj', 'taxa']) ?? metrics[1] ?? metrics[0]

  // ── Build per-client data ────────────────────────────────────────────────────
  const clientIds = Object.keys(clientMap)

  function buildClientChart(metric) {
    if (!metric) return []
    return clientIds
      .map(cid => ({
        name:  clientMap[cid].name,
        color: clientMap[cid].color,
        value: latest[`${cid}::${metric}`]?.value ?? 0,
      }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value)
  }

  const reachData = buildClientChart(reachMetric)
  const engData   = clientIds.map(cid => ({
    name:  clientMap[cid].name,
    color: clientMap[cid].color,
    value: latest[`${cid}::${engMetric}`]?.value ?? 0,
    posts: pubContents.filter(c => c.client === clientMap[cid].name).length,
  })).filter(c => c.value > 0 || c.posts > 0).sort((a, b) => b.value - a.value)

  const maxReach = Math.max(...reachData.map(c => c.value), 1)
  const maxEng   = Math.max(...engData.map(c => c.value), 1)

  // ── Summary cards ───────────────────────────────────────────────────────────
  const totalReach = reachData.reduce((s, c) => s + c.value, 0)
  const validEng   = engData.filter(c => c.value > 0)
  const avgEng     = validEng.length ? validEng.reduce((s, c) => s + c.value, 0) / validEng.length : 0
  const bestClient = validEng.length ? validEng[0] : null

  // ── Monthly evolution (last 6 months, always) ───────────────────────────────
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const ms = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    monthlyData.push({
      label: MONTH_PT[d.getMonth()],
      count: allPub.filter(c => c.pub_date?.startsWith(ms)).length,
      isCurrent: i === 0,
    })
  }
  const maxPublications = Math.max(...monthlyData.map(m => m.count), 1)

  // ── Top contents ────────────────────────────────────────────────────────────
  const topContents = pubContents.slice(0, 5)

  const selectSt = {
    backgroundColor:'#1E1E1E',
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23FFD22E' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center',
    border:'1px solid var(--f-border)', borderRadius:'var(--f-r-sm)',
    color:'var(--f-text)', fontSize:13, padding:'6px 28px 6px 10px',
    cursor:'pointer', outline:'none', appearance:'none', WebkitAppearance:'none',
    fontFamily:'inherit',
  }

  const periodLabel = MONTHS.find(m => m.value === period)?.label ?? period

  return (
    <>
      <FlowHeader
        title="Performance"
        subtitle="Acompanhe os principais indicadores da operação de conteúdo."
        actions={
          <select style={selectSt} value={period} onChange={e => setPeriod(e.target.value)}>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        }
      />

      <main className="f-content">

        {/* Metric cards */}
        <div className="f-metrics-grid">
          <MetricCard
            icon="trending"
            value={fmtVal(totalReach)}
            label="Alcance Total"
            desc={reachMetric ?? 'sem registros'}
            accentColor="#FFD22E"
          />
          <MetricCard
            icon="chart"
            value={avgEng > 0 ? `${avgEng.toFixed(1)}%` : '—'}
            label="Interações Médias"
            desc="média dos clientes"
            accentColor="#22C55E"
          />
          <MetricCard
            icon="file"
            value={String(pubContents.length)}
            label="Publicações"
            desc={periodLabel}
            accentColor="#3B82F6"
          />
          <MetricCard
            icon="zap"
            value={bestClient ? `${bestClient.value.toFixed(1)}%` : '—'}
            label="Melhor Interação"
            desc={bestClient?.name ?? 'sem dados'}
            accentColor="#8B5CF6"
          />
        </div>

        {loading && (
          <div style={{ textAlign:'center', padding:'40px', color:'var(--f-muted)' }}>
            <Icon name="refresh" size={20}/><p style={{ marginTop:10 }}>Carregando dados...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Two-column charts */}
            <div className="perf-two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

              {/* Alcance por Cliente */}
              <div className="f-card">
                <div className="f-card-header">
                  <div>
                    <h2 className="f-card-title">{reachMetric ? `${reachMetric} por Cliente` : 'Alcance por Cliente'}</h2>
                    <p className="f-card-subtitle">{periodLabel}</p>
                  </div>
                </div>
                {reachData.length === 0 ? (
                  <div style={{ padding:'32px 20px', textAlign:'center', color:'var(--f-muted)', fontSize:13 }}>
                    Nenhum registro de "{reachMetric ?? 'Alcance'}" neste período.
                  </div>
                ) : (
                  <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
                    {reachData.map(c => (
                      <div key={c.name}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:'var(--f-text)' }}>{c.name}</span>
                          <span style={{ fontSize:12, color:'var(--f-muted)' }}>{fmtVal(c.value)}</span>
                        </div>
                        <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${Math.round((c.value/maxReach)*100)}%`, background:c.color, borderRadius:99, transition:'width 0.6s ease' }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Engajamento por Cliente */}
              <div className="f-card">
                <div className="f-card-header">
                  <div>
                    <h2 className="f-card-title">{engMetric ? `${engMetric} por Cliente` : 'Interações por Cliente'}</h2>
                    <p className="f-card-subtitle">{periodLabel}</p>
                  </div>
                </div>
                {engData.length === 0 ? (
                  <div style={{ padding:'32px 20px', textAlign:'center', color:'var(--f-muted)', fontSize:13 }}>
                    Nenhum registro de "{engMetric ?? 'Interações'}" neste período.
                  </div>
                ) : (
                  <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
                    {engData.map(c => (
                      <div key={c.name}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:12, fontWeight:600, color:'var(--f-text)' }}>{c.name}</span>
                            {c.posts > 0 && (
                              <span style={{ fontSize:10, fontWeight:600, color:'var(--f-muted-dim)', background:'rgba(255,255,255,0.05)', borderRadius:99, padding:'1px 6px' }}>
                                {c.posts} posts
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize:12, color:'var(--f-muted)' }}>{c.value > 0 ? `${c.value.toFixed(1)}%` : '—'}</span>
                        </div>
                        <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${c.value > 0 ? Math.round((c.value/maxEng)*100) : 0}%`, background:c.color, borderRadius:99, transition:'width 0.6s ease' }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Evolução Mensal */}
            <div className="f-card">
              <div className="f-card-header">
                <div>
                  <h2 className="f-card-title">Evolução Mensal</h2>
                  <p className="f-card-subtitle">Publicações nos últimos 6 meses</p>
                </div>
              </div>
              <div style={{ padding:'16px 20px' }}>
                <div style={{ display:'flex', alignItems:'flex-end', gap:12, height:120 }}>
                  {monthlyData.map(m => {
                    const h = Math.round((m.count / maxPublications) * 100)
                    return (
                      <div key={m.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:11, color: m.isCurrent ? 'var(--f-yellow)' : 'var(--f-muted)' }}>{m.count}</span>
                        <div style={{ width:'100%', height:`${Math.max(h, 4)}%`, background:'var(--f-yellow)', borderRadius:'4px 4px 0 0', minHeight:4, opacity: m.isCurrent ? 1 : 0.5 }}/>
                        <span style={{ fontSize:11, color: m.isCurrent ? 'var(--f-yellow)' : 'var(--f-muted)' }}>{m.label}</span>
                      </div>
                    )
                  })}
                </div>
                {allPub.length === 0 && (
                  <div style={{ textAlign:'center', color:'var(--f-muted)', fontSize:12, marginTop:8 }}>
                    Nenhum conteúdo publicado nos últimos 6 meses.
                  </div>
                )}
              </div>
            </div>

            {/* Top Conteúdos */}
            {topContents.length > 0 && (
              <div className="f-card">
                <div className="f-card-header">
                  <div>
                    <h2 className="f-card-title">Publicações do Mês</h2>
                    <p className="f-card-subtitle">{periodLabel}</p>
                  </div>
                </div>
                <div>
                  {topContents.map((c, i) => (
                    <div key={c.id} style={{ padding:'12px 20px', borderBottom: i < topContents.length - 1 ? '1px solid var(--f-border)' : 'none', display:'flex', alignItems:'center', gap:14 }}>
                      <span style={{ fontSize:18, fontWeight:800, color: i === 0 ? 'var(--f-yellow)' : 'var(--f-muted-dim)', width:24, textAlign:'center', flexShrink:0 }}>
                        #{i+1}
                      </span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--f-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                        <div style={{ fontSize:11, color:'var(--f-muted)', marginTop:2 }}>{c.client} · {c.format}</div>
                      </div>
                      {c.pub_date && (
                        <div style={{ textAlign:'right', flexShrink:0, fontSize:12, color:'var(--f-muted)' }}>
                          {c.pub_date.split('-').slice(1).reverse().join('/')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state when no records at all */}
            {records.length === 0 && pubContents.length === 0 && (
              <div className="f-card">
                <div className="f-empty-state" style={{ padding:'60px 20px' }}>
                  <Icon name="chart" size={40}/>
                  <h3>Sem dados neste período</h3>
                  <p>Adicione registros de performance na página de cada cliente.</p>
                </div>
              </div>
            )}
          </>
        )}

        <style>{`
          @media (max-width: 768px) { .perf-two-col { grid-template-columns: 1fr !important; } }
        `}</style>
      </main>
    </>
  )
}
