'use client'

import { useState, useEffect, useMemo } from 'react'
import FlowHeader from '@/components/flow/FlowHeader'
import MetricCard from '@/components/flow/MetricCard'
import StatusBadge from '@/components/flow/StatusBadge'
import Icon from '@/components/flow/FlowIcons'
import ContentModal from '@/components/flow/ContentModal'
import ContentDetailModal from '@/components/flow/ContentDetailModal'
import { supabase } from '@/lib/supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES     = ['Briefing','Produção','Revisão','Aguardando Aprovação','Agendado','Publicado','Atrasado']
const FORMATS      = ['Reels','Feed','Stories','Carrossel','Blog','Landing Page']
const RESPONSIBLES = ['Bruno','Ana Lima','Rafael Souza','Camila Rocha']

const STATUS_CFG = {
  'Briefing':             { color:'#8B5CF6', bg:'rgba(139,92,246,0.15)' },
  'Produção':             { color:'#3B82F6', bg:'rgba(59,130,246,0.15)' },
  'Revisão':              { color:'#F59E0B', bg:'rgba(245,158,11,0.15)' },
  'Aguardando Aprovação': { color:'#F59E0B', bg:'rgba(245,158,11,0.15)' },
  'Agendado':             { color:'#22C55E', bg:'rgba(34,197,94,0.15)' },
  'Publicado':            { color:'#A1A1AA', bg:'rgba(161,161,170,0.15)' },
  'Atrasado':             { color:'#EF4444', bg:'rgba(239,68,68,0.15)' },
}

const selectStyle = {
  backgroundColor:'#1E1E1E',
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23FFD22E' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center',
  border:'1px solid rgba(255,210,46,0.25)', borderRadius:8,
  color:'var(--f-text)', fontSize:13, padding:'7px 28px 7px 10px',
  cursor:'pointer', outline:'none', width:'100%',
  appearance:'none', WebkitAppearance:'none',
}

// ─── Field mapping ────────────────────────────────────────────────────────────

function fromDB(row) {
  return {
    id:           row.id,
    title:        row.title        ?? '',
    client:       row.client       ?? '',
    format:       row.format       ?? '',
    channel:      row.channel      ?? '',
    status:       row.status       ?? 'Briefing',
    pubDate:      row.pub_date     ?? '',
    pubTime:      row.pub_time     ?? '',
    responsible:  row.responsible  ?? '',
    priority:     row.priority     ?? 'Média',
    copy:         row.copy         ?? '',
    observations: row.observations ?? '',
    link:         row.link         ?? '',
  }
}

function toDB(form) {
  return {
    title:        form.title        || '',
    client:       form.client       || '',
    format:       form.format       || '',
    channel:      form.channel      || '',
    status:       form.status       || 'Briefing',
    pub_date:     form.pubDate      || null,
    pub_time:     form.pubTime      || null,
    responsible:  form.responsible  || '',
    priority:     form.priority     || 'Média',
    copy:         form.copy         || '',
    observations: form.observations || '',
    link:         form.link         || '',
  }
}

