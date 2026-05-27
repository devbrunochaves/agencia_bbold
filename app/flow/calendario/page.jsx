'use client'

import FlowHeader from '@/components/flow/FlowHeader'
import StatusBadge from '@/components/flow/StatusBadge'
import Icon from '@/components/flow/FlowIcons'

const EVENTS = {
  1:  [{ color:'#FFD22E', label:'Reels Alpha' }],
  3:  [{ color:'#22C55E', label:'Feed Origem' }],
  5:  [{ color:'#3B82F6', label:'Stories Essenza' }],
  7:  [{ color:'#FFD22E', label:'Reels Urban' }],
  8:  [{ color:'#22C55E', label:'Feed Alpha' }],
  10: [{ color:'#3B82F6', label:'Stories Alpha' }],
  12: [{ color:'#FFD22E', label:'Reels Bella' },{ color:'#22C55E', label:'Feed Odonto' }],
  14: [{ color:'#22C55E', label:'Feed Essenza' }],
  15: [{ color:'#EF4444', label:'ATRASADO' }],
  17: [{ color:'#3B82F6', label:'Stories Urban' }],
  19: [{ color:'#FFD22E', label:'Reels Alpha' }],
  21: [{ color:'#22C55E', label:'Feed Origem' },{ color:'#3B82F6', label:'Stories Bella' }],
  22: [{ color:'#3B82F6', label:'Stories Alpha' }],
  24: [{ color:'#FFD22E', label:'Reels Essenza' }],
  26: [{ color:'#22C55E', label:'Feed Urban' }],
  27: [{ color:'#8B5CF6', label:'Carrossel Alpha' }],
  28: [{ color:'#3B82F6', label:'Stories Odonto' }],
  29: [{ color:'#FFD22E', label:'Reels Bella' }],
  31: [{ color:'#22C55E', label:'Feed Alpha' }],
}

const UPCOMING = [
  { title:'Reels — Antes e Depois',   client:'Academia Alpha',    date:'28 Mai', format:'Reels',    status:'Produção' },
  { title:'Post Feed — Cardápio',     client:'Restaurante Origem',date:'27 Mai', format:'Feed',     status:'Aguardando Aprovação' },
  { title:'Stories — Promoção',       client:'Loja Urban Fit',    date:'30 Mai', format:'Stories',  status:'Briefing' },
  { title:'Reels — Treino do Mês',    client:'Academia Alpha',    date:'29 Mai', format:'Reels',    status:'Revisão' },
  { title:'Post Feed — Lançamento',   client:'Urban Fit Store',   date:'01 Jun', format:'Feed',     status:'Agendado' },
]

const WEEK_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const LEGEND = [
  { color:'#FFD22E', label:'Reels' },
  { color:'#22C55E', label:'Feed' },
  { color:'#3B82F6', label:'Stories' },
  { color:'#EF4444', label:'Atrasado' },
  { color:'#8B5CF6', label:'Carrossel' },
]

// May 2026: 31 days, starts on Friday (index 5)
const START_DAY = 5
const TOTAL_DAYS = 31
const TODAY = 26

