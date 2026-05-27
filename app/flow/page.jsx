'use client'

import FlowHeader from '@/components/flow/FlowHeader'
import MetricCard from '@/components/flow/MetricCard'
import StatusBadge from '@/components/flow/StatusBadge'
import Icon from '@/components/flow/FlowIcons'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CONTENTS = [
  { id: 1, title: 'Reels — Antes e Depois',    client: 'Academia Alpha',    format: 'Reels',    deadline: '28 Mai', responsible: 'Ana Lima',   status: 'Produção' },
  { id: 2, title: 'Post Feed — Cardápio Novo', client: 'Restaurante Origem',format: 'Feed',     deadline: '27 Mai', responsible: 'Carlos M.',  status: 'Aguardando Aprovação' },
  { id: 3, title: 'Stories — Promoção Junho',  client: 'Loja Urban Fit',    format: 'Stories',  deadline: '30 Mai', responsible: 'Juliana K.', status: 'Briefing' },
  { id: 4, title: 'Carrossel — Tratamentos',   client: 'Clínica Essenza',   format: 'Carrossel',deadline: '26 Mai', responsible: 'Ana Lima',   status: 'Atrasado' },
  { id: 5, title: 'Reels — Treino do Mês',     client: 'Academia Alpha',    format: 'Reels',    deadline: '29 Mai', responsible: 'Pedro H.',   status: 'Revisão' },
  { id: 6, title: 'Post Feed — Lançamento SS', client: 'Loja Urban Fit',    format: 'Feed',     deadline: '01 Jun', responsible: 'Carlos M.',  status: 'Agendado' },
  { id: 7, title: 'Stories — Depoimento',      client: 'Clínica Essenza',   format: 'Stories',  deadline: '25 Mai', responsible: 'Juliana K.', status: 'Publicado' },
  { id: 8, title: 'Carrossel — Dicas Nutrição',client: 'Academia Alpha',    format: 'Carrossel',deadline: '31 Mai', responsible: 'Pedro H.',   status: 'Produção' },
]

const MOCK_CLIENTS = [
  { id: 1, name: 'Academia Alpha',    niche: 'Fitness & Academia',  contents: 12, status: 'Ativo',   initials: 'AA' },
  { id: 2, name: 'Clínica Essenza',   niche: 'Saúde & Estética',    contents: 8,  status: 'Ativo',   initials: 'CE' },
  { id: 3, name: 'Restaurante Origem',niche: 'Gastronomia',         contents: 6,  status: 'Atenção', initials: 'RO' },
  { id: 4, name: 'Loja Urban Fit',    niche: 'Moda & Lifestyle',    contents: 10, status: 'Ativo',   initials: 'UF' },
]

const KANBAN_COLUMNS = [
  { id: 'briefing',  label: 'Briefing',  color: '#8B5CF6', cards: [{ title: 'Stories — Promoção Junho', client: 'Urban Fit' }, { title: 'Reels — Bastidores', client: 'Academia Alpha' }, { title: 'Post — Novidade', client: 'Clínica Essenza' }] },
  { id: 'producao',  label: 'Produção',  color: '#3B82F6', cards: [{ title: 'Reels — Antes e Depois', client: 'Academia Alpha' }, { title: 'Carrossel — Dicas', client: 'Academia Alpha' }, { title: 'Feed — Cardápio', client: 'Origem' }, { title: 'Stories — Promo', client: 'Urban Fit' }] },
  { id: 'aprovacao', label: 'Aprovação', color: '#F59E0B', cards: [{ title: 'Post Feed — Cardápio Novo', client: 'Origem' }, { title: 'Reels — Treino', client: 'Academia Alpha' }, { title: 'Carrossel — Tratamentos', client: 'Essenza' }] },
  { id: 'agendado',  label: 'Agendado',  color: '#22C55E', cards: [{ title: 'Post Feed — Lançamento', client: 'Urban Fit' }, { title: 'Stories — Semana 4', client: 'Academia Alpha' }, { title: 'Reels — Especial', client: 'Essenza' }] },
  { id: 'publicado', label: 'Publicado', color: '#A1A1AA', cards: [{ title: 'Stories — Depoimento', client: 'Essenza' }, { title: 'Feed — Semana 3', client: 'Origem' }, { title: 'Reels — Resultado', client: 'Urban Fit' }] },
]

const CALENDAR = {
  month: 'Maio 2026', today: 26, startDay: 5, days: 31,
  posts: { 1:'yellow',3:'green',5:'blue',7:'yellow',8:'green',10:'blue',12:'yellow',14:'green',15:'red',17:'blue',19:'yellow',21:'green',22:'blue',24:'yellow',26:'green',28:'blue',29:'yellow',31:'green' },
}

const DOT_COLORS = { yellow: '#FFD22E', green: '#22C55E', blue: '#3B82F6', red: '#EF4444' }
const CLIENT_STATUS_COLOR = { Ativo: '#22C55E', Atenção: '#F59E0B', Pausado: '#EF4444' }

// ─── Sub-components ───────────────────────────────────────────────────────────

