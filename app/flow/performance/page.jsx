'use client'

import FlowHeader from '@/components/flow/FlowHeader'
import MetricCard from '@/components/flow/MetricCard'
import Icon from '@/components/flow/FlowIcons'

const CLIENT_PERF = [
  { name: 'Academia Alpha',     reach: 48200, engagement: 7.4, posts: 12, color: '#FFD22E' },
  { name: 'Clínica Essenza',    reach: 31500, engagement: 5.8, posts: 8,  color: '#3B82F6' },
  { name: 'Restaurante Origem', reach: 22800, engagement: 4.2, posts: 6,  color: '#22C55E' },
  { name: 'Urban Fit Store',    reach: 39100, engagement: 6.1, posts: 10, color: '#8B5CF6' },
  { name: 'Studio Bella Forma', reach: 18400, engagement: 5.3, posts: 7,  color: '#F59E0B' },
  { name: 'Odonto Prime',       reach: 12600, engagement: 3.9, posts: 4,  color: '#EF4444' },
]

const TOP_CONTENTS = [
  { title: 'Reels — Antes e Depois',  client: 'Academia Alpha',     format: 'Reels',    reach: 12400, engagement: 9.8, icon: 'trending' },
  { title: 'Carrossel — Tratamentos', client: 'Clínica Essenza',    format: 'Carrossel',reach: 9800,  engagement: 8.1, icon: 'trending' },
  { title: 'Reels — Look do Dia',     client: 'Urban Fit Store',    format: 'Reels',    reach: 8900,  engagement: 7.6, icon: 'trending' },
  { title: 'Reels — Treino do Mês',   client: 'Academia Alpha',     format: 'Reels',    reach: 7300,  engagement: 7.2, icon: 'trending' },
  { title: 'Post Feed — Cardápio',    client: 'Restaurante Origem', format: 'Feed',     reach: 5600,  engagement: 6.5, icon: 'trending' },
]

const MONTHLY = [
  { month: 'Dez', publications: 28, reach: 98000  },
  { month: 'Jan', publications: 34, reach: 118000 },
  { month: 'Fev', publications: 31, reach: 105000 },
  { month: 'Mar', publications: 38, reach: 134000 },
  { month: 'Abr', publications: 42, reach: 152000 },
  { month: 'Mai', publications: 47, reach: 171200 },
]

const MAX_REACH = 48200
const MAX_ENGAGEMENT = 7.4
const MAX_PUBLICATIONS = 47

export default function PerformancePage() {
  const periodSelect = (
    <select
      defaultValue="maio2026"
      style={{
        background: 'transparent',
        border: '1px solid var(--f-border-s)',
        borderRadius: 'var(--f-r-sm)',
        color: 'var(--f-muted)',
        fontSize: 13,
        padding: '6px 10px',
        cursor: 'pointer',
        outline: 'none',
        fontFamily: 'inherit',
      }}
    >
      <option value="maio2026">Maio 2026</option>
      <option value="last3">Últimos 3 meses</option>
      <option value="last6">Últimos 6 meses</option>
    </select>
  )

  return (
    <>
      <FlowHeader
        title="Performance"
        subtitle="Acompanhe os principais indicadores da operação de conteúdo."
        actions={periodSelect}
      />

      <main className="f-content">
        {/* Metric cards */}
        <div className="f-metrics-grid">
          <MetricCard
            icon="trending"
            value="171.2K"
            label="Alcance Total"
            desc="vs. mês anterior"
            accentColor="#FFD22E"
            trend={12}
          />
          <MetricCard
            icon="chart"
            value="5.5%"
            label="Engajamento Médio"
            desc="média dos clientes"
            accentColor="#22C55E"
            trend={8}
          />
          <MetricCard
            icon="file"
            value="47"
            label="Publicações"
            desc="Meta: 60 publicações"
            accentColor="#3B82F6"
            trend={12}
          />
          <MetricCard
            icon="zap"
            value="9.8%"
            label="Melhor Conteúdo"
            desc="Reels Academia Alpha"
            accentColor="#8B5CF6"
            trend={35}
          />
        </div>

        {/* Two-column charts */}
        <div
          className="perf-two-col"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          {/* Alcance por Cliente */}
          <div className="f-card">
            <div className="f-card-header">
              <div>
                <h2 className="f-card-title">Alcance por Cliente</h2>
                <p className="f-card-subtitle">Maio 2026</p>
              </div>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {CLIENT_PERF.map(c => {
                const pct = Math.round((c.reach / MAX_REACH) * 100)
                return (
                  <div key={c.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--f-text)' }}>{c.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--f-muted)' }}>{(c.reach / 1000).toFixed(1)}K</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: c.color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Engajamento por Cliente */}
          <div className="f-card">
            <div className="f-card-header">
              <div>
                <h2 className="f-card-title">Engajamento por Cliente</h2>
                <p className="f-card-subtitle">Maio 2026</p>
              </div>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {CLIENT_PERF.map(c => {
                const pct = Math.round((c.engagement / MAX_ENGAGEMENT) * 100)
                return (
                  <div key={c.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--f-text)' }}>{c.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--f-muted-dim)', background: 'rgba(255,255,255,0.05)', borderRadius: 99, padding: '1px 6px' }}>
                          {c.posts} posts
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--f-muted)' }}>{c.engagement}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: c.color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Evolução Mensal — full width */}
        <div className="f-card">
          <div className="f-card-header">
            <div>
              <h2 className="f-card-title">Evolução Mensal</h2>
              <p className="f-card-subtitle">Publicações nos últimos 6 meses</p>
            </div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
              {MONTHLY.map(m => {
                const h = Math.round((m.publications / MAX_PUBLICATIONS) * 100)
                const isCurrent = m.month === 'Mai'
                return (
                  <div
                    key={m.month}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
                  >
                    <span style={{ fontSize: 11, color: isCurrent ? 'var(--f-yellow)' : 'var(--f-muted)' }}>
                      {m.publications}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: `${h}%`,
                        background: 'var(--f-yellow)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: 4,
                        opacity: isCurrent ? 1 : 0.5,
                      }}
                    />
                    <span style={{ fontSize: 11, color: isCurrent ? 'var(--f-yellow)' : 'var(--f-muted)' }}>
                      {m.month}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top Conteúdos — full width */}
        <div className="f-card">
          <div className="f-card-header">
            <div>
              <h2 className="f-card-title">Top Conteúdos do Mês</h2>
              <p className="f-card-subtitle">Por engajamento</p>
            </div>
          </div>
          <div>
            {TOP_CONTENTS.map((c, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 20px',
                  borderBottom: i < TOP_CONTENTS.length - 1 ? '1px solid var(--f-border)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: i === 0 ? 'var(--f-yellow)' : 'var(--f-muted-dim)',
                    width: 24,
                    textAlign: 'center',
                    flexShrink: 0,
                  }}
                >
                  #{i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--f-text)' }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--f-muted)', marginTop: 2 }}>
                    {c.client} · {c.format}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--f-green)' }}>{c.engagement}%</div>
                  <div style={{ fontSize: 11, color: 'var(--f-muted)' }}>{(c.reach / 1000).toFixed(1)}K alcance</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Responsive override */}
        <style>{`
          @media (max-width: 768px) {
            .perf-two-col {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </>
  )
}