function fmtDate(iso) {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${Number(d)} ${months[Number(m) - 1]}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConteudosPage() {
  const [contents,   setContents]  = useState([])
  const [clientNames,setClientNames]= useState([])
  const [loading,    setLoading]   = useState(true)
  const [modalOpen,  setModalOpen] = useState(false)
  const [editing,    setEditing]   = useState(null)
  const [delTarget,  setDelTarget] = useState(null)
  const [viewing,    setViewing]   = useState(null)
  const [search,     setSearch]    = useState('')
  const [fClient,    setFClient]   = useState('')
  const [fStatus,    setFStatus]   = useState('')
  const [fFormat,    setFFormat]   = useState('')
  const [fResp,      setFResp]     = useState('')
  const [toast,      setToast]     = useState(null)

  // ─── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [{ data: rows }, { data: clientRows }] = await Promise.all([
        supabase.from('contents').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('name').order('name'),
      ])
      setContents((rows ?? []).map(fromDB))
      setClientNames((clientRows ?? []).map(r => r.name))
      setLoading(false)
    }
    load()
  }, [])

  function flash(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const metrics = useMemo(() => ({
    total:     contents.length,
    producao:  contents.filter(c => c.status === 'Produção').length,
    aprovacao: contents.filter(c => c.status === 'Aguardando Aprovação').length,
    atrasado:  contents.filter(c => c.status === 'Atrasado').length,
  }), [contents])

  const filtered = useMemo(() => contents.filter(c => {
    if (fClient && c.client      !== fClient) return false
    if (fStatus && c.status      !== fStatus) return false
    if (fFormat && c.format      !== fFormat) return false
    if (fResp   && c.responsible !== fResp)   return false
    if (search) {
      const q = search.toLowerCase()
      return (
        c.title.toLowerCase().includes(q) ||
        c.client.toLowerCase().includes(q) ||
        c.format.toLowerCase().includes(q) ||
        (c.responsible || '').toLowerCase().includes(q) ||
        (c.channel || '').toLowerCase().includes(q)
      )
    }
    return true
  }), [contents, fClient, fStatus, fFormat, fResp, search])

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(item) { setEditing(item); setModalOpen(true) }

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  async function handleSave(form) {
    if (editing) {
      const { data, error } = await supabase
        .from('contents').update(toDB(form)).eq('id', editing.id).select().single()
      if (error) { flash('Erro ao salvar.', 'warn'); return }
      setContents(prev => prev.map(c => c.id === editing.id ? fromDB(data) : c))
      flash('Conteúdo atualizado!')
    } else {
      const { data, error } = await supabase
        .from('contents').insert(toDB(form)).select().single()
      if (error) { flash('Erro ao criar.', 'warn'); return }
      setContents(prev => [fromDB(data), ...prev])
      flash('Conteúdo criado!')
    }
    setModalOpen(false); setEditing(null)
  }

  async function handleDuplicate(item) {
    const { data, error } = await supabase
      .from('contents').insert({ ...toDB(item), title: `Cópia — ${item.title}` }).select().single()
    if (error) { flash('Erro ao duplicar.', 'warn'); return }
    setContents(prev => [fromDB(data), ...prev])
    flash('Conteúdo duplicado!')
  }

  async function handleDelete(item) {
    const { error } = await supabase.from('contents').delete().eq('id', item.id)
    if (error) { flash('Erro ao excluir.', 'warn'); return }
    setContents(prev => prev.filter(c => c.id !== item.id))
    setDelTarget(null)
    flash('Conteúdo excluído.', 'warn')
  }

  async function handleStatusChange(id, newStatus) {
    const { data, error } = await supabase
      .from('contents').update({ status: newStatus }).eq('id', id).select().single()
    if (!error && data) setContents(prev => prev.map(c => c.id === id ? fromDB(data) : c))
  }

  return (
    <>
      <FlowHeader
        title="Conteúdos"
        subtitle="Gerencie tudo que está em briefing, produção, aprovação e publicação."
        actions={
          <button className="f-btn-primary" onClick={openCreate}>
            <Icon name="plus" size={14}/> <span>Novo Conteúdo</span>
          </button>
        }
      />

      <main className="f-content">
        <div className="f-metrics-grid">
          <MetricCard icon="file"     value={String(metrics.total)}     label="Total"              desc="conteúdos cadastrados"   accentColor="#FFD22E" trend={0}  />
          <MetricCard icon="trending" value={String(metrics.producao)}  label="Em Produção"        desc="em andamento agora"      accentColor="#3B82F6" trend={12} />
          <MetricCard icon="clock"    value={String(metrics.aprovacao)} label="Aguard. Aprovação"  desc="pendentes de revisão"    accentColor="#F59E0B" trend={0}  />
          <MetricCard icon="alert"    value={String(metrics.atrasado)}  label="Atrasados"          desc="precisam de atenção"     accentColor="#EF4444" trend={-2} />
        </div>

        <div className="f-filter-row">
          <select style={selectStyle} value={fClient} onChange={e => setFClient(e.target.value)}>
            <option value="">Todos os clientes</option>
            {clientNames.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={selectStyle} value={fStatus} onChange={e => setFStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select style={selectStyle} value={fFormat} onChange={e => setFFormat(e.target.value)}>
            <option value="">Todos os formatos</option>
            {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select style={selectStyle} value={fResp} onChange={e => setFResp(e.target.value)}>
            <option value="">Todos os responsáveis</option>
            {RESPONSIBLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div style={{ position:'relative' }}>
          <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--f-muted)', pointerEvents:'none' }}>
            <Icon name="search" size={14}/>
          </div>
          <input
            className="f-input"
            style={{ paddingLeft:36 }}
            placeholder="Buscar por título, cliente, formato, responsável..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="f-card">
          <div className="f-card-header">
            <div>
              <h2 className="f-card-title">Lista de Conteúdos</h2>
              <p className="f-card-subtitle">{filtered.length} {filtered.length === 1 ? 'item' : 'itens'}</p>
            </div>
            {(fClient || fStatus || fFormat || fResp || search) && (
              <button className="f-btn-ghost" style={{ fontSize:12 }}
                onClick={() => { setFClient(''); setFStatus(''); setFFormat(''); setFResp(''); setSearch('') }}>
                Limpar filtros
              </button>
            )}
          </div>

          {loading ? (
            <div className="f-empty-state" style={{ padding:'60px 20px' }}>
              <Icon name="refresh" size={32}/>
              <h3>Carregando…</h3>
            </div>
          ) : filtered.length === 0 ? (
            <div className="f-empty-state" style={{ padding:'60px 20px' }}>
              <Icon name="file" size={40}/>
              <h3>Nenhum conteúdo encontrado</h3>
              <p>Crie um novo conteúdo ou ajuste os filtros.</p>
              <button className="f-btn-primary" style={{ marginTop:12 }} onClick={openCreate}>
                <Icon name="plus" size={14}/> Novo Conteúdo
              </button>
            </div>
          ) : (
            <div>
              {filtered.map((item, i) => (
                <ContentItem
                  key={item.id}
                  item={item}
                  isLast={i === filtered.length - 1}
                  onView={() => setViewing(item)}
                  onEdit={() => openEdit(item)}
                  onDuplicate={() => handleDuplicate(item)}
                  onDelete={() => setDelTarget(item)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <ContentDetailModal
        isOpen={!!viewing}
        content={viewing}
        onClose={() => setViewing(null)}
        onEdit={() => { openEdit(viewing) }}
      />

      <ContentModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
        editingContent={editing}
        clients={clientNames}
      />

      {delTarget && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(5px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setDelTarget(null)}
        >
          <div
            style={{ background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, maxWidth:360, width:'100%' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(239,68,68,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#EF4444', flexShrink:0 }}>
                <Icon name="trash" size={18}/>
              </div>
              <div>
                <div style={{ fontWeight:700, color:'#fff', fontSize:15 }}>Excluir conteúdo?</div>
                <div style={{ fontSize:12, color:'#A1A1AA', marginTop:2 }}>Esta ação não pode ser desfeita.</div>
              </div>
            </div>
            <p style={{ fontSize:13, color:'#A1A1AA', marginBottom:20, lineHeight:1.5 }}>
              "<strong style={{ color:'#fff' }}>{delTarget.title}</strong>" será removido permanentemente.
            </p>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="f-btn-ghost" onClick={() => setDelTarget(null)}>Cancelar</button>
              <button
                onClick={() => handleDelete(delTarget)}
                style={{ padding:'7px 16px', borderRadius:8, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#EF4444', cursor:'pointer', fontWeight:600, fontSize:13 }}
              >Excluir</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position:'fixed', bottom:24, right:24, zIndex:300,
          background: toast.type === 'warn' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
          border:`1px solid ${toast.type === 'warn' ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.35)'}`,
          borderRadius:10, padding:'11px 18px',
          color: toast.type === 'warn' ? '#EF4444' : '#22C55E',
          fontSize:13, fontWeight:600, animation:'toastIn 0.2s ease',
          boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}

// ─── Content Item ─────────────────────────────────────────────────────────────

function ContentItem({ item, isLast, onView, onEdit, onDuplicate, onDelete, onStatusChange }) {
  const cfg = STATUS_CFG[item.status] ?? { color:'#A1A1AA', bg:'rgba(161,161,170,0.15)' }

  return (
    <div
      className="f-con-item"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--f-border)', cursor:'pointer' }}
      onClick={onView}
    >
      <div className="f-con-top">
        <div style={{ flex:1, minWidth:0 }}>
          <div className="f-con-title">{item.title}</div>
          <div className="f-con-meta">
            <span style={{ fontSize:12, fontWeight:600, color:'var(--f-muted)' }}>{item.client}</span>
            {item.format && <span className="f-format-chip" style={{ fontSize:11 }}>{item.format}</span>}
            {item.channel && <span style={{ fontSize:11, color:'var(--f-muted)' }}>{item.channel}</span>}
            {item.pubDate && (
              <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, color:'var(--f-muted)' }}>
                <Icon name="calendar" size={10}/>
                {fmtDate(item.pubDate)}{item.pubTime ? ` · ${item.pubTime}` : ''}
              </span>
            )}
            {item.responsible && <span style={{ fontSize:11, color:'var(--f-muted)' }}>{item.responsible}</span>}
          </div>
        </div>

        <div className="f-con-right" onClick={e => e.stopPropagation()}>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
            <StatusBadge status={item.priority}/>
            <select
              className="f-status-select"
              value={item.status}
              onChange={e => onStatusChange(item.id, e.target.value)}
              style={{ color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.color}30` }}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="f-con-actions">
            <button className="f-cfc-action-btn" onClick={onEdit} title="Editar"><Icon name="edit" size={13}/></button>
            <button className="f-cfc-action-btn" onClick={onDuplicate} title="Duplicar"><Icon name="copy" size={13}/></button>
            <button className="f-cfc-action-btn danger" onClick={onDelete} title="Excluir"><Icon name="trash" size={13}/></button>
          </div>
        </div>
      </div>
    </div>
  )
}