function WorkflowTable() {
  return (
    <div className="f-card">
      <div className="f-card-header">
        <div>
          <h2 className="f-card-title">Workflow Ativo</h2>
          <p className="f-card-subtitle">Conteúdos em andamento · {MOCK_CONTENTS.length} itens</p>
        </div>
        <button className="f-btn-ghost">Ver todos <Icon name="arrow" size={14} /></button>
      </div>
      <div className="f-table-wrap">
        <table className="f-table">
          <thead><tr><th>Conteúdo</th><th>Cliente</th><th>Formato</th><th>Prazo</th><th>Responsável</th><th>Status</th></tr></thead>
          <tbody>
            {MOCK_CONTENTS.map(item => (
              <tr key={item.id} className="f-table-row">
                <td><span className="f-content-title">{item.title}</span></td>
                <td><span className="f-client-chip">{item.client}</span></td>
                <td><span className="f-format-chip">{item.format}</span></td>
                <td>
                  <span className={`f-deadline ${item.status === 'Atrasado' ? 'is-late' : ''}`}>
                    <Icon name="clock" size={12} />{item.deadline}
                  </span>
                </td>
                <td>
                  <div className="f-responsible">
                    <div className="f-avatar-sm">{item.responsible.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
                    <span>{item.responsible}</span>
                  </div>
                </td>
                <td><StatusBadge status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KanbanBoard() {
  return (
    <div className="f-card">
      <div className="f-card-header">
        <div><h2 className="f-card-title">Kanban de Produção</h2><p className="f-card-subtitle">Visão por etapa do fluxo</p></div>
      </div>
      <div className="f-kanban">
        {KANBAN_COLUMNS.map(col => (
          <div key={col.id} className="f-kanban-col">
            <div className="f-kanban-col-head">
              <span className="f-kanban-dot" style={{ background: col.color }} />
              <span className="f-kanban-label">{col.label}</span>
              <span className="f-kanban-count">{col.cards.length}</span>
            </div>
            <div className="f-kanban-cards">
              {col.cards.map((card, i) => (
                <div key={i} className="f-kanban-card">
                  <span className="f-kanban-card-accent" style={{ background: col.color }} />
                  <div className="f-kanban-card-body">
                    <span className="f-kanban-card-title">{card.title}</span>
                    <span className="f-kanban-card-client">{card.client}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EditorialCalendar() {
  const blanks = Array.from({ length: CALENDAR.startDay }, (_, i) => i)
  const days   = Array.from({ length: CALENDAR.days }, (_, i) => i + 1)
  const cells  = [...blanks.map(() => null), ...days]
  return (
    <div className="f-card f-calendar-card">
      <div className="f-card-header">
        <div><h2 className="f-card-title">Calendário Editorial</h2><p className="f-card-subtitle">{CALENDAR.month}</p></div>
      </div>
      <div className="f-cal-week-row">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => <span key={d} className="f-cal-week-label">{d}</span>)}
      </div>
      <div className="f-cal-grid">
        {cells.map((day, i) => (
          <div key={i} className={`f-cal-day ${!day ? 'is-empty' : ''} ${day === CALENDAR.today ? 'is-today' : ''}`}>
            {day && (<><span className="f-cal-num">{day}</span>{CALENDAR.posts[day] && <span className="f-cal-dot" style={{ background: DOT_COLORS[CALENDAR.posts[day]] }} />}</>)}
          </div>
        ))}
      </div>
      <div className="f-cal-legend">
        {[['yellow','Reels'],['green','Feed'],['blue','Stories'],['red','Atrasado']].map(([c,l]) => (
          <span key={c} className="f-cal-legend-item"><span className="f-cal-dot" style={{ background: DOT_COLORS[c] }} />{l}</span>
        ))}
      </div>
    </div>
  )
}

function ClientCards() {
  return (
    <div className="f-card f-clients-card">
      <div className="f-card-header">
        <div><h2 className="f-card-title">Clientes em Destaque</h2><p className="f-card-subtitle">Operação do mês</p></div>
        <button className="f-btn-ghost">Ver todos <Icon name="arrow" size={14} /></button>
      </div>
      <div className="f-clients-grid">
        {MOCK_CLIENTS.map(c => (
          <div key={c.id} className="f-client-card">
            <div className="f-client-card-top">
              <div className="f-client-avatar">{c.initials}</div>
              <span className="f-client-status-dot" style={{ background: CLIENT_STATUS_COLOR[c.status] }} />
            </div>
            <div className="f-client-name">{c.name}</div>
            <div className="f-client-niche">{c.niche}</div>
            <div className="f-client-footer">
              <div className="f-client-stat">
                <span className="f-client-stat-val">{c.contents}</span>
                <span className="f-client-stat-lbl">conteúdos</span>
              </div>
              <span className="f-client-badge" style={{ color: CLIENT_STATUS_COLOR[c.status], background: `${CLIENT_STATUS_COLOR[c.status]}18` }}>{c.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function FlowDashboard() {
  return (
    <>
      <FlowHeader
        title="Cockpit Interno"
        subtitle="Controle sua operação de conteúdo em um único fluxo."
        actions={
          <>
            <button className="f-btn-secondary"><Icon name="plus" size={14} /> Novo Conteúdo</button>
            <button className="f-btn-primary"><Icon name="plus" size={14} /> Novo Cliente</button>
          </>
        }
      />
      <main className="f-content">
        <div className="f-metrics-grid">
          <MetricCard icon="users"    value="12" label="Clientes Ativos"      desc="4 incorporados neste mês" accentColor="#FFD22E" trend={8}  />
          <MetricCard icon="file"     value="34" label="Em Produção"          desc="6 com prazo hoje"         accentColor="#3B82F6" trend={12} />
          <MetricCard icon="clock"    value="8"  label="Aprovações Pendentes" desc="3 com urgência"           accentColor="#F59E0B" trend={-5} />
          <MetricCard icon="trending" value="47" label="Publicações no Mês"   desc="Meta: 60 publicações"     accentColor="#22C55E" trend={15} />
        </div>
        <WorkflowTable />
        <KanbanBoard />
        <div className="f-bottom-row">
          <EditorialCalendar />
          <ClientCards />
        </div>
      </main>
    </>
  )
}
