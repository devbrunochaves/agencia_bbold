'use client'

import { useState } from 'react'
import './flow.css'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CONTENTS = [
  { id: 1, title: 'Reels — Antes e Depois', client: 'Academia Alpha', format: 'Reels', deadline: '28 Mai', responsible: 'Ana Lima', status: 'Produção' },
  { id: 2, title: 'Post Feed — Cardápio Novo', client: 'Restaurante Origem', format: 'Feed', deadline: '27 Mai', responsible: 'Carlos M.', status: 'Aguardando Aprovação' },
  { id: 3, title: 'Stories — Promoção Junho', client: 'Loja Urban Fit', format: 'Stories', deadline: '30 Mai', responsible: 'Juliana K.', status: 'Briefing' },
  { id: 4, title: 'Carrossel — Tratamentos', client: 'Clínica Essenza', format: 'Carrossel', deadline: '26 Mai', responsible: 'Ana Lima', status: 'Atrasado' },
  { id: 5, title: 'Reels — Treino do Mês', client: 'Academia Alpha', format: 'Reels', deadline: '29 Mai', responsible: 'Pedro H.', status: 'Revisão' },
  { id: 6, title: 'Post Feed — Lançamento SS', client: 'Loja Urban Fit', format: 'Feed', deadline: '01 Jun', responsible: 'Carlos M.', status: 'Agendado' },
  { id: 7, title: 'Stories — Depoimento Cliente', client: 'Clínica Essenza', format: 'Stories', deadline: '25 Mai', responsible: 'Juliana K.', status: 'Publicado' },
  { id: 8, title: 'Carrossel — Dicas Nutrição', client: 'Academia Alpha', format: 'Carrossel', deadline: '31 Mai', responsible: 'Pedro H.', status: 'Produção' },
]

const MOCK_CLIENTS = [
  { id: 1, name: 'Academia Alpha', niche: 'Fitness & Academia', contents: 12, status: 'Ativo', initials: 'AA' },
  { id: 2, name: 'Clínica Essenza', niche: 'Saúde & Estética', contents: 8, status: 'Ativo', initials: 'CE' },
  { id: 3, name: 'Restaurante Origem', niche: 'Gastronomia', contents: 6, status: 'Atenção', initials: 'RO' },
  { id: 4, name: 'Loja Urban Fit', niche: 'Moda & Lifestyle', contents: 10, status: 'Ativo', initials: 'UF' },
]

const KANBAN_COLUMNS = [
  {
    id: 'briefing', label: 'Briefing', color: '#8B5CF6',
    cards: [
      { title: 'Stories — Promoção Junho', client: 'Urban Fit' },
      { title: 'Reels — Bastidores', client: 'Academia Alpha' },
      { title: 'Post — Novidade', client: 'Clínica Essenza' },
    ],
  },
  {
    id: 'producao', label: 'Produção', color: '#3B82F6',
    cards: [
      { title: 'Reels — Antes e Depois', client: 'Academia Alpha' },
      { title: 'Carrossel — Dicas', client: 'Academia Alpha' },
      { title: 'Feed — Cardápio', client: 'Origem' },
      { title: 'Stories — Promo', client: 'Urban Fit' },
    ],
  },
  {
    id: 'aprovacao', label: 'Aprovação', color: '#F59E0B',
    cards: [
      { title: 'Post Feed — Cardápio Novo', client: 'Origem' },
      { title: 'Reels — Treino', client: 'Academia Alpha' },
      { title: 'Carrossel — Tratamentos', client: 'Essenza' },
    ],
  },
  {
    id: 'agendado', label: 'Agendado', color: '#22C55E',
    cards: [
      { title: 'Post Feed — Lançamento', client: 'Urban Fit' },
      { title: 'Stories — Semana 4', client: 'Academia Alpha' },
      { title: 'Reels — Especial', client: 'Essenza' },
      { title: 'Feed — Semana 5', client: 'Origem' },
    ],
  },
  {
    id: 'publicado', label: 'Publicado', color: '#A1A1AA',
    cards: [
      { title: 'Stories — Depoimento', client: 'Essenza' },
      { title: 'Feed — Semana 3', client: 'Origem' },
      { title: 'Reels — Resultado', client: 'Urban Fit' },
    ],
  },
]

