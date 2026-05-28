'use client'

import { useState, useEffect } from 'react'
import FlowHeader from '@/components/flow/FlowHeader'
import Icon from '@/components/flow/FlowIcons'
import StatusBadge from '@/components/flow/StatusBadge'
import { supabase } from '@/lib/supabase'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtDate(iso) {
  if (!iso) return '—'
  const parts = iso.split('-')
  return `${parseInt(parts[2])} ${MONTH_PT[parseInt(parts[1]) - 1]} ${parts[0]}`
}

function fmtDateShort(iso) {
  if (!iso) return '—'
  const parts = iso.split('-')
  return `${parseInt(parts[2])} ${MONTH_PT[parseInt(parts[1]) - 1]}`
}

function fmtVal(v) {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M'
  if (v >= 10000)   return (v / 1000).toFixed(0) + 'K'
  if (v >= 1000)    return (v / 1000).toFixed(1) + 'K'
  return v % 1 !== 0 ? v.toFixed(1) : String(Math.round(v))
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function monthAgo() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

function GrowthBadge({ pct }) {
  if (pct === null || pct === undefined) return (
    <span style={{ fontSize:11, fontWeight:700, color:'var(--f-muted-dim)', background:'rgba(255,255,255,0.06)', borderRadius:99, padding:'2px 8px' }}>Base</span>
  )
  const pos = pct >= 0
  return (
    <span style={{ fontSize:11, fontWeight:700, color: pos ? '#22C55E' : '#EF4444', background: pos ? '#22C55E18' : '#EF444418', borderRadius:99, padding:'2px 8px' }}>
      {pos ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const [clients,     setClients]     = useState([])
  const [clientId,    setClientId]    = useState('')
  const [startDate,   setStartDate]   = useState(monthAgo())
  const [endDate,     setEndDate]     = useState(today())
  const [loading,     setLoading]     = useState(false)
  const [report,      setReport]      = useState(null)

  useEffect(() => {
    supabase.from('clients').select('id, name, niche, plan, status, responsible')
      .order('name').then(({ data }) => setClients(data ?? []))
  }, [])

  async function generate() {
    if (!clientId || !startDate || !endDate) return
    setLoading(true)
    setReport(null)

    const client = clients.find(c => c.id === clientId)

    const [perfRes, contentsRes, approvalsRes] = await Promise.all([
      supabase
        .from('performance_records')
        .select('*')
        .eq('client_id', clientId)
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDate)
        .order('recorded_at', { ascending: true }),
      supabase
        .from('contents')
        .select('*')
        .eq('client', client.name)
        .or(`pub_date.gte.${startDate},created_at.gte.${startDate}`)
        .lte('created_at', endDate + 'T23:59:59'),
      supabase
        .from('approvals')
        .select('*')
        .eq('client', client.name)
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59'),
    ])

    const perfRecords = perfRes.data ?? []
    const contents    = (contentsRes.data ?? []).map(r => ({
      id: r.id, title: r.title, format: r.format, status: r.status,
      responsible: r.responsible, pubDate: r.pub_date ?? '',
    }))
    const approvals = (approvalsRes.data ?? []).map(r => ({
      id: r.id, title: r.title, status: r.status, priority: r.priority, deadline: r.deadline,
    }))

    // Group performance by metric
    const groups = {}
    perfRecords.forEach(r => {
      if (!groups[r.metric]) groups[r.metric] = []
      groups[r.metric].push({ date: r.recorded_at, value: Number(r.value), notes: r.notes ?? '' })
    })
    const performance = Object.entries(groups).map(([metric, records]) => {
      const first = records[0]?.value
      const last  = records[records.length - 1]?.value
      const totalGrowth = records.length >= 2 && first ? ((last - first) / first) * 100 : null
      return { metric, records, totalGrowth, latest: last }
    })

    // Content stats
    const contentByStatus = {}
    contents.forEach(c => {
      contentByStatus[c.status] = (contentByStatus[c.status] || 0) + 1
    })

    setReport({
      client,
      period: { start: startDate, end: endDate },
      generatedAt: new Date().toISOString(),
      performance,
      contents,
      approvals,
      contentByStatus,
    })
    setLoading(false)
  }

  function handlePrint() {
    window.print()
  }

  const selectSt = {
    backgroundColor:'#1E1E1E',
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23FFD22E' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center',
    border:'1px solid var(--f-border)', borderRadius:8,
    color:'var(--f-text)', fontSize:13, padding:'9px 28px 9px 10px',
    cursor:'pointer', outline:'none', width:'100%',
    appearance:'none', WebkitAppearance:'none',
  }

  return (
    <>
      <style>{`
        @media print {
          .f-sidebar, .f-hamburger, .f-header, .no-print { display: none !important; }
          .f-main { margin-left: 0 !important; }
          .f-content { padding: 0 !important; }
          body { background: white !important; color: black !important; }
          .print-section { page-break-inside: avoid; }
          .report-card { border: 1px solid #ddd !important; background: white !important; margin-bottom: 16px; }
          .report-header { background: #1a1a1a !important; color: white !important; }
        }
      `}</style>

      <FlowHeader
        title="Relatórios"
        subtitle="Gere relatórios completos por cliente e período."
        actions={
          report && (
            <button className="f-btn-primary no-print" onClick={handlePrint}>
              <Icon name="download" size={14}/> Imprimir / PDF
            </button>
          )
        }
      />

      <main className="f-content">

        {/* ── Config card ── */}
        <div className="f-card no-print" style={{ padding:'20px 24px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:12, alignItems:'flex-end' }}>
            <div>
              <label className="f-label">Cliente</label>
              <select style={selectSt} value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">Selecione um cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="f-label">Data inicial</label>
              <input className="f-input" type="date" value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ minHeight:42, colorScheme:'dark' }}/>
            </div>
            <div>
              <label className="f-label">Data final</label>
              <input className="f-input" type="date" value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ minHeight:42, colorScheme:'dark' }}/>
            </div>
            <button
              className="f-btn-primary"
              onClick={generate}
              disabled={!clientId || loading}
              style={{ alignSelf:'flex-end', opacity: !clientId ? 0.5 : 1 }}
            >
              {loading ? <Icon name="refresh" size={14}/> : <Icon name="report" size={14}/>}
              {loading ? 'Gerando…' : 'Gerar'}
            </button>
          </div>

          <style>{`
            @media (max-width: 700px) {
              .report-config-grid { grid-template-columns: 1fr 1fr !important; }
            }
          `}</style>
        </div>

        {/* ── Empty state ── */}
        {!report && !loading && (
          <div className="f-card">
            <div className="f-empty-state" style={{ padding:'72px 20px' }}>
              <Icon name="report" size={44}/>
              <h3>Nenhum relatório gerado</h3>
              <p>Selecione um cliente e o período desejado para gerar o relatório.</p>
            </div>
          </div>
        )}

        {/* ── Report ── */}
        {report && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Report header */}
            <div className="report-card f-card" style={{ background:'linear-gradient(135deg,#1a1a1a 0%,#232323 100%)', border:'1px solid var(--f-border)' }}>
              <div className="report-header" style={{ padding:'28px 28px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--f-yellow)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:6 }}>
                      Relatório de Performance
                    </div>
                    <h1 style={{ fontSize:26, fontWeight:900, color:'#fff', margin:0, letterSpacing:'-0.02em' }}>
                      {report.client.name}
                    </h1>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:4 }}>
                      {report.client.niche} · Plano {report.client.plan} · Resp. {report.client.responsible}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:4 }}>Período analisado</div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>
                      {fmtDate(report.period.start)} → {fmtDate(report.period.end)}
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4 }}>
                      Gerado em {new Date(report.generatedAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick stats strip */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:0 }}>
                {[
                  { label:'Métricas', value: report.performance.length, color:'#EC4899' },
                  { label:'Conteúdos', value: report.contents.length, color:'#3B82F6' },
                  { label:'Aprovações', value: report.approvals.length, color:'#F59E0B' },
                  { label:'Publicados', value: report.contents.filter(c => c.status === 'Publicado').length, color:'#22C55E' },
                ].map((s, i, arr) => (
                  <div key={s.label} style={{ padding:'18px 20px', borderRight: i < arr.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ fontSize:26, fontWeight:900, color: s.color, lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Performance metrics ── */}
            <div className="report-card f-card print-section">
              <div className="f-card-header">
                <h2 className="f-card-title">Métricas de Performance</h2>
                <span style={{ fontSize:12, color:'var(--f-muted)' }}>{report.performance.length} métrica{report.performance.length !== 1 ? 's' : ''}</span>
              </div>

              {report.performance.length === 0 ? (
                <div style={{ padding:'32px 20px', textAlign:'center', color:'var(--f-muted)' }}>
                  Nenhuma métrica registrada neste período.
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'rgba(255,255,255,0.02)' }}>
                        {['Métrica','Registros','Valor Inicial','Valor Final','Variação Total','Último Registro'].map(h => (
                          <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap', borderBottom:'1px solid var(--f-border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.performance.map(m => (
                        <tr key={m.metric} style={{ borderBottom:'1px solid var(--f-border)' }}>
                          <td style={{ padding:'10px 14px', fontWeight:700, color:'var(--f-text)', whiteSpace:'nowrap' }}>{m.metric}</td>
                          <td style={{ padding:'10px 14px', color:'var(--f-muted)', textAlign:'center' }}>{m.records.length}</td>
                          <td style={{ padding:'10px 14px', color:'var(--f-muted)' }}>{fmtVal(m.records[0]?.value ?? 0)}</td>
                          <td style={{ padding:'10px 14px', fontWeight:700, color:'var(--f-yellow)' }}>{fmtVal(m.latest)}</td>
                          <td style={{ padding:'10px 14px' }}><GrowthBadge pct={m.totalGrowth}/></td>
                          <td style={{ padding:'10px 14px', color:'var(--f-muted)' }}>{fmtDateShort(m.records[m.records.length - 1]?.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Detailed records ── */}
            {report.performance.length > 0 && (
              <div className="report-card f-card print-section">
                <div className="f-card-header">
                  <h2 className="f-card-title">Histórico Detalhado</h2>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {report.performance.map((m, mi) => (
                    <div key={m.metric} style={{ borderBottom: mi < report.performance.length - 1 ? '1px solid var(--f-border)' : 'none' }}>
                      <div style={{ padding:'12px 16px 6px', display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:'var(--f-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>{m.metric}</span>
                        <GrowthBadge pct={m.totalGrowth}/>
                      </div>
                      <div style={{ display:'flex', gap:0, paddingLeft:16, paddingBottom:12, overflowX:'auto' }}>
                        {m.records.map((r, ri) => {
                          const prev = ri > 0 ? m.records[ri - 1].value : null
                          const delta = prev !== null ? ((r.value - prev) / prev) * 100 : null
                          return (
                            <div key={ri} style={{ minWidth:90, paddingRight:16 }}>
                              <div style={{ fontSize:10, color:'var(--f-muted-dim)', marginBottom:2 }}>{fmtDateShort(r.date)}</div>
                              <div style={{ fontSize:16, fontWeight:800, color:'var(--f-text)' }}>{fmtVal(r.value)}</div>
                              {delta !== null
                                ? <div style={{ fontSize:10, color: delta >= 0 ? '#22C55E' : '#EF4444', fontWeight:700 }}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}%</div>
                                : <div style={{ fontSize:10, color:'var(--f-muted-dim)' }}>base</div>
                              }
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Contents ── */}
            <div className="report-card f-card print-section">
              <div className="f-card-header">
                <h2 className="f-card-title">Conteúdos Produzidos</h2>
                <span style={{ fontSize:12, color:'var(--f-muted)' }}>{report.contents.length} no período</span>
              </div>

              {/* Status summary pills */}
              {Object.keys(report.contentByStatus).length > 0 && (
                <div style={{ padding:'0 16px 12px', display:'flex', gap:6, flexWrap:'wrap' }}>
                  {Object.entries(report.contentByStatus).map(([status, count]) => (
                    <span key={status} style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, background:'rgba(255,255,255,0.07)', color:'var(--f-muted)', border:'1px solid var(--f-border)' }}>
                      {status}: {count}
                    </span>
                  ))}
                </div>
              )}

              {report.contents.length === 0 ? (
                <div style={{ padding:'28px 20px', textAlign:'center', color:'var(--f-muted)' }}>
                  Nenhum conteúdo no período.
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'rgba(255,255,255,0.02)' }}>
                        {['Título','Formato','Responsável','Publicação','Status'].map(h => (
                          <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap', borderBottom:'1px solid var(--f-border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.contents.map(c => (
                        <tr key={c.id} style={{ borderBottom:'1px solid var(--f-border)' }}>
                          <td style={{ padding:'9px 14px', color:'var(--f-text)', fontWeight:600 }}>{c.title}</td>
                          <td style={{ padding:'9px 14px', color:'var(--f-muted)', whiteSpace:'nowrap' }}>{c.format}</td>
                          <td style={{ padding:'9px 14px', color:'var(--f-muted)', whiteSpace:'nowrap' }}>{c.responsible || '—'}</td>
                          <td style={{ padding:'9px 14px', color:'var(--f-muted)', whiteSpace:'nowrap' }}>{c.pubDate ? fmtDateShort(c.pubDate) : '—'}</td>
                          <td style={{ padding:'9px 14px' }}><StatusBadge status={c.status}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Approvals ── */}
            {report.approvals.length > 0 && (
              <div className="report-card f-card print-section">
                <div className="f-card-header">
                  <h2 className="f-card-title">Aprovações</h2>
                  <span style={{ fontSize:12, color:'var(--f-muted)' }}>{report.approvals.length} no período</span>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'rgba(255,255,255,0.02)' }}>
                        {['Título','Prioridade','Prazo','Status'].map(h => (
                          <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap', borderBottom:'1px solid var(--f-border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.approvals.map(a => (
                        <tr key={a.id} style={{ borderBottom:'1px solid var(--f-border)' }}>
                          <td style={{ padding:'9px 14px', color:'var(--f-text)', fontWeight:600 }}>{a.title}</td>
                          <td style={{ padding:'9px 14px', color:'var(--f-muted)' }}>{a.priority}</td>
                          <td style={{ padding:'9px 14px', color:'var(--f-muted)', whiteSpace:'nowrap' }}>{a.deadline ? fmtDateShort(a.deadline) : '—'}</td>
                          <td style={{ padding:'9px 14px' }}><StatusBadge status={a.status}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </>
  )
}
