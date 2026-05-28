'use client'

import { useState, useEffect } from 'react'
import FlowHeader from '@/components/flow/FlowHeader'
import StatusBadge from '@/components/flow/StatusBadge'
import Icon from '@/components/flow/FlowIcons'
import { supabase } from '@/lib/supabase'

const FORMAT_COLORS = {
  'Reels':    '#FFD22E',
  'Feed':     '#22C55E',
  'Stories':  '#3B82F6',
  'Carrossel':'#8B5CF6',
  'Blog':     '#F59E0B',
  'Landing':  '#06B6D4',
}
const WEEK_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTH_PT    = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtShort(iso) {
  if (!iso) return ''
  const [,m,d] = iso.split('-')
  return `${Number(d)} ${MONTH_PT[Number(m)-1]}`
}

const selectSt = {
  backgroundColor:'#1E1E1E',
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23FFD22E' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center',
  border:'1px solid var(--f-border)', borderRadius:'var(--f-r-sm)',
  color:'var(--f-text)', fontSize:13, padding:'6px 28px 6px 10px',
  cursor:'pointer', outline:'none', appearance:'none', WebkitAppearance:'none',
}

export default function CalendarioPage() {
  const now = new Date()
  const [year,    setYear]    = useState(now.getFullYear())
  const [month,   setMonth]   = useState(now.getMonth())
  const [contents,setContents]= useState([])
  const [clients, setClients] = useState([])
  const [fClient, setFClient] = useState('')
  const [fFormat, setFFormat] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: rows }, { data: clientRows }] = await Promise.all([
        supabase.from('contents')
          .select('id,title,format,status,client,pub_date')
          .not('pub_date','is',null)
          .order('pub_date', { ascending: true }),
        supabase.from('clients').select('name').order('name'),
      ])
      setContents(rows ?? [])
      setClients((clientRows ?? []).map(r => r.name))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = contents.filter(c => {
    if (fClient && c.client !== fClient) return false
    if (fFormat && c.format !== fFormat) return false
    return true
  })

  // Events for current month
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthContents = filtered.filter(c => c.pub_date?.startsWith(monthStr))
  const events = {}
  monthContents.forEach(c => {
    const day = parseInt(c.pub_date.split('-')[2])
    if (!events[day]) events[day] = []
    events[day].push({
      color: FORMAT_COLORS[c.format] ?? '#A1A1AA',
      title: c.title,
      format: c.format,
    })
  })

  // Calendar math
  const firstDay  = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const todayNum  = (now.getFullYear() === year && now.getMonth() === month) ? now.getDate() : -1

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  // Upcoming: pub_date >= today, sorted ascending
  const todayStr = now.toISOString().slice(0, 10)
  const upcoming = filtered
    .filter(c => c.pub_date >= todayStr)
    .sort((a, b) => a.pub_date.localeCompare(b.pub_date))
    .slice(0, 8)

  // Legend from formats actually in this month
  const legendFormats = [...new Set(monthContents.map(c => c.format))].filter(f => FORMAT_COLORS[f])
  if (monthContents.some(c => c.status === 'Atrasado')) legendFormats.push('__late')

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const formats = Object.keys(FORMAT_COLORS)

  return (
    <>
      <FlowHeader
        title="Calendário Editorial"
        subtitle="Visualize entregas, datas de publicação e volume por cliente."
        actions={
          <button className="f-btn-primary">
            <Icon name="plus" size={14}/> <span>Novo Agendamento</span>
          </button>
        }
      />
      <main className="f-content">

        {/* Filters */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', paddingBottom:4 }}>
          <select style={selectSt} value={fClient} onChange={e => setFClient(e.target.value)}>
            <option value="">Todos os clientes</option>
            {clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={selectSt} value={fFormat} onChange={e => setFFormat(e.target.value)}>
            <option value="">Todos os formatos</option>
            {formats.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Two-column layout */}
        <div className="f-detail-grid" style={{ gap:16 }}>

          {/* Calendar card */}
          <div className="f-card">
            <div className="f-card-header">
              <div className="f-card-title">{MONTH_NAMES[month]} {year}</div>
              <div style={{ display:'flex', gap:4 }}>
                <button className="f-btn-ghost f-btn-icon" style={{ width:30, height:30 }} onClick={prevMonth}>
                  <span style={{ transform:'scaleX(-1)', display:'inline-block' }}><Icon name="arrow" size={14}/></span>
                </button>
                <button className="f-btn-ghost f-btn-icon" style={{ width:30, height:30 }} onClick={nextMonth}>
                  <Icon name="arrow" size={14}/>
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--f-muted)' }}>Carregando...</div>
            ) : (
              <>
                <div className="f-cal-grid">
                  {WEEK_LABELS.map(w => (
                    <span key={w} className="f-cal-week-label" style={{ padding:'4px 0 10px' }}>{w}</span>
                  ))}
                  {cells.map((day, idx) => (
                    <div
                      key={idx}
                      className={`f-cal-day${!day ? ' is-empty' : ''}${day === todayNum ? ' is-today' : ''}`}
                      style={{ minHeight:48, cursor: day ? 'pointer' : 'default' }}
                    >
                      {day && (
                        <>
                          <span className="f-cal-num">{day}</span>
                          <div style={{ display:'flex', gap:2, flexWrap:'wrap', justifyContent:'center' }}>
                            {(events[day] || []).slice(0, 3).map((e, i) => (
                              <span key={i} className="f-cal-dot" style={{ background: e.color }}/>
                            ))}
                            {(events[day] || []).length > 3 && (
                              <span style={{ fontSize:9, color:'var(--f-muted)' }}>+{events[day].length - 3}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                {legendFormats.length > 0 && (
                  <div className="f-cal-legend" style={{ padding:'0 16px 16px' }}>
                    {legendFormats.map(f => f === '__late'
                      ? <div key={f} className="f-cal-legend-item"><span className="f-cal-dot" style={{ background:'#EF4444' }}/><span>Atrasado</span></div>
                      : <div key={f} className="f-cal-legend-item"><span className="f-cal-dot" style={{ background:FORMAT_COLORS[f] }}/><span>{f}</span></div>
                    )}
                  </div>
                )}

                {monthContents.length === 0 && (
                  <div style={{ padding:'20px', textAlign:'center', color:'var(--f-muted)', fontSize:13 }}>
                    Nenhum conteúdo agendado para {MONTH_NAMES[month].toLowerCase()}.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Upcoming Publications */}
          <div className="f-card" style={{ overflow:'hidden' }}>
            <div className="f-card-header">
              <div className="f-card-title">Próximas Publicações</div>
              <span style={{ fontSize:12, color:'var(--f-muted)' }}>{upcoming.length} agendadas</span>
            </div>

            {loading ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--f-muted)' }}>Carregando...</div>
            ) : upcoming.length === 0 ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--f-muted)', fontSize:13 }}>
                Nenhuma publicação próxima.
              </div>
            ) : (
              <div style={{ paddingBottom:4 }}>
                {upcoming.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{ padding:'12px 18px', borderBottom: idx < upcoming.length - 1 ? '1px solid var(--f-border)' : 'none', display:'flex', alignItems:'center', gap:12 }}
                  >
                    <div style={{ width:36, height:36, borderRadius:8, background:`${FORMAT_COLORS[item.format] ?? '#A1A1AA'}15`, border:'1px solid var(--f-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color: FORMAT_COLORS[item.format] ?? 'var(--f-muted)' }}>
                      <Icon name="file" size={15}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--f-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</div>
                      <div style={{ fontSize:11, color:'var(--f-muted)', marginTop:2 }}>{item.client} · {item.format}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                      <StatusBadge status={item.status}/>
                      <span style={{ fontSize:11, color:'var(--f-muted)' }}>{fmtShort(item.pub_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  )
}
