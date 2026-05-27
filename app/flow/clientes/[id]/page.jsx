'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import FlowHeader from '@/components/flow/FlowHeader'
import StatusBadge from '@/components/flow/StatusBadge'
import MetricCard from '@/components/flow/MetricCard'
import Icon from '@/components/flow/FlowIcons'
import { supabase } from '@/lib/supabase'

const STATUS_COLOR = {
  Ativo: '#22C55E', Pausado: '#EF4444', 'Em onboarding': '#3B82F6', Atenção: '#F59E0B',
}

const METRIC_NAMES = [
  'Seguidores Instagram', 'Seguidores YouTube', 'Alcance médio', 'Engajamento (%)',
  'Impressões', 'Curtidas', 'Comentários', 'Compartilhamentos', 'Saves',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return ''
  const M = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const parts = iso.split('-')
  return `${parseInt(parts[2])} ${M[parseInt(parts[1]) - 1]}`
}

function fmtVal(v) {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M'
  if (v >= 10000)   return (v / 1000).toFixed(0) + 'K'
  if (v >= 1000)    return (v / 1000).toFixed(1) + 'K'
  return v % 1 !== 0 ? v.toFixed(1) : String(Math.round(v))
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ records, color = '#FFD22E', metricName }) {
  if (!records || records.length < 2) {
    return (
      <div style={{ padding: '14px 0 6px', color: 'var(--f-muted-dim)', fontSize: 12, textAlign: 'center' }}>
        Adicione mais um registro para ver o gráfico de evolução.
      </div>
    )
  }

  const vals  = records.map(r => r.value)
  const min   = Math.min(...vals)
  const max   = Math.max(...vals)
  const range = max - min || 1

  const pts = vals.map((v, i) => ({
    x: vals.length === 1 ? 50 : (i / (vals.length - 1)) * 100,
    y: (1 - (v - min) / range) * 100,
    value: v,
    date: records[i].recordedAt,
  }))

  const lineStr = pts.map(p => `${p.x},${p.y}`).join(' ')
  const areaStr = `0,100 ${lineStr} 100,100`

  const totalG = (() => {
    if (records.length < 2 || !records[0].value) return null
    return ((records[records.length - 1].value - records[0].value) / records[0].value) * 100
  })()

  const Y_W      = 44
  const CHART_H  = 76

  return (
    <div>
      {/* Chart: Y labels + SVG */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Y-axis */}
        <div style={{ width: Y_W, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: 8, height: CHART_H }}>
          <span style={{ fontSize: 9, color: 'var(--f-muted-dim)', textAlign: 'right', display: 'block', lineHeight: 1 }}>{fmtVal(max)}</span>
          <span style={{ fontSize: 9, color: 'var(--f-muted-dim)', textAlign: 'right', display: 'block', lineHeight: 1 }}>{fmtVal(min + range / 2)}</span>
          <span style={{ fontSize: 9, color: 'var(--f-muted-dim)', textAlign: 'right', display: 'block', lineHeight: 1 }}>{fmtVal(min)}</span>
        </div>

        {/* SVG + HTML dots overlay */}
        <div style={{ flex: 1, position: 'relative', height: CHART_H }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            {[0, 50, 100].map(y => (
              <line key={y} x1="0" y1={y} x2="100" y2={y}
                stroke="rgba(255,255,255,0.07)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
            ))}
            <polygon points={areaStr} fill={color} fillOpacity="0.13" />
            <polyline points={lineStr} fill="none" stroke={color} strokeWidth="1.5"
              strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          {/* Dots: HTML divs avoid SVG circle distortion with preserveAspectRatio="none" */}
          {pts.map((p, i) => (
            <div
              key={i}
              title={`${fmtDate(p.date)}: ${p.value.toLocaleString('pt-BR')}`}
              style={{
                position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
                width: 7, height: 7, borderRadius: '50%',
                background: color, border: '1.5px solid #111',
                transform: 'translate(-50%, -50%)',
                cursor: 'default', zIndex: 1,
              }}
            />
          ))}
        </div>
      </div>

      {/* X-axis dates */}
      <div style={{ position: 'relative', height: 18, marginLeft: Y_W, marginTop: 3 }}>
        {pts.map((p, i) => (
          <span key={i} style={{
            position: 'absolute', left: `${p.x}%`, fontSize: 9,
            color: 'var(--f-muted-dim)', transform: 'translateX(-50%)', whiteSpace: 'nowrap',
          }}>
            {fmtDate(p.date)}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, marginLeft: Y_W }}>
        <span style={{ width: 18, height: 2, background: color, borderRadius: 99, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'var(--f-muted)', flex: 1 }}>Evolução — {metricName}</span>
        {totalG !== null && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: totalG >= 0 ? '#22C55E' : '#EF4444',
            background: totalG >= 0 ? '#22C55E18' : '#EF444418',
            borderRadius: 99, padding: '2px 8px', flexShrink: 0,
          }}>
            {totalG >= 0 ? '+' : ''}{totalG.toFixed(1)}% desde o início
          </span>
        )}
      </div>
    </div>
  )
}

