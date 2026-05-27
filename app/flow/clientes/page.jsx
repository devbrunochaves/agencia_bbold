'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import FlowHeader from '@/components/flow/FlowHeader'
import MetricCard from '@/components/flow/MetricCard'
import StatusBadge from '@/components/flow/StatusBadge'
import Icon from '@/components/flow/FlowIcons'
import ClientModal from '@/components/flow/ClientModal'

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = 'bbold_flow_clients'

const CLIENT_COLORS = [
  '#FFD22E','#3B82F6','#22C55E','#8B5CF6',
  '#F59E0B','#EF4444','#06B6D4','#EC4899',
]

const FILTERS = ['Todos', 'Ativos', 'Pausados', 'Em onboarding']

const INITIAL_CLIENTS = [
  { id:'1', name:'Academia Alpha',     niche:'Fitness & Academia', plan:'Premium', responsible:'Ana Lima',   contents:12, status:'Ativo',         initials:'AA', color:'#FFD22E', instagram:'@academialpha',     whatsapp:'(11) 99999-0001', email:'contato@academialpha.com',  observations:'Cliente desde 2024. Foco em reels e carrosséis.' },
  { id:'2', name:'Clínica Essenza',    niche:'Saúde & Estética',   plan:'Growth',  responsible:'Carlos M.',  contents:8,  status:'Ativo',         initials:'CE', color:'#3B82F6', instagram:'@clinicaessenza',    whatsapp:'(11) 99999-0002', email:'contato@essenza.com',       observations:'Preferência por conteúdo educativo.' },
  { id:'3', name:'Restaurante Origem', niche:'Gastronomia',         plan:'Start',   responsible:'Juliana K.', contents:6,  status:'Atenção',       initials:'RO', color:'#F59E0B', instagram:'@restauranteorigem', whatsapp:'(11) 99999-0003', email:'contato@origem.com',        observations:'Dificuldade em enviar fotos a tempo.' },
  { id:'4', name:'Urban Fit Store',    niche:'Moda & Lifestyle',    plan:'Premium', responsible:'Pedro H.',   contents:10, status:'Ativo',         initials:'UF', color:'#22C55E', instagram:'@urbanfitstore',     whatsapp:'(11) 99999-0004', email:'contato@urbanfit.com',      observations:'' },
  { id:'5', name:'Studio Bella Forma', niche:'Beleza & Estética',   plan:'Growth',  responsible:'Ana Lima',   contents:7,  status:'Em onboarding', initials:'SB', color:'#8B5CF6', instagram:'@studiobella',       whatsapp:'(11) 99999-0005', email:'contato@bellaforma.com',    observations:'Novo cliente — onboarding em andamento.' },
  { id:'6', name:'Odonto Prime',       niche:'Odontologia',          plan:'Start',   responsible:'Carlos M.',  contents:4,  status:'Pausado',       initials:'OP', color:'#EF4444', instagram:'@odontoprime',       whatsapp:'(11) 99999-0006', email:'contato@odontoprime.com',   observations:'Pausado por férias do responsável.' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function matchesFilter(c, f) {
  if (f === 'Todos')         return true
  if (f === 'Ativos')        return c.status === 'Ativo' || c.status === 'Atenção'
  if (f === 'Pausados')      return c.status === 'Pausado'
  if (f === 'Em onboarding') return c.status === 'Em onboarding'
  return true
}

function matchesSearch(c, q) {
  if (!q) return true
  const s = q.toLowerCase()
  return (
    c.name.toLowerCase().includes(s) ||
    c.niche.toLowerCase().includes(s) ||
    c.responsible.toLowerCase().includes(s) ||
    c.plan.toLowerCase().includes(s)
  )
}

const SC = { Ativo:'#22C55E', Pausado:'#EF4444', 'Em onboarding':'#3B82F6', Atenção:'#F59E0B' }

// ─── Client Card ──────────────────────────────────────────────────────────────

function ClientCard({ client, onEdit, onToggle, onDelete }) {
  return (
    <div className="f-cfc">
      <div className="f-cfc-head">
        <div className="f-cfc-avatar" style={{ background:`${client.color}20`, color:client.color, border:`1px solid ${client.color}30` }}>
          {client.initials}
        </div>
        <div className="f-cfc-info">
          <span className="f-cfc-name">{client.name}</span>
          <span className="f-cfc-niche">{client.niche}</span>
        </div>
        <div className="f-cfc-actions">
          <button className="f-cfc-action-btn" title="Editar" onClick={() => onEdit(client)}>
            <Icon name="edit" size={13}/>
          </button>
          <button
            className="f-cfc-action-btn"
            title={client.status === 'Pausado' ? 'Ativar' : 'Pausar'}
            onClick={() => onToggle(client.id)}
          >
            <Icon name={client.status === 'Pausado' ? 'zap' : 'clock'} size={13}/>
          </button>
          <button className="f-cfc-action-btn danger" title="Excluir" onClick={() => onDelete(client)}>
            <Icon name="trash" size={13}/>
          </button>
        </div>
      </div>

      <div className="f-cfc-body">
        <div className="f-cfc-row">
          <span className="f-cfc-lbl">Plano</span>
          <span className="f-cfc-val f-plan-badge">{client.plan}</span>
        </div>
        <div className="f-cfc-row">
          <span className="f-cfc-lbl">Responsável</span>
          <span className="f-cfc-val">{client.responsible}</span>
        </div>
        <div className="f-cfc-row">
          <span className="f-cfc-lbl">Conteúdos/mês</span>
          <span className="f-cfc-val" style={{ color:'var(--f-yellow)', fontWeight:800, fontSize:16 }}>
            {client.contents}
          </span>
        </div>
        <div className="f-cfc-row">
          <span className="f-cfc-lbl">Status</span>
          <StatusBadge status={client.status}/>
        </div>
      </div>

      <div className="f-cfc-foot">
        <Link
          href={`/flow/clientes/${client.id}`}
          className="f-btn-ghost"
          style={{ width:'100%', justifyContent:'center', fontSize:13 }}
        >
          Ver operação <Icon name="arrow" size={13}/>
        </Link>
      </div>
    </div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteDialog({ client, onConfirm, onCancel }) {
  if (!client) return null
  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'overlayIn 0.18s ease' }}
      onClick={onCancel}
    >
      <div
        style={{ background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:18, padding:28, maxWidth:380, width:'100%', textAlign:'center', animation:'modalIn 0.2s ease' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width:52, height:52, borderRadius:14, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:'var(--f-red)' }}>
          <Icon name="trash" size={22}/>
        </div>
        <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:'0 0 8px' }}>Excluir cliente</h3>
        <p style={{ fontSize:13, color:'#A1A1AA', margin:'0 0 24px', lineHeight:1.6 }}>
          Tem certeza que deseja excluir{' '}
          <strong style={{ color:'#fff' }}>{client.name}</strong>?
          {' '}Esta ação não pode ser desfeita.
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button className="f-btn-secondary" onClick={onCancel}>Cancelar</button>
          <button
            onClick={onConfirm}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 18px', background:'rgba(239,68,68,0.14)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'var(--f-r-sm)', color:'var(--f-red)', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}
          >
            <Icon name="trash" size={14}/> Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null
  const color = toast.type === 'error' ? 'var(--f-red)' : 'var(--f-green)'
  return (
    <div className="f-toast">
      <span style={{ color }}><Icon name={toast.type === 'error' ? 'alert' : 'check'} size={16}/></span>
      {toast.message}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientesPage() {
  const [clients,      setClients]  = useState(INITIAL_CLIENTS)
  const [loaded,       setLoaded]   = useState(false)
  const [modalOpen,    setModal]    = useState(false)
  const [editing,      setEditing]  = useState(null)
  const [deleteTarget, setDelTarget]= useState(null)
  const [search,       setSearch]   = useState('')
  const [filter,       setFilter]   = useState('Todos')
  const [toast,        setToast]    = useState(null)
  const timer = useRef(null)

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setClients(parsed)
      }
    } catch {}
    setLoaded(true)
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(LS_KEY, JSON.stringify(clients))
  }, [clients, loaded])

  // Metrics
  const metrics = useMemo(() => ({
    ativos:     clients.filter(c => c.status === 'Ativo' || c.status === 'Atenção').length,
    onboarding: clients.filter(c => c.status === 'Em onboarding').length,
    pausados:   clients.filter(c => c.status === 'Pausado').length,
    contents:   clients.filter(c => c.status !== 'Pausado').reduce((s, c) => s + (c.contents || 0), 0),
  }), [clients])

  // Filtered list
  const filtered = useMemo(
    () => clients.filter(c => matchesFilter(c, filter) && matchesSearch(c, search)),
    [clients, filter, search]
  )

  function flash(message, type = 'success') {
    clearTimeout(timer.current)
    setToast({ message, type })
    timer.current = setTimeout(() => setToast(null), 3200)
  }

  function openCreate() { setEditing(null); setModal(true) }
  function openEdit(c)  { setEditing(c);    setModal(true) }

  function handleSave(data) {
    if (editing) {
      setClients(prev => prev.map(c =>
        c.id === editing.id ? { ...c, ...data, initials: getInitials(data.name) } : c
      ))
      flash('Cliente atualizado com sucesso!')
    } else {
      setClients(prev => [...prev, {
        ...data,
        id:       Date.now().toString(),
        initials: getInitials(data.name),
        color:    CLIENT_COLORS[prev.length % CLIENT_COLORS.length],
      }])
      flash('Novo cliente cadastrado!')
    }
    setModal(false)
    setEditing(null)
  }

  function handleToggle(id) {
    setClients(prev => prev.map(c => {
      if (c.id !== id) return c
      const next = c.status === 'Pausado' ? 'Ativo' : 'Pausado'
      flash(`${c.name} foi ${next === 'Pausado' ? 'pausado' : 'reativado'}.`)
      return { ...c, status: next }
    }))
  }

  function handleDelete() {
    if (!deleteTarget) return
    setClients(prev => prev.filter(c => c.id !== deleteTarget.id))
    flash(`${deleteTarget.name} removido.`)
    setDelTarget(null)
  }

  return (
    <>
      <FlowHeader
        title="Clientes"
        subtitle="Gerencie contas, planos, responsáveis e operação de cada cliente."
        actions={
          <button className="f-btn-primary" onClick={openCreate}>
            <Icon name="plus" size={14}/> Novo Cliente
          </button>
        }
      />

      <main className="f-content">
        {/* Metrics */}
        <div className="f-metrics-grid">
          <MetricCard icon="users"   value={String(metrics.ativos)}     label="Clientes Ativos"   desc="operação em andamento"    accentColor="#FFD22E" trend={8}   />
          <MetricCard icon="zap"     value={String(metrics.onboarding)} label="Em Onboarding"     desc="integrando à plataforma"  accentColor="#3B82F6" trend={100} />
          <MetricCard icon="clock"   value={String(metrics.pausados)}   label="Pausados"           desc="contratos suspensos"      accentColor="#EF4444" trend={-20} />
          <MetricCard icon="file"    value={String(metrics.contents)}   label="Conteúdos/Mês"     desc="soma dos clientes ativos" accentColor="#22C55E" trend={12}  />
        </div>

        {/* Search + Filters + Grid */}
        <div className="f-card" style={{ overflow:'visible' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--f-border)', display:'flex', flexWrap:'wrap', gap:10, alignItems:'center' }}>
            {/* Search */}
            <div className="f-search" style={{ flex:'1 1 180px', maxWidth:320, width:'auto' }}>
              <Icon name="search" size={14}/>
              <input
                type="text"
                placeholder="Buscar nome, nicho, responsável…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ display:'block' }}
              />
            </div>

            {/* Filter pills */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding:'5px 13px', borderRadius:99, fontSize:12, fontWeight:600,
                    cursor:'pointer', border:'1px solid', transition:'all 0.15s', fontFamily:'inherit',
                    background:  filter === f ? 'var(--f-yellow)' : 'transparent',
                    color:       filter === f ? '#000'            : 'var(--f-muted)',
                    borderColor: filter === f ? 'var(--f-yellow)' : 'var(--f-border)',
                  }}
                >{f}</button>
              ))}
            </div>

            <span style={{ fontSize:12, color:'var(--f-muted)', marginLeft:'auto', whiteSpace:'nowrap' }}>
              {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filtered.length > 0 ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16, padding:20 }}>
              {filtered.map(c => (
                <ClientCard
                  key={c.id}
                  client={c}
                  onEdit={openEdit}
                  onToggle={handleToggle}
                  onDelete={setDelTarget}
                />
              ))}
            </div>
          ) : (
            <div className="f-empty-state">
              <Icon name="users" size={40}/>
              <h3>
                {search
                  ? `Nenhum resultado para "${search}"`
                  : 'Nenhum cliente neste filtro'}
              </h3>
              <p>
                {search
                  ? 'Tente outro termo ou limpe a busca.'
                  : 'Altere o filtro ou cadastre um novo cliente.'}
              </p>
              {search && (
                <button className="f-btn-ghost" onClick={() => setSearch('')} style={{ marginTop:8 }}>
                  Limpar busca
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <ClientModal
        isOpen={modalOpen}
        onClose={() => { setModal(false); setEditing(null) }}
        onSave={handleSave}
        editingClient={editing}
      />

      <DeleteDialog
        client={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDelTarget(null)}
      />

      <Toast toast={toast}/>
    </>
  )
}