function buildCalendarCells() {
  const cells = []
  for (let i = 0; i < START_DAY; i++) cells.push(null)
  for (let d = 1; d <= TOTAL_DAYS; d++) cells.push(d)
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const CELLS = buildCalendarCells()

export default function CalendarioPage() {
  const actions = (
    <button className="f-btn-primary" style={{ display:'flex', alignItems:'center', gap:6 }}>
      <Icon name="plus" size={14}/>
      Novo Agendamento
    </button>
  )

  return (
    <>
      <FlowHeader
        title="Calendário Editorial"
        subtitle="Visualize entregas, datas de publicação e volume por cliente."
        actions={actions}
      />
      <main className="f-content">
        {/* Filters */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', paddingBottom:4 }}>
          <select
            style={{
              background:'transparent',
              border:'1px solid var(--f-border)',
              borderRadius:'var(--f-r-sm)',
              color:'var(--f-muted)',
              fontSize:13,
              padding:'6px 10px',
              cursor:'pointer',
              outline:'none',
            }}
          >
            <option value="">Todos os clientes</option>
            <option value="urbanfit">Urban Fit</option>
            <option value="alpha">Academia Alpha</option>
            <option value="origem">Origem</option>
            <option value="essenza">Essenza</option>
            <option value="bella">Studio Bella</option>
            <option value="odonto">Odonto Prime</option>
          </select>
          <select
            style={{
              background:'transparent',
              border:'1px solid var(--f-border)',
              borderRadius:'var(--f-r-sm)',
              color:'var(--f-muted)',
              fontSize:13,
              padding:'6px 10px',
              cursor:'pointer',
              outline:'none',
            }}
          >
            <option value="">Todos os formatos</option>
            <option value="reels">Reels</option>
            <option value="feed">Feed</option>
            <option value="stories">Stories</option>
            <option value="carrossel">Carrossel</option>
            <option value="blog">Blog</option>
            <option value="landing">Landing</option>
          </select>
        </div>

        {/* Two-column layout */}
        <div className="f-detail-grid" style={{ gap:16 }}>
          {/* Calendar card */}
          <div className="f-card">
            <div className="f-card-header">
              <div>
                <div className="f-card-title">Maio 2026</div>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                <button className="f-btn-ghost f-btn-icon" style={{ width:30, height:30 }}>
                  <Icon name="arrow" size={14}/>
                </button>
                <button className="f-btn-ghost f-btn-icon" style={{ width:30, height:30, transform:'scaleX(-1)' }}>
                  <Icon name="arrow" size={14}/>
                </button>
              </div>
            </div>

            {/* Week header */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, padding:'0 16px 8px' }}>
              {WEEK_LABELS.map((w) => (
                <div key={w} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'var(--f-muted-dim)', padding:'4px 0' }}>
                  {w}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="f-cal-grid" style={{ padding:'0 16px 16px' }}>
              {CELLS.map((day, idx) => (
                <div
                  key={idx}
                  className={`f-cal-day${!day ? ' is-empty' : ''}${day === TODAY ? ' is-today' : ''}`}
                  style={{ minHeight:52, flexDirection:'column', padding:'4px 2px', cursor: day ? 'pointer' : 'default' }}
                >
                  {day && (
                    <>
                      <span className="f-cal-num">{day}</span>
                      <div style={{ display:'flex', gap:2, flexWrap:'wrap', justifyContent:'center' }}>
                        {(EVENTS[day] || []).slice(0,2).map((e, i) => (
                          <span key={i} className="f-cal-dot" style={{ background: e.color }}/>
                        ))}
                        {(EVENTS[day] || []).length > 2 && (
                          <span style={{ fontSize:9, color:'var(--f-muted)' }}>+{EVENTS[day].length - 2}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="f-cal-legend" style={{ padding:'0 16px 16px' }}>
              {LEGEND.map((l) => (
                <div key={l.label} className="f-cal-legend-item">
                  <span className="f-cal-dot" style={{ background: l.color }}/>
                  <span>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Publications card */}
          <div className="f-card" style={{ overflow:'hidden' }}>
            <div className="f-card-header">
              <div>
                <div className="f-card-title">Próximas Publicações</div>
              </div>
              <button className="f-btn-ghost" style={{ fontSize:12, padding:'4px 10px' }}>
                Ver todas
              </button>
            </div>
            <div style={{ paddingBottom:4 }}>
              {UPCOMING.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding:'12px 18px',
                    borderBottom: idx < UPCOMING.length - 1 ? '1px solid var(--f-border)' : 'none',
                    display:'flex',
                    alignItems:'center',
                    gap:12,
                  }}
                >
                  <div style={{ width:36, height:36, borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid var(--f-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'var(--f-muted)' }}>
                    <Icon name="file" size={15}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--f-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</div>
                    <div style={{ fontSize:11, color:'var(--f-muted)', marginTop:2 }}>{item.client} · {item.format}</div>
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
      </main>
    </>
  )
}
