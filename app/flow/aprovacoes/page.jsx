'use client'

import { useState } from 'react'
import FlowHeader from '@/components/flow/FlowHeader'
import MetricCard from '@/components/flow/MetricCard'
import StatusBadge from '@/components/flow/StatusBadge'
import Icon from '@/components/flow/FlowIcons'

const APPROVALS = [
  { id:1, title:'Reels — Antes e Depois',       client:'Academia Alpha',     format:'Reels',     sentBy:'Ana Lima',   deadline:'28 Mai', status:'Aguardando revisão',  priority:'Alta'  },
  { id:2, title:'Post Feed — Cardápio Novo',     client:'Restaurante Origem', format:'Feed',      sentBy:'Carlos M.',  deadline:'27 Mai', status:'Aguardando revisão',  priority:'Alta'  },
  { id:3, title:'Carrossel — Tratamentos',       client:'Clínica Essenza',    format:'Carrossel', sentBy:'Ana Lima',   deadline:'26 Mai', status:'Aguardando revisão',  priority:'Alta'  },
  { id:4, title:'Reels — Treino do Mês',         client:'Academia Alpha',     format:'Reels',     sentBy:'Pedro H.',   deadline:'29 Mai', status:'Ajustes solicitados', priority:'Média' },
  { id:5, title:'Carrossel — Resultados',        client:'Studio Bella Forma', format:'Carrossel', sentBy:'Juliana K.', deadline:'29 Mai', status:'Ajustes solicitados', priority:'Média' },
  { id:6, title:'Stories — Depoimento',          client:'Clínica Essenza',    format:'Stories',   sentBy:'Juliana K.', deadline:'25 Mai', status:'Liberado p/ cliente', priority:'Baixa' },
  { id:7, title:'Post Feed — Semana 3',          client:'Restaurante Origem', format:'Feed',      sentBy:'Carlos M.',  deadline:'22 Mai', status:'Liberado p/ cliente', priority:'Baixa' },
  { id:8, title:'Landing — Campanha Inverno',    client:'Urban Fit Store',    format:'Landing',   sentBy:'Pedro H.',   deadline:'05 Jun', status:'Aguardando revisão',  priority:'Alta'  },
]

const TABS = ['Todos', 'Aguardando revisão', 'Ajustes solicitados', 'Liberado p/ cliente']

export default function AprovacoesPage() {
  const [activeTab, setActiveTab] = useState('Todos')

  const filtered = activeTab === 'Todos'
    ? APPROVALS
    : APPROVALS.filter(a => a.status === activeTab)

  const isUrgentDeadline = (deadline) =>
    deadline === '26 Mai' || deadline === '27 Mai'

  const borderColor = (priority) => {
    if (priority === 'Alta')  return '3px solid var(--f-red)'
    if (priority === 'Média') return '3px solid var(--f-orange)'
    return '3px solid var(--f-border)'
  }

  return (
    <>
      <FlowHeader
        title="Aprovações"
        subtitle="Revise conteúdos internamente antes de liberar para o cliente."
      />

      <main className="f-content">
        {/* Metric cards */}
        <div className="f-metrics-grid">
          <MetricCard
            icon="clock"
            value="5"
            label="Pendentes"
            accentColor="#F59E0B"
          />
          <MetricCard
            icon="alert"
            value="3"
            label="Urgentes"
            accentColor="#EF4444"
          />
          <MetricCard
            icon="thumbsup"
            value="2"
            label="Aprovados hoje"
            accentColor="#22C55E"
          />
          <MetricCard
            icon="xmark"
            value="1"
            label="Reprovados"
            accentColor="#8B5CF6"
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding:'6px 14px',
                borderRadius:99,
                border: activeTab === tab ? '1px solid var(--f-yellow)' : '1px solid var(--f-border)',
                background: activeTab === tab ? 'rgba(255,210,46,0.12)' : 'transparent',
                color: activeTab === tab ? 'var(--f-yellow)' : 'var(--f-muted)',
                fontSize:13,
                fontWeight: activeTab === tab ? 600 : 400,
                cursor:'pointer',
                transition:'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Count */}
        <p style={{ fontSize:12, color:'var(--f-muted)', marginBottom:4 }}>
          {filtered.length} itens
        </p>

        {/* Approval cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map(item => (
            <div
              key={item.id}
              style={{
                background:'var(--f-card)',
                border:'1px solid var(--f-border)',
                borderRadius:14,
                overflow:'hidden',
                borderLeft: borderColor(item.priority),
                transition:'background 0.18s',
              }}
            >
              {/* Top row */}
              <div style={{ padding:'16px 18px 12px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:15, fontWeight:700, color:'var(--f-text)' }}>
                      {item.title}
                    </span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    <span className="f-client-chip">{item.client}</span>
                    <span className="f-format-chip">{item.format}</span>
                    <span style={{ fontSize:11, color:'var(--f-muted)', display:'flex', alignItems:'center', gap:4 }}>
                      <Icon name="user" size={11}/> {item.sentBy}
                    </span>
                    <span style={{
                      fontSize:11,
                      color: isUrgentDeadline(item.deadline) ? 'var(--f-red)' : 'var(--f-muted)',
                      display:'flex', alignItems:'center', gap:4,
                    }}>
                      <Icon name="clock" size={11}/> {item.deadline}
                    </span>
                  </div>
                </div>
                <StatusBadge status={item.status}/>
              </div>

              {/* Action row */}
              <div style={{ borderTop:'1px solid var(--f-border)', padding:'10px 14px', display:'flex', gap:8, justifyContent:'flex-end' }}>
                {item.status !== 'Liberado p/ cliente' && (
                  <>
                    <button
                      className="f-btn-ghost"
                      style={{ fontSize:12, padding:'5px 12px', color:'var(--f-red)', gap:5, display:'flex', alignItems:'center' }}
                    >
                      <Icon name="xmark" size={13}/> Solicitar ajuste
                    </button>
                    <button style={{
                      display:'flex', alignItems:'center', gap:5,
                      padding:'5px 14px',
                      background:'rgba(34,197,94,0.12)',
                      border:'1px solid rgba(34,197,94,0.25)',
                      borderRadius:'var(--f-r-sm)',
                      color:'var(--f-green)',
                      fontSize:12,
                      fontWeight:600,
                      cursor:'pointer',
                      transition:'background 0.15s',
                    }}>
                      <Icon name="thumbsup" size={13}/> Aprovar
                    </button>
                  </>
                )}
                {item.status === 'Liberado p/ cliente' && (
                  <span style={{ fontSize:12, color:'var(--f-green)', display:'flex', alignItems:'center', gap:5 }}>
                    <Icon name="check" size={13}/> Aprovado e liberado
                  </span>
                )}
                <button
                  className="f-btn-ghost"
                  style={{ fontSize:12, padding:'5px 12px', gap:5, display:'flex', alignItems:'center' }}
                >
                  <Icon name="eye" size={13}/> Visualizar
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
