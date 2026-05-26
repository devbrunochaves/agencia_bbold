import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '../lib/supabase'

const SERVICO_LABEL = {
  social_media:  'Social Media',
  trafego_pago:  'Tráfego Pago',
  design:        'Design',
  site:          'Site / LP',
  gmn:           'Google Meu Neg.',
  gestao_marca:  'Gestão de Marca',
}

function fmtBRL(v) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats]         = useState({ clientes: 0, mrr: 0, contratos: 0, entregas_pendentes: 0 })
  const [chartData, setChartData] = useState([])
  const [recentes, setRecentes]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [
      { data: clientes },
      { data: contratos },
      { data: entregas },
    ] = await Promise.all([
      supabase.from('crm_clientes').select('id, status'),
      supabase.from('crm_contratos').select('id, servico, valor_mensal, status, cliente_id'),
      supabase.from('crm_entregas').select('id, status, titulo, prazo, cliente_id, crm_clientes(nome)'),
    ])

    const ativos     = (clientes || []).filter(c => c.status === 'ativo').length
    const ctAtivos   = (contratos || []).filter(c => c.status === 'ativo')
    const mrr        = ctAtivos.reduce((s, c) => s + (parseFloat(c.valor_mensal) || 0), 0)
    const pendentes  = (entregas || []).filter(e => e.status !== 'concluido').length

    // MRR por serviço para o gráfico
    const byService = {}
    ctAtivos.forEach(c => {
      const k = SERVICO_LABEL[c.servico] || c.servico
      byService[k] = (byService[k] || 0) + (parseFloat(c.valor_mensal) || 0)
    })
    const chart = Object.entries(byService).map(([name, valor]) => ({ name, valor }))

    // Entregas próximas do prazo (não concluídas, com prazo)
    const hoje = new Date().toISOString().slice(0, 10)
    const proximas = (entregas || [])
      .filter(e => e.status !== 'concluido' && e.prazo)
      .sort((a, b) => a.prazo > b.prazo ? 1 : -1)
      .slice(0, 5)

    setStats({ clientes: ativos, mrr, contratos: ctAtivos.length, entregas_pendentes: pendentes })
    setChartData(chart)
    setRecentes(proximas)
    setLoading(false)
  }

  if (loading) return (
    <div className="crm-loading-screen">
      <div className="crm-loading-spinner" />
      <p>Carregando...</p>
    </div>
  )

  const statCards = [
    { label: 'Clientes Ativos',      value: stats.clientes,          icon: '👥', sub: 'em carteira' },
    { label: 'MRR',                  value: fmtBRL(stats.mrr),       icon: '💰', sub: 'receita mensal recorrente' },
    { label: 'Contratos Ativos',     value: stats.contratos,         icon: '📋', sub: 'serviços em andamento' },
    { label: 'Entregas Pendentes',   value: stats.entregas_pendentes, icon: '🗂️', sub: 'aguardando conclusão' },
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>{label}</p>
        <p style={{ color: '#f59e0b', fontWeight: 700 }}>{fmtBRL(payload[0].value)}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="crm-page-header">
        <div className="crm-page-header-left">
          <h2>Dashboard</h2>
          <p>Visão geral da agência — {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="crm-grid-4" style={{ marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} className="crm-card">
            <div className="crm-stat">
              <div className="crm-stat-icon">{s.icon}</div>
              <div className="crm-stat-label">{s.label}</div>
              <div className="crm-stat-value">{s.value}</div>
              <div className="crm-stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="crm-grid-2" style={{ marginBottom: 24 }}>
        {/* Gráfico MRR por serviço */}
        <div className="crm-card">
          <div className="crm-section-title" style={{ marginBottom: 20 }}>MRR por Serviço</div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="valor" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="crm-empty">
              <div className="crm-empty-icon">📊</div>
              <p>Nenhum contrato ativo ainda</p>
            </div>
          )}
        </div>

        {/* Entregas com prazo próximo */}
        <div className="crm-card">
          <div className="crm-section-title" style={{ marginBottom: 16 }}>Próximas Entregas</div>
          {recentes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentes.map(e => {
                const diasRestantes = e.prazo
                  ? Math.ceil((new Date(e.prazo) - new Date()) / 86400000)
                  : null
                const cor = diasRestantes !== null
                  ? diasRestantes < 0 ? 'danger' : diasRestantes <= 3 ? 'warning' : 'success'
                  : 'muted'
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--crm-text)' }}>{e.titulo}</div>
                      <div style={{ fontSize: 11, color: 'var(--crm-text-faint)' }}>{e.crm_clientes?.nome}</div>
                    </div>
                    {diasRestantes !== null && (
                      <span className={`crm-badge crm-badge-${cor}`} style={{ whiteSpace: 'nowrap' }}>
                        {diasRestantes < 0
                          ? `${Math.abs(diasRestantes)}d atrasado`
                          : diasRestantes === 0
                          ? 'hoje'
                          : `${diasRestantes}d`}
                      </span>
                    )}
                  </div>
                )
              })}
              <button
                className="crm-btn crm-btn-ghost crm-btn-sm"
                style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/crm/entregas')}
              >
                Ver todas →
              </button>
            </div>
          ) : (
            <div className="crm-empty">
              <div className="crm-empty-icon">✅</div>
              <p>Nenhuma entrega pendente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