// ─── GrowthBadge ──────────────────────────────────────────────────────────────

function GrowthBadge({ pct }) {
  if (pct === null || pct === undefined) return null
  const color = pct > 0 ? '#22C55E' : pct < 0 ? '#EF4444' : 'var(--f-muted)'
  const sign = pct > 0 ? '+' : ''
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}18`, borderRadius: 99, padding: '2px 7px' }}>
      {sign}{pct.toFixed(1)}%
    </span>
  )
}

// ─── Performance Tab ──────────────────────────────────────────────────────────

function PerformanceTab({ perf, onAdd, onDelete, clientName }) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState({ metricName: METRIC_NAMES[0], value: '', recordedAt: '', notes: '' })

  const groups = {}
  perf.forEach(r => {
    if (!groups[r.metric]) groups[r.metric] = []
    groups[r.metric].push(r)
  })

  function calcGrowth(records, idx) {
    if (idx === 0) return null
    const prev = records[idx - 1].value
    if (!prev) return null
    return ((records[idx].value - prev) / prev) * 100
  }

  function totalGrowth(records) {
    if (records.length < 2 || !records[0].value) return null
    return ((records[records.length - 1].value - records[0].value) / records[0].value) * 100
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.metricName || !form.value || !form.recordedAt) return
    onAdd(form)
    setForm({ metricName: METRIC_NAMES[0], value: '', recordedAt: '', notes: '' })
    setShowModal(false)
  }

  const metricEntries = Object.entries(groups)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--f-text)', margin: 0 }}>
            PERFORMANCE — {clientName?.toUpperCase()}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--f-muted)', marginTop: 3 }}>
            Evolução das métricas ao longo do tempo
          </p>
        </div>
        <button className="f-btn-primary" onClick={() => setShowModal(true)}>
          <Icon name="plus" size={13} />
          <span>Registrar métrica</span>
        </button>
      </div>

      {/* ── Summary cards strip ── */}
      {metricEntries.length > 0 && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {metricEntries.map(([metric, records]) => {
            const latest = records[records.length - 1]
            const total  = totalGrowth(records)
            return (
              <div key={metric} className="f-card" style={{ flexShrink: 0, minWidth: 150, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--f-muted-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                  {metric}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--f-yellow)', lineHeight: 1 }}>
                  {fmtVal(latest.value)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {total !== null
                    ? <GrowthBadge pct={total} />
                    : <span style={{ fontSize: 10, color: 'var(--f-muted-dim)' }}>Base</span>
                  }
                  <span style={{ fontSize: 10, color: 'var(--f-muted-dim)' }}>vs. início</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--f-muted-dim)', marginTop: 5 }}>
                  Atualizado em {fmtDate(latest.recordedAt)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Empty state ── */}
      {metricEntries.length === 0 && (
        <div className="f-card">
          <div className="f-empty-state" style={{ padding: '60px 20px' }}>
            <Icon name="chart" size={36} />
            <h3>Nenhuma métrica ainda</h3>
            <p>Registre a primeira leitura para começar a acompanhar a evolução.</p>
            <button className="f-btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 12 }}>
              <Icon name="plus" size={13} /> Registrar agora
            </button>
          </div>
        </div>
      )}

      {/* ── Metric cards ── */}
      {metricEntries.map(([metric, records]) => {
        const latest = records[records.length - 1]
        const total  = totalGrowth(records)
        return (
          <div key={metric} className="f-card">
            {/* Card header */}
            <div className="f-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 className="f-card-title">{metric}</h2>
                <span style={{ fontSize: 11, color: 'var(--f-muted-dim)' }}>{records.length} registro{records.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GrowthBadge pct={total} />
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--f-yellow)', lineHeight: 1 }}>
                  {fmtVal(latest.value)}
                </span>
              </div>
            </div>

            {/* Sparkline with scale + legend */}
            <div style={{ padding: '4px 20px 16px' }}>
              <Sparkline records={records} color="#FFD22E" metricName={metric} />
            </div>

            {/* Compact table */}
            <div style={{ borderTop: '1px solid var(--f-border)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Data', 'Valor', 'Variação', 'Crescimento%', 'Obs.'].map(h => (
                      <th key={h} style={{ padding: '7px 14px', textAlign: 'left', color: 'var(--f-muted-dim)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                    <th style={{ width: 32 }} />
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const growth = calcGrowth(records, i)
                    const delta  = i > 0 ? r.value - records[i - 1].value : null
                    return (
                      <tr key={r.id} style={{ borderTop: '1px solid var(--f-border)' }}>
                        <td style={{ padding: '7px 14px', color: 'var(--f-muted)', whiteSpace: 'nowrap' }}>
                          {fmtDate(r.recordedAt)}
                        </td>
                        <td style={{ padding: '7px 14px', fontWeight: 700, color: 'var(--f-yellow)' }}>
                          {r.value.toLocaleString('pt-BR')}
                        </td>
                        <td style={{ padding: '7px 14px' }}>
                          {delta !== null
                            ? <span style={{ color: delta >= 0 ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                                {delta >= 0 ? '+' : ''}{delta.toLocaleString('pt-BR')}
                              </span>
                            : <span style={{ color: 'var(--f-muted-dim)' }}>—</span>
                          }
                        </td>
                        <td style={{ padding: '7px 14px' }}>
                          {growth !== null
                            ? <GrowthBadge pct={growth} />
                            : <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--f-muted-dim)', background: 'rgba(255,255,255,0.05)', borderRadius: 99, padding: '2px 8px' }}>Base</span>
                          }
                        </td>
                        <td style={{ padding: '7px 14px', color: 'var(--f-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.notes || <span style={{ color: 'var(--f-muted-dim)' }}>—</span>}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                          <button
                            onClick={() => onDelete(r.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--f-muted-dim)', padding: 4, opacity: 0.6, lineHeight: 1 }}
                            title="Remover"
                          >
                            <Icon name="trash" size={12} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* ── Modal ── */}
      {showModal && (
        <div className="f-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="f-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="f-modal-header">
              <h3 className="f-modal-title">Registrar Métrica</h3>
              <button className="f-modal-close" onClick={() => setShowModal(false)}>
                <Icon name="close" size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="f-label">Métrica</label>
                <select className="f-input" value={form.metricName} onChange={e => setForm(f => ({ ...f, metricName: e.target.value }))}>
                  {METRIC_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="f-label">Valor</label>
                <input className="f-input" type="number" min="0" step="any" placeholder="ex: 1500" required value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
              </div>
              <div>
                <label className="f-label">Data do registro</label>
                <input className="f-input" type="date" required value={form.recordedAt} onChange={e => setForm(f => ({ ...f, recordedAt: e.target.value }))} />
              </div>
              <div>
                <label className="f-label">Observações (opcional)</label>
                <input className="f-input" type="text" placeholder="ex: crescimento orgânico" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="f-btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="f-btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────

const CAL_EVENTS = {
  1:  [{ color:'#FFD22E', label:'Reels' }],
  5:  [{ color:'#3B82F6', label:'Stories' }],
  8:  [{ color:'#22C55E', label:'Feed' }],
  12: [{ color:'#FFD22E', label:'Reels' }],
  15: [{ color:'#EF4444', label:'ATRASADO' }],
  19: [{ color:'#FFD22E', label:'Reels' }],
  22: [{ color:'#3B82F6', label:'Stories' }],
  27: [{ color:'#8B5CF6', label:'Carrossel' }],
  29: [{ color:'#FFD22E', label:'Reels' }],
}
const CAL_START_DAY = 5
const CAL_TOTAL = 31
const CAL_TODAY = 27
const WEEK_LABELS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function CalendarioTab({ clientName }) {
  const cells = []
  for (let i = 0; i < CAL_START_DAY; i++) cells.push(null)
  for (let d = 1; d <= CAL_TOTAL; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--f-text)', margin: 0 }}>
          CALENDÁRIO — {clientName?.toUpperCase()}
        </h2>
        <p style={{ fontSize: 12, color: 'var(--f-muted)', marginTop: 3 }}>
          Publicações agendadas para o mês
        </p>
      </div>

      <div className="f-detail-grid" style={{ gap: 16 }}>
        <div className="f-card">
          <div className="f-card-header">
            <div className="f-card-title">Maio 2026</div>
            <div style={{ display:'flex', gap:4 }}>
              <button className="f-btn-ghost f-btn-icon" style={{ width:30, height:30, transform:'scaleX(-1)' }}>
                <Icon name="arrow" size={14}/>
              </button>
              <button className="f-btn-ghost f-btn-icon" style={{ width:30, height:30 }}>
                <Icon name="arrow" size={14}/>
              </button>
            </div>
          </div>
          <div className="f-cal-grid">
            {WEEK_LABELS.map(w => (
              <span key={w} className="f-cal-week-label" style={{ padding:'4px 0 10px' }}>{w}</span>
            ))}
            {cells.map((day, idx) => (
              <div
                key={idx}
                className={`f-cal-day${!day ? ' is-empty' : ''}${day === CAL_TODAY ? ' is-today' : ''}`}
                style={{ minHeight:48, cursor: day ? 'pointer' : 'default' }}
              >
                {day && (
                  <>
                    <span className="f-cal-num">{day}</span>
                    <div style={{ display:'flex', gap:2, flexWrap:'wrap', justifyContent:'center' }}>
                      {(CAL_EVENTS[day] || []).slice(0,2).map((e, i) => (
                        <span key={i} className="f-cal-dot" style={{ background: e.color }}/>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="f-cal-legend" style={{ padding:'0 16px 16px' }}>
            {[
              { color:'#FFD22E', label:'Reels' },
              { color:'#22C55E', label:'Feed' },
              { color:'#3B82F6', label:'Stories' },
              { color:'#EF4444', label:'Atrasado' },
              { color:'#8B5CF6', label:'Carrossel' },
            ].map(l => (
              <div key={l.label} className="f-cal-legend-item">
                <span className="f-cal-dot" style={{ background: l.color }}/>
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="f-card" style={{ overflow:'hidden' }}>
          <div className="f-card-header">
            <div className="f-card-title">Próximas Publicações</div>
          </div>
          <div style={{ paddingBottom:4 }}>
            {[
              { title:'Reels — Antes e Depois',  format:'Reels',    date:'28 Mai', status:'Produção' },
              { title:'Carrossel — Dicas',        format:'Carrossel',date:'31 Mai', status:'Briefing' },
              { title:'Stories — Semana 4',       format:'Stories',  date:'01 Jun', status:'Agendado' },
              { title:'Post Feed — Resultado',    format:'Feed',     date:'25 Mai', status:'Publicado' },
            ].map((item, idx, arr) => (
              <div
                key={idx}
                style={{ padding:'12px 18px', borderBottom: idx < arr.length-1 ? '1px solid var(--f-border)' : 'none', display:'flex', alignItems:'center', gap:12 }}
              >
                <div style={{ width:36, height:36, borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid var(--f-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'var(--f-muted)' }}>
                  <Icon name="file" size={15}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--f-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</div>
                  <div style={{ fontSize:11, color:'var(--f-muted)', marginTop:2 }}>{clientName} · {item.format}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                  <StatusBadge status={item.status}/>
                  <span style={{ fontSize:11, color:'var(--f-muted)' }}>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { id } = useParams()
  const [client,  setClient]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [perf,    setPerf]    = useState([])
  const [tab,     setTab]     = useState('visao') // 'visao' | 'calendario' | 'performance'

  // Load client from Supabase
  useEffect(() => {
    if (!id) return
    supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setClient({
            id:           data.id,
            name:         data.name,
            niche:        data.niche        ?? '',
            plan:         data.plan         ?? '',
            status:       data.status       ?? 'Ativo',
            responsible:  data.responsible  ?? '',
            contents:     data.contents     ?? 0,
            instagram:    data.instagram    ?? '',
            whatsapp:     data.whatsapp     ?? '',
            email:        data.email        ?? '',
            observations: data.observations ?? '',
            color:        data.color        ?? '#FFD22E',
            initials:     data.initials     ?? data.name?.slice(0,2).toUpperCase(),
          })
        }
        setLoading(false)
      })
  }, [id])

  // Load performance records from Supabase
  useEffect(() => {
    if (!id) return
    supabase
      .from('performance_records')
      .select('*')
      .eq('client_id', id)
      .order('recorded_at', { ascending: true })
      .then(({ data }) => {
        setPerf((data ?? []).map(r => ({
          id:         r.id,
          clientId:   r.client_id,
          metric:     r.metric,
          value:      Number(r.value),
          recordedAt: r.recorded_at,
          notes:      r.notes ?? '',
        })))
      })
  }, [id])

  async function handleAddPerf(formData) {
    const { data, error } = await supabase
      .from('performance_records')
      .insert({
        client_id:   id,
        metric:      formData.metricName,
        value:       Number(formData.value) || 0,
        recorded_at: formData.recordedAt,
        notes:       formData.notes || '',
      })
      .select()
      .single()
    if (error) return
    setPerf(prev => [...prev, {
      id:         data.id,
      clientId:   data.client_id,
      metric:     data.metric,
      value:      Number(data.value),
      recordedAt: data.recorded_at,
      notes:      data.notes ?? '',
    }].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)))
  }

  async function handleDeletePerf(recId) {
    await supabase.from('performance_records').delete().eq('id', recId)
    setPerf(prev => prev.filter(r => r.id !== recId))
  }

  if (loading) {
    return (
      <>
        <FlowHeader title="Carregando…" subtitle="" />
        <main className="f-content">
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--f-muted)' }}>
            <Icon name="refresh" size={28} />
          </div>
        </main>
      </>
    )
  }

  if (!client) {
    return (
      <>
        <FlowHeader title="Cliente não encontrado" subtitle="" actions={
          <Link href="/flow/clientes" className="f-btn-ghost">
            <Icon name="arrow" size={14} style={{ transform: 'rotate(180deg)' }} /> Voltar
          </Link>
        } />
        <main className="f-content">
          <div className="f-empty-state" style={{ paddingTop: 80 }}>
            <Icon name="alert" size={40} />
            <h3>Este cliente não existe ou foi removido.</h3>
            <p>Verifique a lista de clientes.</p>
            <Link href="/flow/clientes" className="f-btn-primary" style={{ marginTop: 12, textDecoration: 'none' }}>
              <Icon name="users" size={14} /> Ver todos os clientes
            </Link>
          </div>
        </main>
      </>
    )
  }

  const accentColor  = client.color || '#FFD22E'
  const statusColor  = STATUS_COLOR[client.status] || '#A1A1AA'
  const clientSlug   = client.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const TABS = [
    { key: 'visao',       label: 'Visão Geral' },
    { key: 'calendario',  label: 'Calendário' },
    { key: 'performance', label: 'Performance' },
  ]

  return (
    <>
      <FlowHeader
        title={client.name}
        subtitle={`${client.niche} · Plano ${client.plan}`}
        actions={
          <Link href="/flow/clientes" className="f-btn-ghost" style={{ textDecoration: 'none' }}>
            <Icon name="arrow" size={14} style={{ transform: 'rotate(180deg)' }} /> Voltar
          </Link>
        }
      />

      <main className="f-content">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--f-border)', marginBottom: 4 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? 'var(--f-text)' : 'var(--f-muted)',
                borderBottom: `2px solid ${tab === t.key ? accentColor : 'transparent'}`,
                cursor: 'pointer',
                marginBottom: -1,
                transition: 'color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Visão Geral ── */}
        {tab === 'visao' && (
          <>
            {/* Client profile card */}
            <div className="f-card">
              <div className="client-profile-inner">
                <div className="client-avatar-wrap">
                  <div style={{ width: 72, height: 72, borderRadius: 18, background: `${accentColor}20`, border: `2px solid ${accentColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: accentColor }}>
                    {client.initials}
                  </div>
                </div>
                <div className="client-info-grid">
                  <InfoRow label="Status"><StatusBadge status={client.status} /></InfoRow>
                  <InfoRow label="Plano">{client.plan}</InfoRow>
                  <InfoRow label="Responsável">{client.responsible}</InfoRow>
                  <InfoRow label="Conteúdos/mês">
                    <span style={{ fontWeight: 800, color: accentColor, fontSize: 16 }}>{client.contents}</span>
                  </InfoRow>
                  {client.instagram && <InfoRow label="Instagram"><span style={{ color: 'var(--f-muted)' }}>{client.instagram}</span></InfoRow>}
                  {client.whatsapp  && <InfoRow label="WhatsApp"><span style={{ color: 'var(--f-muted)' }}>{client.whatsapp}</span></InfoRow>}
                  {client.email     && <InfoRow label="E-mail"><span style={{ color: 'var(--f-muted)', fontSize: 12 }}>{client.email}</span></InfoRow>}
                  {client.observations && (
                    <InfoRow label="Observações" full>
                      <span style={{ color: 'var(--f-muted)', lineHeight: 1.5 }}>{client.observations}</span>
                    </InfoRow>
                  )}
                </div>
              </div>
              <style>{`
                .client-profile-inner {
                  padding: 24px;
                  display: grid;
                  grid-template-columns: auto 1fr;
                  gap: 24px;
                  align-items: flex-start;
                }
                .client-avatar-wrap { flex-shrink: 0; }
                .client-info-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                  gap: 12px 24px;
                }
                @media (max-width: 600px) {
                  .client-profile-inner {
                    grid-template-columns: 1fr;
                    gap: 16px;
                    padding: 20px;
                  }
                  .client-avatar-wrap {
                    display: flex;
                    justify-content: center;
                  }
                  .client-info-grid {
                    grid-template-columns: 1fr 1fr;
                    gap: 14px 16px;
                  }
                }
              `}</style>
            </div>

            {/* Operation metrics */}
            <div className="f-metrics-grid">
              <MetricCard icon="file"     value={String(client.contents)} label="Conteúdos/mês"    desc="contratados no plano"  accentColor={accentColor} trend={8}  />
              <MetricCard icon="check"    value="2"                        label="Em aprovação"      desc="aguardando revisão"    accentColor="#F59E0B"     trend={0}  />
              <MetricCard icon="calendar" value="12"                       label="Publicados"        desc="neste mês"             accentColor="#22C55E"     trend={20} />
              <MetricCard icon="trending" value="6.4%"                     label="Engajamento médio" desc="vs. mês anterior"      accentColor="#3B82F6"     trend={15} />
            </div>

            {/* Two-column grid */}
            <div className="f-detail-grid">
              {/* Conteúdos */}
              <div className="f-card">
                <div className="f-card-header">
                  <div>
                    <h2 className="f-card-title">Conteúdos do Cliente</h2>
                    <p className="f-card-subtitle">Produção em andamento</p>
                  </div>
                  <Link href="/flow/conteudos" className="f-btn-ghost" style={{ textDecoration: 'none', fontSize: 12 }}>
                    Ver todos <Icon name="arrow" size={13} />
                  </Link>
                </div>
                <div>
                  {[
                    { title:'Reels — Antes e Depois',  format:'Reels',     deadline:'28 Mai', status:'Produção',             responsible:'Ana Lima'  },
                    { title:'Carrossel — Dicas',        format:'Carrossel', deadline:'31 Mai', status:'Briefing',             responsible:'Pedro H.'  },
                    { title:'Stories — Semana 4',       format:'Stories',   deadline:'01 Jun', status:'Agendado',             responsible:'Ana Lima'  },
                    { title:'Post Feed — Resultado',    format:'Feed',      deadline:'25 Mai', status:'Publicado',            responsible:'Carlos M.' },
                    { title:'Reels — Treino Especial',  format:'Reels',     deadline:'26 Mai', status:'Aguardando Aprovação', responsible:'Pedro H.'  },
                  ].map((c, i, arr) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--f-border)' : 'none' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--f-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--f-muted)', flexShrink: 0 }}>
                        <Icon name="file" size={14} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--f-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--f-muted)', marginTop: 2 }}>{c.format} · {c.responsible}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <StatusBadge status={c.status} />
                        <span style={{ fontSize: 10, color: 'var(--f-muted)' }}>{c.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Aprovações */}
                <div className="f-card">
                  <div className="f-card-header" style={{ padding: '14px 18px 12px' }}>
                    <div>
                      <h2 className="f-card-title" style={{ fontSize: 14 }}>Aprovações</h2>
                      <p className="f-card-subtitle">Pendentes de revisão</p>
                    </div>
                    <Link href="/flow/aprovacoes" className="f-btn-ghost" style={{ textDecoration: 'none', fontSize: 11 }}>
                      Ver <Icon name="arrow" size={12} />
                    </Link>
                  </div>
                  <div>
                    {[
                      { title:'Reels — Treino Especial', status:'Aguardando revisão',  date:'26 Mai' },
                      { title:'Post — Semana 3',         status:'Liberado p/ cliente', date:'22 Mai' },
                    ].map((a, i, arr) => (
                      <div key={i} style={{ padding: '10px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--f-border)' : 'none' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--f-text)', marginBottom: 4 }}>{a.title}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <StatusBadge status={a.status} />
                          <span style={{ fontSize: 10, color: 'var(--f-muted)' }}>{a.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick links */}
                <div className="f-card">
                  <div className="f-card-header" style={{ padding: '14px 18px 12px' }}>
                    <h2 className="f-card-title" style={{ fontSize: 14 }}>Acesso Rápido</h2>
                  </div>
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button onClick={() => setTab('calendario')} className="f-nav-item" style={{ background:'none', border:'none', cursor:'pointer', borderRadius:8, padding:'8px 10px', width:'100%', textAlign:'left' }}>
                      <span className="f-nav-icon"><Icon name="calendar" size={15}/></span>
                      <span className="f-nav-text">Calendário</span>
                      <Icon name="arrow" size={13}/>
                    </button>
                    <button onClick={() => setTab('performance')} className="f-nav-item" style={{ background:'none', border:'none', cursor:'pointer', borderRadius:8, padding:'8px 10px', width:'100%', textAlign:'left' }}>
                      <span className="f-nav-icon"><Icon name="chart" size={15}/></span>
                      <span className="f-nav-text">Performance</span>
                      <Icon name="arrow" size={13}/>
                    </button>
                    <Link href={`/flow/biblioteca/${clientSlug}`} className="f-nav-item" style={{ textDecoration:'none', borderRadius:8, padding:'8px 10px' }}>
                      <span className="f-nav-icon"><Icon name="folder" size={15}/></span>
                      <span className="f-nav-text">Biblioteca</span>
                      <Icon name="arrow" size={13}/>
                    </Link>
                    <Link href="/flow/workflow" className="f-nav-item" style={{ textDecoration:'none', borderRadius:8, padding:'8px 10px' }}>
                      <span className="f-nav-icon"><Icon name="workflow" size={15}/></span>
                      <span className="f-nav-text">Workflow</span>
                      <Icon name="arrow" size={13}/>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Calendário ── */}
        {tab === 'calendario' && (
          <CalendarioTab clientName={client.name} />
        )}

        {/* ── Performance ── */}
        {tab === 'performance' && (
          <PerformanceTab
            perf={perf}
            onAdd={handleAddPerf}
            onDelete={handleDeletePerf}
            clientName={client.name}
          />
        )}
      </main>
    </>
  )
}

function InfoRow({ label, children, full }) {
  return (
    <div style={full ? { gridColumn: '1 / -1' } : {}}>
      <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--f-muted-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--f-text)', display: 'block' }}>{children}</span>
    </div>
  )
}
