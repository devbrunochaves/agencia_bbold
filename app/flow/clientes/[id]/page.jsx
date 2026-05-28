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

const METRIC_COLORS = {
  'Seguidores Instagram': '#EC4899',
  'Seguidores YouTube':   '#EF4444',
  'Alcance médio':        '#4ADE80',
  'Engajamento (%)':      '#A78BFA',
  'Impressões':           '#FFD22E',
  'Curtidas':             '#3B82F6',
  'Comentários':          '#A3E635',
  'Compartilhamentos':    '#F9A8D4',
  'Saves':                '#FEF08A',
}

function metricColor(name) {
  return METRIC_COLORS[name] ?? '#FFD22E'
}

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
            const color  = metricColor(metric)
            return (
              <div key={metric} className="f-card" style={{ flexShrink: 0, minWidth: 150, padding: '14px 16px', borderTop: `2px solid ${color}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--f-muted-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                  {metric}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>
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
        const color  = metricColor(metric)
        return (
          <div key={metric} className="f-card" style={{ borderLeft: `3px solid ${color}` }}>
            {/* Card header */}
            <div className="f-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                <h2 className="f-card-title">{metric}</h2>
                <span style={{ fontSize: 11, color: 'var(--f-muted-dim)' }}>{records.length} registro{records.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GrowthBadge pct={total} />
                <span style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>
                  {fmtVal(latest.value)}
                </span>
              </div>
            </div>

            {/* Sparkline with scale + legend */}
            <div style={{ padding: '4px 20px 16px' }}>
              <Sparkline records={records} color={color} metricName={metric} />
            </div>

            {/* Compact table */}
            <div style={{ borderTop: '1px solid var(--f-border)', overflowX: 'auto' }}>
              <table className="perf-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '7px 12px', textAlign: 'left', color: 'var(--f-muted-dim)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Data</th>
                    <th style={{ padding: '7px 12px', textAlign: 'left', color: 'var(--f-muted-dim)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Valor</th>
                    <th className="perf-col-var" style={{ padding: '7px 12px', textAlign: 'left', color: 'var(--f-muted-dim)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Variação</th>
                    <th style={{ padding: '7px 12px', textAlign: 'left', color: 'var(--f-muted-dim)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Crescimento%</th>
                    <th className="perf-col-obs" style={{ padding: '7px 12px', textAlign: 'left', color: 'var(--f-muted-dim)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Obs.</th>
                    <th style={{ width: 32 }} />
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const growth = calcGrowth(records, i)
                    const delta  = i > 0 ? r.value - records[i - 1].value : null
                    return (
                      <tr key={r.id} style={{ borderTop: '1px solid var(--f-border)' }}>
                        <td style={{ padding: '7px 12px', color: 'var(--f-muted)', whiteSpace: 'nowrap' }}>
                          {fmtDate(r.recordedAt)}
                        </td>
                        <td style={{ padding: '7px 12px', fontWeight: 700, color, whiteSpace: 'nowrap' }}>
                          {r.value.toLocaleString('pt-BR')}
                        </td>
                        <td className="perf-col-var" style={{ padding: '7px 12px' }}>
                          {delta !== null
                            ? <span style={{ color: delta >= 0 ? '#22C55E' : '#EF4444', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {delta >= 0 ? '+' : ''}{delta.toLocaleString('pt-BR')}
                              </span>
                            : <span style={{ color: 'var(--f-muted-dim)' }}>—</span>
                          }
                        </td>
                        <td style={{ padding: '7px 12px' }}>
                          {growth !== null
                            ? <GrowthBadge pct={growth} />
                            : <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--f-muted-dim)', background: 'rgba(255,255,255,0.05)', borderRadius: 99, padding: '2px 8px' }}>Base</span>
                          }
                        </td>
                        <td className="perf-col-obs" style={{ padding: '7px 12px', color: 'var(--f-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.notes || <span style={{ color: 'var(--f-muted-dim)' }}>—</span>}
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'right' }}>
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
              <style>{`
                @media (max-width: 640px) {
                  .perf-col-obs,
                  .perf-col-var { display: none; }
                  .perf-table td, .perf-table th { padding-left: 10px !important; padding-right: 10px !important; }
                }
              `}</style>
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
                <input
                  className="f-input"
                  type="date"
                  required
                  value={form.recordedAt}
                  onChange={e => setForm(f => ({ ...f, recordedAt: e.target.value }))}
                  style={{ minHeight: 42, colorScheme: 'dark', WebkitAppearance: 'none' }}
                />
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

// ─── Conteúdo Tab ────────────────────────────────────────────────────────────

const CONTENT_FORMATS  = ['Reels', 'Feed', 'Stories', 'Carrossel', 'Blog', 'Landing']
const CONTENT_STATUSES = ['Briefing', 'Produção', 'Revisão', 'Aguardando Aprovação', 'Agendado', 'Publicado']

function ConteudoTab({ client }) {
  const [contents,   setContents]   = useState([])
  const [loadingC,   setLoadingC]   = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [editItem,   setEditItem]   = useState(null)
  const [form, setForm] = useState({ title: '', format: 'Reels', status: 'Briefing', responsible: '', pubDate: '' })

  useEffect(() => {
    supabase
      .from('contents')
      .select('*')
      .eq('client', client.name)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setContents((data ?? []).map(r => ({
          id:          r.id,
          title:       r.title,
          format:      r.format      ?? '',
          status:      r.status      ?? 'Briefing',
          responsible: r.responsible ?? '',
          pubDate:     r.pub_date    ?? '',
        })))
        setLoadingC(false)
      })
  }, [client.name])

  function openCreate() {
    setEditItem(null)
    setForm({ title: '', format: 'Reels', status: 'Briefing', responsible: '', pubDate: '' })
    setShowModal(true)
  }

  function openEdit(c) {
    setEditItem(c)
    setForm({ title: c.title, format: c.format, status: c.status, responsible: c.responsible, pubDate: c.pubDate ?? '' })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const payload = {
      title:       form.title.trim(),
      client:      client.name,
      format:      form.format,
      status:      form.status,
      responsible: form.responsible,
      pub_date:    form.pubDate || null,
    }
    if (editItem) {
      const { data } = await supabase.from('contents').update(payload).eq('id', editItem.id).select().single()
      if (data) setContents(prev => prev.map(c => c.id === editItem.id ? { ...c, ...form } : c))
    } else {
      const { data } = await supabase.from('contents').insert({ ...payload, channel: '', priority: 'Normal' }).select().single()
      if (data) setContents(prev => [{ id: data.id, title: data.title, format: data.format, status: data.status, responsible: data.responsible, pubDate: data.pub_date ?? '' }, ...prev])
    }
    setShowModal(false)
  }

  async function handleDelete(cid) {
    await supabase.from('contents').delete().eq('id', cid)
    setContents(prev => prev.filter(c => c.id !== cid))
  }

  async function handleStatusChange(cid, newStatus) {
    await supabase.from('contents').update({ status: newStatus }).eq('id', cid)
    setContents(prev => prev.map(c => c.id === cid ? { ...c, status: newStatus } : c))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--f-text)', margin: 0 }}>
            CONTEÚDO — {client.name.toUpperCase()}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--f-muted)', marginTop: 3 }}>
            Produções e publicações deste cliente
          </p>
        </div>
        <button className="f-btn-primary" onClick={openCreate}>
          <Icon name="plus" size={13} />
          <span>Novo conteúdo</span>
        </button>
      </div>

      {/* List */}
      {loadingC ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--f-muted)' }}>
          <Icon name="refresh" size={22} />
        </div>
      ) : contents.length === 0 ? (
        <div className="f-card">
          <div className="f-empty-state" style={{ padding: '56px 20px' }}>
            <Icon name="file" size={36} />
            <h3>Nenhum conteúdo ainda</h3>
            <p>Crie o primeiro conteúdo para este cliente.</p>
            <button className="f-btn-primary" onClick={openCreate} style={{ marginTop: 12 }}>
              <Icon name="plus" size={13} /> Criar agora
            </button>
          </div>
        </div>
      ) : (
        <div className="f-card">
          {contents.map((c, i) => (
            <div
              key={c.id}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < contents.length - 1 ? '1px solid var(--f-border)' : 'none' }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--f-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--f-muted)', flexShrink: 0 }}>
                <Icon name="file" size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--f-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                <div style={{ fontSize: 11, color: 'var(--f-muted)', marginTop: 2 }}>
                  {c.format}{c.responsible ? ` · ${c.responsible}` : ''}
                  {c.pubDate ? ` · ${fmtDate(c.pubDate)}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <select
                  value={c.status}
                  onChange={e => handleStatusChange(c.id, e.target.value)}
                  style={{ background: 'transparent', border: 'none', fontSize: 11, color: 'var(--f-muted)', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
                >
                  {CONTENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <StatusBadge status={c.status} />
                <button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--f-muted-dim)', padding: 4, opacity: 0.7, lineHeight: 1 }} title="Editar">
                  <Icon name="edit" size={13} />
                </button>
                <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--f-muted-dim)', padding: 4, opacity: 0.6, lineHeight: 1 }} title="Remover">
                  <Icon name="trash" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="f-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="f-modal" onClick={e => e.stopPropagation()}>
            <div className="f-modal-header">
              <h3 className="f-modal-title">{editItem ? 'Editar Conteúdo' : 'Novo Conteúdo'}</h3>
              <button className="f-modal-close" onClick={() => setShowModal(false)}><Icon name="close" size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="f-label">Título *</label>
                <input className="f-input" type="text" required placeholder="ex: Reels — Antes e Depois" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="f-label">Formato</label>
                  <select className="f-input" value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}>
                    {CONTENT_FORMATS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="f-label">Status</label>
                  <select className="f-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {CONTENT_STATUSES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="f-label">Responsável</label>
                  <input className="f-input" type="text" placeholder="Nome" value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} />
                </div>
                <div>
                  <label className="f-label">Data de publicação</label>
                  <input className="f-input" type="date" value={form.pubDate} onChange={e => setForm(f => ({ ...f, pubDate: e.target.value }))} style={{ minHeight: 42, colorScheme: 'dark' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="f-btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="f-btn-primary">{editItem ? 'Salvar' : 'Criar conteúdo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────

const FORMAT_COLORS = {
  'Reels':     '#FFD22E',
  'Feed':      '#22C55E',
  'Stories':   '#3B82F6',
  'Carrossel': '#8B5CF6',
  'Blog':      '#F59E0B',
  'Landing':   '#06B6D4',
}

const WEEK_LABELS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTH_NAMES  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function CalendarioTab({ clientName }) {
  const now = new Date()
  const [year,     setYear]     = useState(now.getFullYear())
  const [month,    setMonth]    = useState(now.getMonth())
  const [contents, setContents] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase
      .from('contents')
      .select('*')
      .eq('client', clientName)
      .not('pub_date', 'is', null)
      .then(({ data }) => {
        setContents((data ?? []).map(r => ({
          id:      r.id,
          title:   r.title,
          format:  r.format  ?? '',
          status:  r.status  ?? 'Briefing',
          pubDate: r.pub_date,
        })))
        setLoading(false)
      })
  }, [clientName])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Build day → events map for the current viewed month
  const events = {}
  contents.forEach(c => {
    if (!c.pubDate) return
    const d = new Date(c.pubDate + 'T00:00:00')
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!events[day]) events[day] = []
      events[day].push({ color: FORMAT_COLORS[c.format] ?? '#A1A1AA', label: c.format || 'Outro', title: c.title })
    }
  })

  const startDay  = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const todayObj  = new Date()
  const calToday  = (todayObj.getFullYear() === year && todayObj.getMonth() === month) ? todayObj.getDate() : -1

  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  // Upcoming: future-dated contents sorted ascending
  const todayStr = todayObj.toISOString().slice(0, 10)
  const upcoming = [...contents]
    .filter(c => c.pubDate >= todayStr)
    .sort((a, b) => a.pubDate.localeCompare(b.pubDate))
    .slice(0, 6)

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
            <div className="f-card-title">{MONTH_NAMES[month]} {year}</div>
            <div style={{ display:'flex', gap:4 }}>
              <button className="f-btn-ghost f-btn-icon" style={{ width:30, height:30, transform:'scaleX(-1)' }} onClick={prevMonth}>
                <Icon name="arrow" size={14}/>
              </button>
              <button className="f-btn-ghost f-btn-icon" style={{ width:30, height:30 }} onClick={nextMonth}>
                <Icon name="arrow" size={14}/>
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--f-muted)' }}>
              <Icon name="refresh" size={22}/>
            </div>
          ) : (
            <>
              <div className="f-cal-grid">
                {WEEK_LABELS.map(w => (
                  <span key={w} className="f-cal-week-label" style={{ padding:'4px 0 10px' }}>{w}</span>
                ))}
                {cells.map((day, idx) => (
                  <div
                    key={idx}
                    className={`f-cal-day${!day ? ' is-empty' : ''}${day === calToday ? ' is-today' : ''}`}
                    style={{ minHeight:48, cursor: day ? 'pointer' : 'default' }}
                  >
                    {day && (
                      <>
                        <span className="f-cal-num">{day}</span>
                        <div style={{ display:'flex', gap:2, flexWrap:'wrap', justifyContent:'center' }}>
                          {(events[day] || []).slice(0, 3).map((e, i) => (
                            <span key={i} className="f-cal-dot" style={{ background: e.color }} title={e.title}/>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="f-cal-legend" style={{ padding:'0 16px 16px' }}>
                {Object.entries(FORMAT_COLORS).map(([label, color]) => (
                  <div key={label} className="f-cal-legend-item">
                    <span className="f-cal-dot" style={{ background: color }}/>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="f-card" style={{ overflow:'hidden' }}>
          <div className="f-card-header">
            <div className="f-card-title">Próximas Publicações</div>
          </div>
          <div style={{ paddingBottom: 4 }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--f-muted)' }}>
                <Icon name="refresh" size={22}/>
              </div>
            ) : upcoming.length === 0 ? (
              <div className="f-empty-state" style={{ padding: '36px 20px' }}>
                <Icon name="calendar" size={28}/>
                <h3>Sem publicações agendadas</h3>
                <p>Adicione datas de publicação na aba Conteúdo.</p>
              </div>
            ) : upcoming.map((item, idx) => (
              <div
                key={item.id}
                style={{ padding:'12px 18px', borderBottom: idx < upcoming.length - 1 ? '1px solid var(--f-border)' : 'none', display:'flex', alignItems:'center', gap:12 }}
              >
                <div style={{ width:36, height:36, borderRadius:8, background:`${FORMAT_COLORS[item.format] ?? '#A1A1AA'}18`, border:`1px solid ${FORMAT_COLORS[item.format] ?? '#A1A1AA'}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color: FORMAT_COLORS[item.format] ?? '#A1A1AA' }}>
                  <Icon name="file" size={15}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--f-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</div>
                  <div style={{ fontSize:11, color:'var(--f-muted)', marginTop:2 }}>{clientName} · {item.format}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                  <StatusBadge status={item.status}/>
                  <span style={{ fontSize:11, color:'var(--f-muted)' }}>{fmtDate(item.pubDate)}</span>
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
  const [client,         setClient]         = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [perf,           setPerf]           = useState([])
  const [clientContents, setClientContents] = useState([])
  const [clientApprovals,setClientApprovals]= useState([])
  const [tab,            setTab]            = useState('visao')

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

  // Load performance records, contents and approvals from Supabase
  useEffect(() => {
    if (!id || !client) return

    Promise.all([
      supabase
        .from('performance_records')
        .select('*')
        .eq('client_id', id)
        .order('recorded_at', { ascending: true }),
      supabase
        .from('contents')
        .select('id, title, format, status, pub_date, responsible')
        .eq('client', client.name),
      supabase
        .from('approvals')
        .select('id, title, status, priority')
        .eq('client', client.name),
    ]).then(([perfRes, contentsRes, approvalsRes]) => {
      setPerf((perfRes.data ?? []).map(r => ({
        id:         r.id,
        clientId:   r.client_id,
        metric:     r.metric,
        value:      Number(r.value),
        recordedAt: r.recorded_at,
        notes:      r.notes ?? '',
      })))
      setClientContents(contentsRes.data ?? [])
      setClientApprovals(approvalsRes.data ?? [])
    })
  }, [id, client?.name])

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
    { key: 'conteudo',    label: 'Conteúdo' },
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

            {/* Operation metrics — computed from real Supabase data */}
            {(() => {
              const thisMonth = new Date().toISOString().slice(0, 7)

              const pendingApprovals = clientApprovals.filter(a =>
                a.status === 'Aguardando revisão' || a.status === 'Liberado p/ cliente'
              ).length

              const publishedThisMonth = clientContents.filter(c =>
                c.status === 'Publicado' && c.pub_date && c.pub_date.startsWith(thisMonth)
              ).length

              const publishedTotal = clientContents.filter(c => c.status === 'Publicado').length

              // Latest engagement from performance records
              const engRecords = perf
                .filter(r => r.metric === 'Engajamento (%)')
                .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
              const latestEng = engRecords[engRecords.length - 1]
              const prevEng   = engRecords[engRecords.length - 2]
              const engValue  = latestEng ? `${latestEng.value.toFixed(1)}%` : '—'
              const engTrend  = latestEng && prevEng && prevEng.value
                ? Number((((latestEng.value - prevEng.value) / prevEng.value) * 100).toFixed(0))
                : null

              // Published trend: this month vs last month
              const lastMonth = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7) })()
              const publishedLastMonth = clientContents.filter(c =>
                c.status === 'Publicado' && c.pub_date && c.pub_date.startsWith(lastMonth)
              ).length
              const pubTrend = publishedLastMonth > 0
                ? Number((((publishedThisMonth - publishedLastMonth) / publishedLastMonth) * 100).toFixed(0))
                : null

              return (
                <div className="f-metrics-grid">
                  <MetricCard icon="file"     value={String(client.contents)}       label="Conteúdos/mês"    desc="contratados no plano"     accentColor={accentColor} trend={null} />
                  <MetricCard icon="check"    value={String(pendingApprovals)}       label="Em aprovação"     desc="aguardando revisão"        accentColor="#F59E0B"     trend={null} />
                  <MetricCard icon="calendar" value={String(publishedThisMonth || publishedTotal)} label="Publicados" desc={publishedThisMonth > 0 ? "neste mês" : "total"} accentColor="#22C55E" trend={pubTrend} />
                  <MetricCard icon="trending" value={engValue}                       label="Engajamento médio" desc={latestEng ? `registrado em ${fmtDate(latestEng.recordedAt)}` : 'sem dados ainda'} accentColor="#3B82F6" trend={engTrend} />
                </div>
              )
            })()}

          </>
        )}

        {/* ── Conteúdo ── */}
        {tab === 'conteudo' && (
          <ConteudoTab client={client} />
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