const STATUS_CONFIG = {
  'Briefing':             { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  'Produção':             { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  'Revisão':              { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  'Aguardando Aprovação': { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  'Agendado':             { color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  'Publicado':            { color: '#A1A1AA', bg: 'rgba(161,161,170,0.15)' },
  'Atrasado':             { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
}

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',     icon: 'grid',     group: 'principal' },
  { id: 'clientes',      label: 'Clientes',      icon: 'users',    group: 'principal' },
  { id: 'conteudos',     label: 'Conteúdos',     icon: 'file',     group: 'principal' },
  { id: 'workflow',      label: 'Workflow',      icon: 'workflow', group: 'principal' },
  { id: 'calendario',    label: 'Calendário',    icon: 'calendar', group: 'principal' },
  { id: 'aprovacoes',    label: 'Aprovações',    icon: 'check',    group: 'recursos',  badge: 8 },
  { id: 'biblioteca',    label: 'Biblioteca',    icon: 'folder',   group: 'recursos' },
  { id: 'performance',   label: 'Performance',   icon: 'chart',    group: 'recursos' },
  { id: 'configuracoes', label: 'Configurações', icon: 'settings', group: 'recursos' },
]

// Calendar - May 2026 (starts on Friday = index 5)
const CALENDAR = {
  month: 'Maio 2026',
  today: 26,
  startDay: 5,
  days: 31,
  posts: {
    1: 'yellow', 3: 'green', 5: 'blue', 7: 'yellow', 8: 'green',
    10: 'blue', 12: 'yellow', 14: 'green', 15: 'red', 17: 'blue',
    19: 'yellow', 21: 'green', 22: 'blue', 24: 'yellow', 26: 'green',
    28: 'blue', 29: 'yellow', 31: 'green',
  },
}

// ─── Icon System (inline SVG — no dependency needed) ─────────────────────────

function Icon({ name, size = 18 }) {
  const p = {
    width: size, height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  const map = {
    grid:     <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
    users:    <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    file:     <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    workflow: <svg {...p}><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="16" y="16" width="5" height="5" rx="1"/><path d="M5.5 8v3a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8"/><path d="M18.5 13v3"/></svg>,
    calendar: <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    check:    <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    folder:   <svg {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    chart:    <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    settings: <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    search:   <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    plus:     <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    bell:     <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    users2:   <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    trending: <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    clock:    <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    lightning:<svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    arrow:    <svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  }
  return map[name] ?? null
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { color: '#A1A1AA', bg: 'rgba(161,161,170,0.15)' }
  return (
    <span className="f-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {status}
    </span>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ active, onNav }) {
  const principal = NAV_ITEMS.filter(i => i.group === 'principal')
  const recursos  = NAV_ITEMS.filter(i => i.group === 'recursos')

  return (
    <aside className="f-sidebar">
      {/* Logo */}
      <div className="f-sidebar-logo">
        <div className="f-logo-mark">
          <span>B</span>
          <div className="f-logo-dot" />
        </div>
        <div className="f-logo-text">
          <span className="f-logo-name">BBOLD</span>
          <span className="f-logo-sub">Flow</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="f-sidebar-nav">
        <p className="f-nav-label">Principal</p>
        {principal.map(item => (
          <button
            key={item.id}
            className={`f-nav-item ${active === item.id ? 'is-active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span className="f-nav-icon"><Icon name={item.icon} size={16} /></span>
            <span className="f-nav-text">{item.label}</span>
            {item.badge && <span className="f-nav-badge">{item.badge}</span>}
          </button>
        ))}

        <p className="f-nav-label" style={{ marginTop: 20 }}>Recursos</p>
        {recursos.map(item => (
          <button
            key={item.id}
            className={`f-nav-item ${active === item.id ? 'is-active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span className="f-nav-icon"><Icon name={item.icon} size={16} /></span>
            <span className="f-nav-text">{item.label}</span>
            {item.badge && <span className="f-nav-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="f-sidebar-footer">
        <div className="f-user-row">
          <div className="f-user-avatar">AD</div>
          <div className="f-user-info">
            <span className="f-user-name">Admin BBOLD</span>
            <span className="f-user-role">Gestor de Conteúdo</span>
          </div>
          <span className="f-user-status" />
        </div>
      </div>
    </aside>
  )
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({ icon, value, label, desc, accentColor, trend }) {
  const positive = trend >= 0
  return (
    <div className="f-metric-card">
      <div className="f-metric-top">
        <div className="f-metric-icon" style={{ color: accentColor, background: `${accentColor}18` }}>
          <Icon name={icon} size={20} />
        </div>
        <span className={`f-metric-trend ${positive ? 'is-up' : 'is-down'}`}>
          {positive ? '+' : ''}{trend}%
        </span>
      </div>
      <div className="f-metric-value">{value}</div>
      <div className="f-metric-label">{label}</div>
      <div className="f-metric-desc">{desc}</div>
      <div className="f-metric-bar">
        <div className="f-metric-bar-fill" style={{ width: `${Math.min(Math.abs(trend) * 4, 100)}%`, background: accentColor }} />
      </div>
    </div>
  )
}

// ─── Workflow Table ───────────────────────────────────────────────────────────

function WorkflowTable() {
  return (
    <div className="f-card">
      <div className="f-card-header">
        <div>
          <h2 className="f-card-title">Workflow Ativo</h2>
          <p className="f-card-subtitle">Conteúdos em andamento · {MOCK_CONTENTS.length} itens</p>
        </div>
        <button className="f-btn-ghost">
          Ver todos <Icon name="arrow" size={14} />
        </button>
      </div>
      <div className="f-table-wrap">
        <table className="f-table">
          <thead>
            <tr>
              <th>Conteúdo</th>
              <th>Cliente</th>
              <th>Formato</th>
              <th>Prazo</th>
              <th>Responsável</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CONTENTS.map(item => (
              <tr key={item.id} className="f-table-row">
                <td>
                  <span className="f-content-title">{item.title}</span>
                </td>
                <td>
                  <span className="f-client-chip">{item.client}</span>
                </td>
                <td>
                  <span className="f-format-chip">{item.format}</span>
                </td>
                <td>
                  <span className={`f-deadline ${item.status === 'Atrasado' ? 'is-late' : ''}`}>
                    <Icon name="clock" size={12} />
                    {item.deadline}
                  </span>
                </td>
                <td>
                  <div className="f-responsible">
                    <div className="f-avatar-sm">
                      {item.responsible.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span>{item.responsible}</span>
                  </div>
                </td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

function KanbanBoard() {
  return (
    <div className="f-card">
      <div className="f-card-header">
        <div>
          <h2 className="f-card-title">Kanban de Produção</h2>
          <p className="f-card-subtitle">Visão por etapa do fluxo</p>
        </div>
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

// ─── Editorial Calendar ───────────────────────────────────────────────────────

const DOT_COLORS = { yellow: '#FFD22E', green: '#22C55E', blue: '#3B82F6', red: '#EF4444' }

function EditorialCalendar() {
  const blanks = Array.from({ length: CALENDAR.startDay }, (_, i) => i)
  const days   = Array.from({ length: CALENDAR.days }, (_, i) => i + 1)
  const cells  = [...blanks.map(() => null), ...days]

  return (
    <div className="f-card f-calendar-card">
      <div className="f-card-header">
        <div>
          <h2 className="f-card-title">Calendário Editorial</h2>
          <p className="f-card-subtitle">{CALENDAR.month}</p>
        </div>
      </div>
      <div className="f-cal-week-row">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
          <span key={d} className="f-cal-week-label">{d}</span>
        ))}
      </div>
      <div className="f-cal-grid">
        {cells.map((day, i) => (
          <div
            key={i}
            className={[
              'f-cal-day',
              !day          ? 'is-empty'   : '',
              day === CALENDAR.today ? 'is-today' : '',
            ].join(' ')}
          >
            {day && (
              <>
                <span className="f-cal-num">{day}</span>
                {CALENDAR.posts[day] && (
                  <span
                    className="f-cal-dot"
                    style={{ background: DOT_COLORS[CALENDAR.posts[day]] }}
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="f-cal-legend">
        {[['yellow','Reels'], ['green','Feed'], ['blue','Stories'], ['red','Atrasado']].map(([c, l]) => (
          <span key={c} className="f-cal-legend-item">
            <span className="f-cal-dot" style={{ background: DOT_COLORS[c] }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Client Cards ─────────────────────────────────────────────────────────────

const CLIENT_STATUS_COLOR = { Ativo: '#22C55E', Atenção: '#F59E0B', Pausado: '#EF4444' }

function ClientCards() {
  return (
    <div className="f-card f-clients-card">
      <div className="f-card-header">
        <div>
          <h2 className="f-card-title">Clientes em Destaque</h2>
          <p className="f-card-subtitle">Operação do mês</p>
        </div>
        <button className="f-btn-ghost">
          Ver todos <Icon name="arrow" size={14} />
        </button>
      </div>
      <div className="f-clients-grid">
        {MOCK_CLIENTS.map(c => (
          <div key={c.id} className="f-client-card">
            <div className="f-client-card-top">
              <div className="f-client-avatar">{c.initials}</div>
              <span
                className="f-client-status-dot"
                style={{ background: CLIENT_STATUS_COLOR[c.status] }}
                title={c.status}
              />
            </div>
            <div className="f-client-name">{c.name}</div>
            <div className="f-client-niche">{c.niche}</div>
            <div className="f-client-footer">
              <div className="f-client-stat">
                <span className="f-client-stat-val">{c.contents}</span>
                <span className="f-client-stat-lbl">conteúdos</span>
              </div>
              <span className="f-client-badge" style={{ color: CLIENT_STATUS_COLOR[c.status], background: `${CLIENT_STATUS_COLOR[c.status]}18` }}>
                {c.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FlowPage() {
  const [activeNav, setActiveNav] = useState('dashboard')

  return (
    <div className="f-root">
      <Sidebar active={activeNav} onNav={setActiveNav} />

      <div className="f-main">
        {/* Header */}
        <header className="f-header">
          <div className="f-header-left">
            <h1 className="f-header-title">Cockpit Interno</h1>
            <p className="f-header-sub">Controle sua operação de conteúdo em um único fluxo.</p>
          </div>
          <div className="f-header-right">
            <div className="f-search">
              <Icon name="search" size={14} />
              <input type="text" placeholder="Buscar conteúdo, cliente…" />
            </div>
            <button className="f-btn-icon" aria-label="Notificações">
              <Icon name="bell" size={16} />
              <span className="f-btn-icon-dot" />
            </button>
            <button className="f-btn-secondary">
              <Icon name="plus" size={14} />
              Novo Conteúdo
            </button>
            <button className="f-btn-primary">
              <Icon name="plus" size={14} />
              Novo Cliente
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="f-content">
          {/* Metrics row */}
          <div className="f-metrics-grid">
            <MetricCard icon="users"    value="12" label="Clientes Ativos"        desc="4 incorporados neste mês"  accentColor="#FFD22E" trend={8}  />
            <MetricCard icon="file"     value="34" label="Em Produção"            desc="6 com prazo hoje"          accentColor="#3B82F6" trend={12} />
            <MetricCard icon="clock"    value="8"  label="Aprovações Pendentes"   desc="3 com urgência"            accentColor="#F59E0B" trend={-5} />
            <MetricCard icon="trending" value="47" label="Publicações no Mês"     desc="Meta: 60 publicações"      accentColor="#22C55E" trend={15} />
          </div>

          {/* Workflow table */}
          <WorkflowTable />

          {/* Kanban */}
          <KanbanBoard />

          {/* Bottom row */}
          <div className="f-bottom-row">
            <EditorialCalendar />
            <ClientCards />
          </div>
        </main>
      </div>
    </div>
  )
}
