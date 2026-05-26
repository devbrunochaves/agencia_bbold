import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NICHOS = ['Advocacia','Saúde','Nutrição','Barbearia','Moda','Estética','Gastronomia','Educação','Imobiliária','Tecnologia','Outro']
const STATUS_OPTS = ['lead','ativo','pausado','encerrado']

const STATUS_BADGE = {
  lead:      'crm-badge-info',
  ativo:     'crm-badge-success',
  pausado:   'crm-badge-warning',
  encerrado: 'crm-badge-muted',
}

const AVATAR_COLORS = ['#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#ec4899','#06b6d4','#84cc16']

function getInitials(nome) {
  if (!nome) return '?'
  const parts = nome.trim().split(' ')
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)
}

const EMPTY_FORM = { nome: '', empresa: '', nicho: '', whatsapp: '', email: '', instagram: '', drive_link: '', status: 'lead', notas: '', avatar_color: '#f59e0b' }

export default function Clientes() {
  const [clientes, setClientes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filtroStatus, setFiltro] = useState('')
  const [filtroNicho, setFiltroNicho] = useState('')
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [editId, setEditId]       = useState(null)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('crm_clientes').select('*').order('created_at', { ascending: false })
    setClientes(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditId(null)
    setForm({ ...EMPTY_FORM, avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] })
    setModal(true)
  }

  function openEdit(c) {
    setEditId(c.id)
    setForm({ nome: c.nome || '', empresa: c.empresa || '', nicho: c.nicho || '', whatsapp: c.whatsapp || '', email: c.email || '', instagram: c.instagram || '', drive_link: c.drive_link || '', status: c.status || 'lead', notas: c.notas || '', avatar_color: c.avatar_color || '#f59e0b' })
    setModal(true)
  }

  async function save() {
    if (!form.nome.trim()) return
    setSaving(true)
    if (editId) {
      await supabase.from('crm_clientes').update(form).eq('id', editId)
    } else {
      await supabase.from('crm_clientes').insert(form)
    }
    setSaving(false)
    setModal(false)
    load()
  }

  async function del(id) {
    if (!window.confirm('Remover este cliente? Todos os dados relacionados serão excluídos.')) return
    setDeleting(id)
    await supabase.from('crm_clientes').delete().eq('id', id)
    setDeleting(null)
    load()
  }

  // Nichos únicos cadastrados no CRM (dinâmico)
  const nichosDisponiveis = [...new Set(clientes.map(c => c.nicho).filter(Boolean))].sort()

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.nome?.toLowerCase().includes(q) || c.empresa?.toLowerCase().includes(q) || c.nicho?.toLowerCase().includes(q)
    const matchStatus = !filtroStatus || c.status === filtroStatus
    const matchNicho  = !filtroNicho  || c.nicho === filtroNicho
    return matchSearch && matchStatus && matchNicho
  })

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
          <h2>Clientes</h2>
          <p>{clientes.filter(c => c.status === 'ativo').length} ativos · {clientes.length} total</p>
        </div>
        <button className="crm-btn crm-btn-primary" onClick={openNew}>+ Novo Cliente</button>
      </div>

      <div className="crm-search-bar">
        {/* Input com botão X */}
        <div className="crm-search-input-wrap">
          <input
            className="crm-input"
            placeholder="Buscar por nome, empresa ou nicho..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="crm-search-clear" onClick={() => setSearch('')} title="Limpar busca">
              ×
            </button>
          )}
        </div>

        {/* Filtro por status */}
        <select className="crm-select" style={{ width: 160 }} value={filtroStatus} onChange={e => setFiltro(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>

        {/* Filtro por nicho (dinâmico) */}
        <select className="crm-select" style={{ width: 190 }} value={filtroNicho} onChange={e => setFiltroNicho(e.target.value)}>
          <option value="">Todos os nichos</option>
          {nichosDisponiveis.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        {/* Indicador de filtros ativos */}
        {(search || filtroStatus || filtroNicho) && (
          <button
            className="crm-btn crm-btn-ghost crm-btn-sm"
            onClick={() => { setSearch(''); setFiltro(''); setFiltroNicho('') }}
          >
            ✕ Limpar filtros
          </button>
        )}
      </div>

      <div className="crm-card">
        {filtered.length === 0 ? (
          <div className="crm-empty">
            <div className="crm-empty-icon">👥</div>
            <p>{search || filtroStatus ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}</p>
          </div>
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Nicho</th>
                  <th>WhatsApp</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td className="crm-td-main">
                      <Link to={`/crm/clientes/${c.id}`} className="crm-client-link">
                        <div className="crm-client-info">
                          <div className="crm-avatar" style={{ background: c.avatar_color || '#f59e0b' }}>
                            {getInitials(c.nome).toUpperCase()}
                          </div>
                          <div>
                            <div className="crm-client-name">{c.nome}</div>
                            {c.empresa && <div className="crm-client-company">{c.empresa}</div>}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td>{c.nicho || '—'}</td>
                    <td>{c.whatsapp || '—'}</td>
                    <td>
                      <span className={`crm-badge ${STATUS_BADGE[c.status] || 'crm-badge-muted'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => openEdit(c)}>Editar</button>
                        <button
                          className="crm-btn crm-btn-danger-ghost crm-btn-sm"
                          onClick={() => del(c.id)}
                          disabled={deleting === c.id}
                        >
                          {deleting === c.id ? '...' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="crm-modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="crm-modal">
            <div className="crm-modal-header">
              <h3>{editId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button className="crm-modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="crm-modal-body">
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Nome *</label>
                  <input className="crm-input" placeholder="Nome do contato" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                </div>
                <div className="crm-form-group">
                  <label>Empresa</label>
                  <input className="crm-input" placeholder="Razão social ou nome fantasia" value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} />
                </div>
              </div>
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Nicho</label>
                  <select className="crm-select" value={form.nicho} onChange={e => setForm(f => ({ ...f, nicho: e.target.value }))}>
                    <option value="">Selecionar...</option>
                    {NICHOS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="crm-form-group">
                  <label>Status</label>
                  <select className="crm-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>WhatsApp</label>
                  <input className="crm-input" placeholder="(27) 99999-9999" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                </div>
                <div className="crm-form-group">
                  <label>E-mail</label>
                  <input className="crm-input" type="email" placeholder="email@empresa.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Instagram</label>
                  <input className="crm-input" placeholder="@perfil ou URL completa" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} />
                </div>
                <div className="crm-form-group">
                  <label>Link do Drive</label>
                  <input className="crm-input" placeholder="https://drive.google.com/..." value={form.drive_link} onChange={e => setForm(f => ({ ...f, drive_link: e.target.value }))} />
                </div>
              </div>
              <div className="crm-form-group">
                <label>Cor do avatar</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AVATAR_COLORS.map(cor => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, avatar_color: cor }))}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: cor, border: 'none',
                        cursor: 'pointer', outline: form.avatar_color === cor ? '2px solid #fff' : 'none',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="crm-form-group">
                <label>Notas</label>
                <textarea className="crm-textarea" placeholder="Observações sobre o cliente..." value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
              </div>
            </div>
            <div className="crm-modal-footer">
              <button className="crm-btn crm-btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="crm-btn crm-btn-primary" onClick={save} disabled={saving || !form.nome.trim()}>
                {saving ? 'Salvando...' : editId ? 'Salvar' : 'Criar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
