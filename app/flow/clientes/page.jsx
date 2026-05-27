'use client'

import { useState } from 'react'
import FlowHeader from '@/components/flow/FlowHeader'
import MetricCard from '@/components/flow/MetricCard'
import StatusBadge from '@/components/flow/StatusBadge'
import Icon from '@/components/flow/FlowIcons'

const CLIENTS = [
  { id:1, name:'Academia Alpha',     niche:'Fitness & Academia',  plan:'Premium',  responsible:'Ana Lima',   contents:12, status:'Ativo',         initials:'AA', color:'#FFD22E' },
  { id:2, name:'Clínica Essenza',    niche:'Saúde & Estética',    plan:'Business', responsible:'Carlos M.',  contents:8,  status:'Ativo',         initials:'CE', color:'#3B82F6' },
  { id:3, name:'Restaurante Origem', niche:'Gastronomia',         plan:'Starter',  responsible:'Juliana K.', contents:6,  status:'Atenção',       initials:'RO', color:'#F59E0B' },
  { id:4, name:'Urban Fit Store',    niche:'Moda & Lifestyle',    plan:'Premium',  responsible:'Pedro H.',   contents:10, status:'Ativo',         initials:'UF', color:'#22C55E' },
  { id:5, name:'Studio Bella Forma', niche:'Beleza & Estética',   plan:'Business', responsible:'Ana Lima',   contents:7,  status:'Em onboarding', initials:'SB', color:'#8B5CF6' },
  { id:6, name:'Odonto Prime',       niche:'Odontologia',         plan:'Starter',  responsible:'Carlos M.',  contents:4,  status:'Pausado',       initials:'OP', color:'#EF4444' },
]

function ClientCard({ c }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      key={c.id}
      style={{
        background: hovered ? 'var(--f-card-h)' : 'var(--f-card)',
        border: '1px solid var(--f-border)',
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'background 0.18s, transform 0.18s, box-shadow 0.18s',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.25)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 18px 14px', borderBottom:'1px solid var(--f-border)' }}>
        <div
          style={{
            width:44, height:44, borderRadius:12,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, fontWeight:800, flexShrink:0,
            background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}44`
          }}
        >
          {c.initials}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <span style={{ display:'block', fontWeight:700, fontSize:14, color:'var(--f-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</span>
          <span style={{ display:'block', fontSize:12, color:'var(--f-muted)', marginTop:2 }}>{c.niche}</span>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <div style={{ padding:'12px 18px', display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'var(--f-muted)' }}>Plano</span>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--f-text)', background:'rgba(255,255,255,0.07)', padding:'2px 8px', borderRadius:6, fontSize:11 }}>{c.plan}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'var(--f-muted)' }}>Responsável</span>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--f-text)' }}>{c.responsible}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'var(--f-muted)' }}>Conteúdos/mês</span>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--f-yellow)' }}>{c.contents}</span>
        </div>
      </div>

      <div style={{ borderTop:'1px solid var(--f-border)', padding:'10px 14px' }}>
        <button className="f-btn-ghost" style={{ width:'100%', justifyContent:'center', display:'flex', alignItems:'center', gap:6 }}>
          Ver operação <Icon name="arrow" size={13} />
        </button>
      </div>
    </div>
  )
}

export default function ClientesPage() {
  const [filter, setFilter] = useState('Todos')

  const filtered = CLIENTS.filter(c => {
    if (filter === 'Todos') return true
    if (filter === 'Ativos') return c.status === 'Ativo'
    if (filter === 'Pausados') return c.status === 'Pausado'
    if (filter === 'Em onboarding') return c.status === 'Em onboarding'
    return true
  })

  const actions = (
    <button className="f-btn-primary" style={{ display:'flex', alignItems:'center', gap:6 }}>
      <Icon name="plus" size={14} /> Novo Cliente
    </button>
  )

  return (
    <>
      <FlowHeader
        title="Clientes"
        subtitle="Gerencie contas, planos, responsáveis e operação de cada cliente."
        actions={actions}
      />

      <main className="f-content">
        <div className="f-metrics-grid">
          <MetricCard icon="users"    value="5"  label="Clientes Ativos"  desc="contas ativas"     accentColor="#FFD22E" trend={8}   />
          <MetricCard icon="user"     value="1"  label="Em Onboarding"    desc="novos clientes"    accentColor="#3B82F6" trend={100} />
          <MetricCard icon="alert"    value="1"  label="Pausados"         desc="contas pausadas"   accentColor="#EF4444" trend={-20} />
          <MetricCard icon="file"     value="47" label="Conteúdos/Mês"    desc="total do portfólio" accentColor="#22C55E" trend={12}  />
        </div>

        <div style={{ display:'flex', gap:8, padding:'0 22px 16px', flexWrap:'wrap' }}>
          {['Todos','Ativos','Pausados','Em onboarding'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding:'6px 14px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer', border:'1px solid',
                background: filter === f ? 'var(--f-yellow)' : 'transparent',
                color: filter === f ? '#000' : 'var(--f-muted)',
                borderColor: filter === f ? 'var(--f-yellow)' : 'var(--f-border)',
                transition:'all 0.15s'
              }}
            >{f}</button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16, padding:'0 22px 24px' }}>
          {filtered.map(c => (
            <ClientCard key={c.id} c={c} />
          ))}
        </div>
      </main>
    </>
  )
}
