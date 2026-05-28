'use client'

import { useState, useEffect } from 'react'
import FlowHeader from '@/components/flow/FlowHeader'
import Icon from '@/components/flow/FlowIcons'
import { supabase } from '@/lib/supabase'

const COLUMNS = [
  { id:'Briefing',             label:'Briefing',   color:'#8B5CF6' },
  { id:'Produção',             label:'Produção',   color:'#3B82F6' },
  { id:'Revisão',              label:'Revisão',    color:'#F59E0B' },
  { id:'Aguardando Aprovação', label:'Aprovação',  color:'#F97316' },
  { id:'Agendado',             label:'Agendado',   color:'#22C55E' },
  { id:'Publicado',            label:'Publicado',  color:'#A1A1AA' },
  { id:'Atrasado',             label:'Atrasado',   color:'#EF4444' },
]

const PRIORITY_COLORS = {
  'Alta':  '#EF4444',
  'Média': '#F59E0B',
  'Baixa': '#A1A1AA',
}

const MONTH_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtDate(iso) {
  if (!iso) return null
  const parts = iso.split('-')
  return `${parseInt(parts[2])} ${MONTH_PT[parseInt(parts[1]) - 1]}`
}

function initials(name) {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export default function WorkflowPage() {
  const [contents,    setContents]    = useState([])
  const [clients,     setClients]     = useState([])
  const [filterClient,setFilterClient]= useState('')
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: rows }, { data: clientRows }] = await Promise.all([
        supabase.from('contents').select('id,title,format,status,responsible,priority,pub_date,client').order('created_at', { ascending: false }),
        supabase.from('clients').select('name').order('name'),
      ])
      setContents(rows ?? [])
      setClients((clientRows ?? []).map(r => r.name))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filterClient
    ? contents.filter(c => c.client === filterClient)
    : contents

  const stats = [
    { label:'Total',      value: filtered.length,                                                     color:'#3B82F6' },
    { label:'Em Atraso',  value: filtered.filter(c => c.status === 'Atrasado').length,                color:'#EF4444' },
    { label:'Urgentes',   value: filtered.filter(c => c.priority === 'Alta').length,                  color:'#F59E0B' },
    { label:'Publicados', value: filtered.filter(c => c.status === 'Publicado').length,               color:'#22C55E' },
  ]

  const selectSt = {
    backgroundColor:'#1E1E1E',
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23FFD22E' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center',
    border:'1px solid var(--f-border)', borderRadius:'var(--f-r-sm)',
    color:'var(--f-text)', fontSize:13, padding:'6px 28px 6px 10px',
    cursor:'pointer', outline:'none', appearance:'none', WebkitAppearance:'none',
  }

  const actions = (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <select style={selectSt} value={filterClient} onChange={e => setFilterClient(e.target.value)}>
        <option value="">Todos os clientes</option>
        {clients.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
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
          {stats.map(s => (
            <div key={s.label} style={{ background:'var(--f-card)', border:'1px solid var(--f-border)', borderRadius:99, padding:'5px 14px', fontSize:12, color:'var(--f-muted)', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
              <span style={{ fontWeight:700, color:'var(--f-text)' }}>{s.value}</span>
              {s.label}
            </div>
          ))}
        </div>

        {/* Kanban board */}
        <div className="f-card" style={{ overflow:'hidden' }}>
          {loading ? (
            <div style={{ padding:'72px 24px', textAlign:'center', color:'var(--f-muted)' }}>
              <Icon name="refresh" size={20}/>
              <p style={{ marginTop:10 }}>Carregando...</p>
            </div>
          ) : (
            <div className="f-kanban" style={{ paddingTop:20, paddingBottom:20, minHeight:480 }}>
              {COLUMNS.map(col => {
                const cards = filtered.filter(c => c.status === col.id)
                return (
                  <div key={col.id} className="f-kanban-col" style={{ minWidth:200, width:200 }}>
                    <div className="f-kanban-col-head">
                      <span className="f-kanban-dot" style={{ background: col.color }}/>
                      <span className="f-kanban-label">{col.label}</span>
                      <span className="f-kanban-count">{cards.length}</span>
                    </div>
                    <div className="f-kanban-cards">
                      {cards.length === 0 && (
                        <div style={{ padding:'16px 10px', textAlign:'center', fontSize:11, color:'var(--f-muted-dim)', opacity:0.5 }}>
                          Vazio
                        </div>
                      )}
                      {cards.map(card => (
                        <div key={card.id} className="f-kanban-card" style={{ cursor:'pointer' }}>
                          <span className="f-kanban-card-accent" style={{ background: col.color }}/>
                          <div className="f-kanban-card-body">
                            <span className="f-kanban-card-title">{card.title}</span>
                            <span className="f-kanban-card-client">{card.client}</span>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                              {card.pub_date ? (
                                <span style={{ fontSize:10, color:'var(--f-muted)', display:'flex', alignItems:'center', gap:3 }}>
                                  <Icon name="clock" size={10}/>{fmtDate(card.pub_date)}
                                </span>
                              ) : (
                                <span/>
                              )}
                              {card.priority && (
                                <span style={{ fontSize:10, fontWeight:700, background:`${PRIORITY_COLORS[card.priority] ?? '#A1A1AA'}18`, color: PRIORITY_COLORS[card.priority] ?? '#A1A1AA', padding:'1px 6px', borderRadius:99 }}>
                                  {card.priority}
                                </span>
                              )}
                            </div>
                            {card.responsible && (
                              <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
                                <div style={{ width:18, height:18, borderRadius:5, background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'var(--f-muted)' }}>
                                  {initials(card.responsible)}
                                </div>
                                <span style={{ fontSize:11, color:'var(--f-muted)' }}>{card.format}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
