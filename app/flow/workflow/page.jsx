'use client'

import FlowHeader from '@/components/flow/FlowHeader'
import StatusBadge from '@/components/flow/StatusBadge'
import Icon from '@/components/flow/FlowIcons'

const COLUMNS = [
  { id:'briefing',  label:'Briefing',  color:'#8B5CF6', cards:[
    { title:'Stories — Promoção Junho',   client:'Urban Fit',    format:'Stories',   deadline:'30 Mai', responsible:'JK', priority:'Média' },
    { title:'Reels — Bastidores',         client:'Academia Alpha',format:'Reels',    deadline:'31 Mai', responsible:'PH', priority:'Baixa' },
    { title:'Landing — Campanha Inverno', client:'Urban Fit',    format:'Landing',   deadline:'05 Jun', responsible:'PH', priority:'Alta'  },
  ]},
  { id:'producao',  label:'Produção',  color:'#3B82F6', cards:[
    { title:'Reels — Antes e Depois',     client:'Academia Alpha',format:'Reels',    deadline:'28 Mai', responsible:'AL', priority:'Alta'  },
    { title:'Carrossel — Dicas',          client:'Academia Alpha',format:'Carrossel',deadline:'31 Mai', responsible:'PH', priority:'Média' },
    { title:'Feed — Cardápio',            client:'Origem',       format:'Feed',      deadline:'27 Mai', responsible:'CM', priority:'Alta'  },
    { title:'Reels — Look do Dia',        client:'Urban Fit',    format:'Reels',     deadline:'28 Mai', responsible:'CM', priority:'Média' },
  ]},
  { id:'revisao',   label:'Revisão',   color:'#F59E0B', cards:[
    { title:'Reels — Treino do Mês',      client:'Academia Alpha',format:'Reels',    deadline:'29 Mai', responsible:'PH', priority:'Média' },
    { title:'Carrossel — Resultados',     client:'Studio Bella', format:'Carrossel', deadline:'29 Mai', responsible:'JK', priority:'Média' },
  ]},
  { id:'aprovacao', label:'Aprovação', color:'#F59E0B', cards:[
    { title:'Post Feed — Cardápio Novo',  client:'Origem',       format:'Feed',      deadline:'27 Mai', responsible:'CM', priority:'Alta'  },
    { title:'Carrossel — Tratamentos',    client:'Essenza',      format:'Carrossel', deadline:'26 Mai', responsible:'AL', priority:'Alta'  },
  ]},
  { id:'agendado',  label:'Agendado',  color:'#22C55E', cards:[
    { title:'Post Feed — Lançamento',     client:'Urban Fit',    format:'Feed',      deadline:'01 Jun', responsible:'CM', priority:'Baixa' },
    { title:'Stories — Semana 4',         client:'Academia Alpha',format:'Stories',  deadline:'01 Jun', responsible:'AL', priority:'Baixa' },
    { title:'Reels — Especial',           client:'Essenza',      format:'Reels',     deadline:'02 Jun', responsible:'JK', priority:'Média' },
    { title:'Blog — Saúde Bucal',         client:'Odonto Prime', format:'Blog',      deadline:'02 Jun', responsible:'AL', priority:'Baixa' },
  ]},
  { id:'publicado', label:'Publicado', color:'#A1A1AA', cards:[
    { title:'Stories — Depoimento',       client:'Essenza',      format:'Stories',   deadline:'25 Mai', responsible:'JK', priority:'Baixa' },
    { title:'Feed — Semana 3',            client:'Origem',       format:'Feed',      deadline:'22 Mai', responsible:'CM', priority:'Baixa' },
    { title:'Reels — Resultado',          client:'Urban Fit',    format:'Reels',     deadline:'20 Mai', responsible:'PH', priority:'Baixa' },
  ]},
]

const PRIORITY_COLORS = {
  'Alta':  '#EF4444',
  'Média': '#F59E0B',
  'Baixa': '#A1A1AA',
}

const totalCards = COLUMNS.reduce((sum, col) => sum + col.cards.length, 0)

const STATS = [
  { label:'Total', value: totalCards, color:'#3B82F6' },
  { label:'Em Atraso', value: 2,  color:'#EF4444' },
  { label:'Urgentes',  value: 3,  color:'#F59E0B' },
  { label:'Finalizados', value: 3, color:'#22C55E' },
]

export default function WorkflowPage() {
  const actions = (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <select
        style={{
          backgroundColor:'#1E1E1E',
          backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23FFD22E' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center',
          border:'1px solid rgba(255,210,46,0.25)',
          borderRadius:'var(--f-r-sm)',
          color:'var(--f-text)',
          fontSize:13,
          padding:'6px 28px 6px 10px',
          cursor:'pointer',
          outline:'none',
          appearance:'none',
          WebkitAppearance:'none',
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
      <button className="f-btn-primary" style={{ display:'flex', alignItems:'center', gap:6 }}>
        <Icon name="plus" size={14}/>
        Novo Conteúdo
      </button>
    </div>
  )

  return (
    <>
      <FlowHeader
        title="Workflow"
        subtitle="Visualize e gerencie o fluxo de produção de todos os conteúdos."
        actions={actions}
      />
      <main className="f-content">
        {/* Stats chips */}
        <div style={{ display:'flex', gap:12, padding:'0 0 4px', flexWrap:'wrap' }}>
          {STATS.map((s) => (
            <div
              key={s.label}
              style={{
                background:'var(--f-card)',
                border:'1px solid var(--f-border)',
                borderRadius:99,
                padding:'5px 14px',
                fontSize:12,
                color:'var(--f-muted)',
                display:'flex',
                alignItems:'center',
                gap:6,
              }}
            >
              <span style={{ width:7, height:7, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
              <span style={{ fontWeight:700, color:'var(--f-text)' }}>{s.value}</span>
              {s.label}
            </div>
          ))}
        </div>

        {/* Kanban board */}
        <div className="f-card" style={{ overflow:'hidden' }}>
          <div className="f-kanban" style={{ paddingTop:20, paddingBottom:20, minHeight:480 }}>
            {COLUMNS.map((col) => (
              <div key={col.id} className="f-kanban-col" style={{ minWidth:200, width:200 }}>
                <div className="f-kanban-col-head">
                  <span className="f-kanban-dot" style={{ background: col.color }}/>
                  <span className="f-kanban-label">{col.label}</span>
                  <span className="f-kanban-count">{col.cards.length}</span>
                </div>
                <div className="f-kanban-cards">
                  {col.cards.map((card, idx) => (
                    <div key={idx} className="f-kanban-card" style={{ cursor:'pointer' }}>
                      <span className="f-kanban-card-accent" style={{ background: col.color }}/>
                      <div className="f-kanban-card-body">
                        <span className="f-kanban-card-title">{card.title}</span>
                        <span className="f-kanban-card-client">{card.client}</span>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                          <span style={{ fontSize:10, color:'var(--f-muted)', display:'flex', alignItems:'center', gap:3 }}>
                            <Icon name="clock" size={10}/>{card.deadline}
                          </span>
                          <span style={{ fontSize:10, fontWeight:700, background:`${PRIORITY_COLORS[card.priority]}18`, color:PRIORITY_COLORS[card.priority], padding:'1px 6px', borderRadius:99 }}>
                            {card.priority}
                          </span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
                          <div style={{ width:18, height:18, borderRadius:5, background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'var(--f-muted)' }}>
                            {card.responsible}
                          </div>
                          <span style={{ fontSize:11, color:'var(--f-muted)' }}>{card.format}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
