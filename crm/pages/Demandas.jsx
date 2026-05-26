import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const GRUPOS = [
  { key: 'planejado',    label: 'Planejado',    color: '#64748b', chipBg: '#334155', chipText: '#cbd5e1' },
  { key: 'em_andamento', label: 'Em andamento', color: '#3b82f6', chipBg: '#1e3a5f', chipText: '#93c5fd' },
  { key: 'revisao',      label: 'Revisão',      color: '#f59e0b', chipBg: '#451a03', chipText: '#fcd34d' },
  { key: 'concluido',    label: 'Concluído',    color: '#10b981', chipBg: '#052e16', chipText: '#6ee7b7' },
]

const TIPOS = ['Post feed','Story','Reels','Legenda','Arte','Identidade visual','Landing page','Site institucional','Campanha','Criativo','Relatório','Carrossel','Outro']

const EMPTY_FORM = { titulo: '', cliente_id: '', servico: '', tipo: '', prazo: '' }

function fmtDate(d) {
  if (!d) return null
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function Demandas() {
  const [entregas, setEntregas]       = useState([])
  const [clientes, setClientes]       = useState([])
  const [counts, setCounts]           = useState({})
  const [loading, setLoading]         = useState(true)
  const [collapsed, setCollapsed]     = useState({})
  const [statusOpen, setStatusOpen]   = useState(null)
  const [statusPos, setStatusPos]     = useState({ top: 0, left: 0 })
  const [briefingModal, setBriefingModal] = useState(null)
  const [commentModal, setCommentModal]   = useState(null)
  const [comments, setComments]       = useState([])
  const [briefingDraft, setBriefingDraft] = useState('')
  const [savingBriefing, setSavingBriefing] = useState(false)
  const [novoComment, setNovoComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [addModal, setAddModal]       = useState(null) // status do grupo
  const [addForm, setAddForm]         = useState(EMPTY_FORM)
  const [addSaving, setAddSaving]     = useState(false)
  const statusRef = useRef(null)

  useEffect(() => { load() }, [])

  useEffect(() => {
    function handler(e) {
      if (statusRef.current && !statusRef.current.contains(e.target)) setStatusOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function load() {
    const [{ data: e }, { data: c }, { data: com }] = await Promise.all([
      supabase.from('crm_entregas')
        .select('*, crm_clientes(id, nome, instagram, drive_link, avatar_color)')
        .order('created_at', { ascending: false }),
      supabase.from('crm_clientes').select('id, nome').order('nome'),
      supabase.from('crm_comentarios').select('entrega_id'),
    ])
    const cnt = {}
    ;(com || []).forEach(c => { cnt[c.entrega_id] = (cnt[c.entrega_id] || 0) + 1 })
    setEntregas(e || [])
    setClientes(c || [])
    setCounts(cnt)
    setLoading(false)
  }

  async function changeStatus(id, status) {
    setEntregas(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    setStatusOpen(null)
    await supabase.from('crm_entregas').update({ status }).eq('id', id)
  }

  async function changePrazo(id, prazo) {
    setEntregas(prev => prev.map(e => e.id === id ? { ...e, prazo } : e))
    await supabase.from('crm_entregas').update({ prazo }).eq('id', id)
  }

  function openBriefing(entrega) {
    setBriefingModal(entrega)
    setBriefingDraft(entrega.briefing || '')
  }

  async function saveBriefing() {
    if (!briefingModal) return
    setSavingBriefing(true)
    await supabase.from('crm_entregas').update({ briefing: briefingDraft }).eq('id', briefingModal.id)
    setEntregas(prev => prev.map(e => e.id === briefingModal.id ? { ...e, briefing: briefingDraft } : e))
    setSavingBriefing(false)
    setBriefingModal(null)
  }

  async function openComments(entrega) {
    setCommentModal(entrega)
    setNovoComment('')
    const { data } = await supabase
      .from('crm_comentarios').select('*').eq('entrega_id', entrega.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  async function addComment() {
    if (!novoComment.trim() || !commentModal) return
    setSavingComment(true)
    const { data: novo } = await supabase
      .from('crm_comentarios')
      .insert({ entrega_id: commentModal.id, texto: novoComment })
      .select().single()
    setComments(prev => [...prev, novo])
    setCounts(prev => ({ ...prev, [commentModal.id]: (prev[commentModal.id] || 0) + 1 }))
    setNovoComment('')
    setSavingComment(false)
  }

  async function addEntrega() {
    if (!addForm.titulo.trim() || !addForm.cliente_id) return
    setAddSaving(true)
    await supabase.from('crm_entregas').insert({ ...addForm, status: addModal })
    setAddSaving(false)
    setAddModal(null)
    setAddForm(EMPTY_FORM)
    load()
  }

  function toggleGroup(key) {
    setCollapsed(p => ({ ...p, [key]: !p[key] }))
  }

  if (loading) return (
    <div className="crm-loading-screen">
      <div className="crm-loading-spinner" />
      <p>Carregando...</p>
    </div>
  )

  return (
    <div>
      <div className="crm-page-header">
        <div className="crm-page-header-left">
          <h2>Demandas</h2>
          <p>{entregas.filter(e => e.status !== 'concluido').length} em aberto · {entregas.length} total</p>
        </div>
      </div>

      <div className="crm-board">
        {GRUPOS.map(grupo => {
          const rows = entregas.filter(e => e.status === grupo.key)
          const isCollapsed = collapsed[grupo.key]

          return (
            <div key={grupo.key}>
              {/* Group header */}
              <div
                className="crm-board-group-header"
                style={{ borderBottomColor: grupo.color }}
                onClick={() => toggleGroup(grupo.key)}
              >
                <span className={`crm-board-group-toggle ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                <span className="crm-board-group-title" style={{ color: grupo.color }}>
                  {grupo.label}
                </span>
                <span className="crm-board-group-count">{rows.length}</span>
              </div>

              {!isCollapsed && (
                <div className="crm-card" style={{ padding: 0, overflow: 'hidden', marginTop: 8 }}>
                  <div className="crm-board-table-wrap" style={{ overflowX: 'auto' }}>
                    <table className="crm-board-table">
                      <thead>
                        <tr>
                          <th className="crm-board-th" style={{ width: 4, padding: 0 }} />
                          <th className="crm-board-th" style={{ minWidth: 220 }}>Elemento</th>
                          <th className="crm-board-th" style={{ width: 56, textAlign: 'center' }}>💬</th>
                          <th className="crm-board-th" style={{ width: 80, textAlign: 'center' }}>Briefing</th>
                          <th className="crm-board-th" style={{ width: 150 }}>Status</th>
                          <th className="crm-board-th" style={{ width: 120 }}>Prazo</th>
                          <th className="crm-board-th" style={{ width: 150 }}>Cliente</th>
                          <th className="crm-board-th" style={{ width: 80, textAlign: 'center' }}>Instagram</th>
                          <th className="crm-board-th" style={{ width: 70, textAlign: 'center' }}>Drive</th>
                          <th className="crm-board-th" style={{ width: 130 }}>Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 && (
                          <tr>
                            <td colSpan={10} style={{ padding: '18px 16px', fontSize: 13, color: 'var(--crm-text-faint)', textAlign: 'center' }}>
                              Nenhuma demanda neste grupo
                            </td>
                          </tr>
                        )}
                        {rows.map(e => {
                          const igUrl = e.crm_clientes?.instagram
                            ? e.crm_clientes.instagram.startsWith('http')
                              ? e.crm_clientes.instagram
                              : `https://instagram.com/${e.crm_clientes.instagram.replace('@','')}`
                            : null

                          const hoje = new Date().toISOString().slice(0,10)
                          const atrasado = e.prazo && e.prazo < hoje && e.status !== 'concluido'

                          return (
                            <tr key={e.id} className="crm-board-row">
                              {/* Color marker */}
                              <td className="crm-board-td crm-board-td-marker" style={{ background: grupo.color }} />

                              {/* Título */}
                              <td className="crm-board-td crm-board-title">{e.titulo}</td>

                              {/* Comentários */}
                              <td className="crm-board-td" style={{ textAlign: 'center' }}>
                                <button
                                  className={`crm-board-icon-btn ${counts[e.id] ? 'has-content' : ''}`}
                                  onClick={() => openComments(e)}
                                  title="Comentários"
                                >
                                  💬
                                  {counts[e.id] > 0 && (
                                    <span className="crm-board-icon-count">{counts[e.id]}</span>
                                  )}
                                </button>
                              </td>

                              {/* Briefing */}
                              <td className="crm-board-td" style={{ textAlign: 'center' }}>
                                <button
                                  className={`crm-board-icon-btn ${e.briefing ? 'has-content' : ''}`}
                                  onClick={() => openBriefing(e)}
                                  title={e.briefing ? 'Ver briefing' : 'Adicionar briefing'}
                                >
                                  {e.briefing ? '📋' : '📄'}
                                </button>
                              </td>

                              {/* Status */}
                              <td className="crm-board-td">
                                <div className="crm-status-wrap" ref={statusOpen === e.id ? statusRef : null}>
                                  <div
                                    className="crm-status-chip"
                                    style={{ background: grupo.chipBg, color: grupo.chipText }}
                                    onClick={(ev) => {
                                      const rect = ev.currentTarget.getBoundingClientRect()
                                      setStatusPos({ top: rect.bottom + 6, left: rect.left })
                                      setStatusOpen(statusOpen === e.id ? null : e.id)
                                    }}
                                  >
                                    {grupo.label}
                                  </div>
                                </div>
                              </td>

                              {/* Prazo */}
                              <td className="crm-board-td">
                                <input
                                  className="crm-board-date"
                                  type="date"
                                  value={e.prazo || ''}
                                  onChange={ev => changePrazo(e.id, ev.target.value)}
                                  style={atrasado ? { color: 'var(--crm-danger)' } : {}}
                                  title={atrasado ? 'Prazo vencido' : ''}
                                />
                              </td>

                              {/* Cliente */}
                              <td className="crm-board-td">
                                <span style={{ fontSize: 13, color: 'var(--crm-text-muted)' }}>
                                  {e.crm_clientes?.nome || '—'}
                                </span>
                              </td>

                              {/* Instagram */}
                              <td className="crm-board-td" style={{ textAlign: 'center' }}>
                                {igUrl ? (
                                  <a
                                    href={igUrl} target="_blank" rel="noreferrer"
                                    className="crm-board-icon-btn has-content"
                                    title={e.crm_clientes?.instagram}
                                  >
                                    📸
                                  </a>
                                ) : (
                                  <span style={{ color: 'var(--crm-text-faint)', fontSize: 12 }}>—</span>
                                )}
                              </td>

                              {/* Drive */}
                              <td className="crm-board-td" style={{ textAlign: 'center' }}>
                                {e.crm_clientes?.drive_link ? (
                                  <a
                                    href={e.crm_clientes.drive_link} target="_blank" rel="noreferrer"
                                    className="crm-board-icon-btn has-content"
                                    title="Abrir Drive"
                                  >
                                    📁
                                  </a>
                                ) : (
                                  <span style={{ color: 'var(--crm-text-faint)', fontSize: 12 }}>—</span>
                                )}
                              </td>

                              {/* Tipo */}
                              <td className="crm-board-td">
                                <span style={{ fontSize: 12, color: 'var(--crm-text-faint)' }}>
                                  {e.tipo || '—'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Add row */}
                  <div className="crm-board-add-row" onClick={() => { setAddModal(grupo.key); setAddForm({ ...EMPTY_FORM }) }}>
                    <span style={{ fontSize: 14 }}>+</span>
                    <span>Adicionar elemento</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Briefing Modal ── */}
      {briefingModal && (
        <div className="crm-modal-backdrop" onClick={e => e.target === e.currentTarget && setBriefingModal(null)}>
          <div className="crm-modal" style={{ maxWidth: 580 }}>
            <div className="crm-modal-header">
              <h3>📋 Briefing — {briefingModal.titulo}</h3>
              <button className="crm-modal-close" onClick={() => setBriefingModal(null)}>×</button>
            </div>
            <div className="crm-modal-body">
              <div className="crm-form-group">
                <label>Detalhes do briefing, referências, observações...</label>
                <textarea
                  className="crm-textarea"
                  style={{ minHeight: 200, fontFamily: 'inherit', fontSize: 13, lineHeight: 1.7 }}
                  placeholder="Descreva o briefing do projeto: objetivo, referências visuais, tom de voz, entregáveis, prazos internos..."
                  value={briefingDraft}
                  onChange={e => setBriefingDraft(e.target.value)}
                  autoFocus
                />
              </div>
              {briefingModal.crm_clientes?.instagram && (
                <div style={{ fontSize: 12, color: 'var(--crm-text-faint)' }}>
                  📸 Instagram:{' '}
                  <a href={briefingModal.crm_clientes.instagram.startsWith('http') ? briefingModal.crm_clientes.instagram : `https://instagram.com/${briefingModal.crm_clientes.instagram.replace('@','')}`}
                    target="_blank" rel="noreferrer" style={{ color: 'var(--crm-accent)' }}>
                    {briefingModal.crm_clientes.instagram}
                  </a>
                </div>
              )}
              {briefingModal.crm_clientes?.drive_link && (
                <div style={{ fontSize: 12, color: 'var(--crm-text-faint)' }}>
                  📁 Drive:{' '}
                  <a href={briefingModal.crm_clientes.drive_link} target="_blank" rel="noreferrer" style={{ color: 'var(--crm-accent)' }}>
                    Abrir pasta do cliente
                  </a>
                </div>
              )}
            </div>
            <div className="crm-modal-footer">
              <button className="crm-btn crm-btn-ghost" onClick={() => setBriefingModal(null)}>Cancelar</button>
              <button className="crm-btn crm-btn-primary" onClick={saveBriefing} disabled={savingBriefing}>
                {savingBriefing ? 'Salvando...' : 'Salvar Briefing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Comments Modal ── */}
      {commentModal && (
        <div className="crm-modal-backdrop" onClick={e => e.target === e.currentTarget && setCommentModal(null)}>
          <div className="crm-modal" style={{ maxWidth: 500 }}>
            <div className="crm-modal-header">
              <h3>💬 {commentModal.titulo}</h3>
              <button className="crm-modal-close" onClick={() => setCommentModal(null)}>×</button>
            </div>
            <div className="crm-modal-body">
              {comments.length === 0 ? (
                <div className="crm-empty" style={{ padding: '20px 0' }}>
                  <div className="crm-empty-icon" style={{ fontSize: 28 }}>💬</div>
                  <p style={{ fontSize: 13 }}>Nenhum comentário ainda</p>
                </div>
              ) : (
                <div className="crm-comment-list">
                  {comments.map(c => (
                    <div key={c.id} className="crm-comment-item">
                      <div className="crm-comment-text">{c.texto}</div>
                      <div className="crm-comment-meta">{timeAgo(c.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="crm-comment-input-row">
                <input
                  className="crm-input"
                  placeholder="Escrever comentário..."
                  value={novoComment}
                  onChange={e => setNovoComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addComment()}
                  style={{ flex: 1 }}
                  autoFocus
                />
                <button className="crm-btn crm-btn-primary crm-btn-sm" onClick={addComment} disabled={savingComment || !novoComment.trim()}>
                  {savingComment ? '...' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add element Modal ── */}
      {addModal && (
        <div className="crm-modal-backdrop" onClick={e => e.target === e.currentTarget && setAddModal(null)}>
          <div className="crm-modal" style={{ maxWidth: 480 }}>
            <div className="crm-modal-header">
              <h3>
                Nova demanda —{' '}
                <span style={{ color: GRUPOS.find(g => g.key === addModal)?.color }}>
                  {GRUPOS.find(g => g.key === addModal)?.label}
                </span>
              </h3>
              <button className="crm-modal-close" onClick={() => setAddModal(null)}>×</button>
            </div>
            <div className="crm-modal-body">
              <div className="crm-form-group">
                <label>Título *</label>
                <input
                  className="crm-input"
                  placeholder="Ex: Posts junho – feed + stories"
                  value={addForm.titulo}
                  onChange={e => setAddForm(f => ({ ...f, titulo: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Cliente *</label>
                  <select className="crm-select" value={addForm.cliente_id} onChange={e => setAddForm(f => ({ ...f, cliente_id: e.target.value }))}>
                    <option value="">Selecionar...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="crm-form-group">
                  <label>Prazo</label>
                  <input className="crm-input" type="date" value={addForm.prazo} onChange={e => setAddForm(f => ({ ...f, prazo: e.target.value }))} />
                </div>
              </div>
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Tipo</label>
                  <select className="crm-select" value={addForm.tipo} onChange={e => setAddForm(f => ({ ...f, tipo: e.target.value }))}>
                    <option value="">Selecionar...</option>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="crm-form-group">
                  <label>Serviço</label>
                  <select className="crm-select" value={addForm.servico} onChange={e => setAddForm(f => ({ ...f, servico: e.target.value }))}>
                    <option value="">Selecionar...</option>
                    {[['social_media','Social Media'],['trafego_pago','Tráfego Pago'],['design','Design'],['site','Site/LP'],['gmn','Google Meu Neg.'],['gestao_marca','Gestão de Marca']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="crm-modal-footer">
              <button className="crm-btn crm-btn-ghost" onClick={() => setAddModal(null)}>Cancelar</button>
              <button
                className="crm-btn crm-btn-primary"
                onClick={addEntrega}
                disabled={addSaving || !addForm.titulo.trim() || !addForm.cliente_id}
              >
                {addSaving ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Dropdown (fixed — fora de qualquer overflow) ── */}
      {statusOpen && (() => {
        const grupo = GRUPOS.find(g => g.key === (entregas.find(e => e.id === statusOpen)?.status)) || GRUPOS[0]
        return (
          <div
            ref={statusRef}
            className="crm-status-dropdown"
            style={{ position: 'fixed', top: statusPos.top, left: statusPos.left }}
          >
            {GRUPOS.filter(g => g.key !== grupo.key).map(g => (
              <div
                key={g.key}
                className="crm-status-dropdown-item"
                onClick={() => changeStatus(statusOpen, g.key)}
              >
                <span className="crm-status-dot" style={{ background: g.color }} />
                <span style={{ color: 'var(--crm-text)' }}>{g.label}</span>
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  )
}
