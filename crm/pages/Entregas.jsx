import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const COLUNAS = [
  { key: 'planejado',    label: 'Planejado',    color: '#64748b' },
  { key: 'em_andamento', label: 'Em andamento', color: '#3b82f6' },
  { key: 'revisao',      label: 'Revisão',      color: '#f59e0b' },
  { key: 'concluido',    label: 'Concluído',    color: '#10b981' },
]

const SERVICOS = [
  { value: '',             label: 'Todos os serviços' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'trafego_pago', label: 'Tráfego Pago' },
  { value: 'design',       label: 'Design Gráfico' },
  { value: 'site',         label: 'Site / LP' },
  { value: 'gmn',          label: 'Google Meu Negócio' },
  { value: 'gestao_marca', label: 'Gestão de Marca' },
]

const TIPOS_POR_SERVICO = {
  social_media:  ['Post feed','Story','Reels','Legenda','Relatório mensal'],
  trafego_pago:  ['Campanha','Criativo','Relatório','Otimização'],
  design:        ['Arte','Identidade visual','Material impresso','Embalagem'],
  site:          ['Landing page','Site institucional','Ajuste'],
  gmn:           ['Post GMN','Resposta avaliação','Configuração'],
  gestao_marca:  ['Estratégia','Manual de marca','Apresentação'],
}

const EMPTY_FORM = { cliente_id: '', servico: '', tipo: '', titulo: '', prazo: '', notas: '', status: 'planejado' }

export default function Entregas() {
  const [entregas, setEntregas]   = useState([])
  const [clientes, setClientes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroServico, setFiltroServico] = useState('')
  const [modal, setModal]   = useState(false)
  const [cardModal, setCardModal] = useState(null)
  const [form, setForm]     = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: e }, { data: c }] = await Promise.all([
      supabase.from('crm_entregas').select('*, crm_clientes(id, nome, avatar_color)').order('prazo', { ascending: true, nullsFirst: false }),
      supabase.from('crm_clientes').select('id, nome').order('nome'),
    ])
    setEntregas(e || [])
    setClientes(c || [])
    setLoading(false)
  }

  function openNew() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setModal(true)
  }

  function openCard(e) {
    setCardModal(e)
  }

  function openEdit(e) {
    setCardModal(null)
    setEditId(e.id)
    setForm({
      cliente_id: e.cliente_id || '',
      servico:    e.servico    || '',
      tipo:       e.tipo       || '',
      titulo:     e.titulo     || '',
      prazo:      e.prazo      || '',
      notas:      e.notas      || '',
      status:     e.status     || 'planejado',
    })
    setModal(true)
  }

  async function save() {
    if (!form.titulo.trim() || !form.cliente_id) return
    setSaving(true)
    if (editId) {
      await supabase.from('crm_entregas').update(form).eq('id', editId)
    } else {
      await supabase.from('crm_entregas').insert(form)
    }
    setSaving(false)
    setModal(false)
    load()
  }

  async function moveStatus(id, novoStatus) {
    await supabase.from('crm_entregas').update({ status: novoStatus }).eq('id', id)
    setCardModal(null)
    load()
  }

  async function del(id) {
    if (!window.confirm('Excluir esta entrega?')) return
    setCardModal(null)
    await supabase.from('crm_entregas').delete().eq('id', id)
    load()
  }

  const filtered = entregas.filter(e => {
    const matchCliente = !filtroCliente || e.cliente_id === filtroCliente
    const matchServico = !filtroServico || e.servico === filtroServico
    return matchCliente && matchServico
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
          <h2>Entregas</h2>
          <p>{filtered.filter(e => e.status !== 'concluido').length} pendentes · {filtered.filter(e => e.status === 'concluido').length} concluídas</p>
        </div>
        <button className="crm-btn crm-btn-primary" onClick={openNew}>+ Nova Entrega</button>
      </div>

      <div className="crm-search-bar">
        <select className="crm-select" style={{ width: 200 }} value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
          <option value="">Todos os clientes</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select className="crm-select" style={{ width: 200 }} value={filtroServico} onChange={e => setFiltroServico(e.target.value)}>
          {SERVICOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Kanban */}
      <div className="crm-kanban">
        {COLUNAS.map(col => {
          const cards = filtered.filter(e => e.status === col.key)
          return (
            <div key={col.key} className="crm-kanban-col">
              <div className="crm-kanban-col-header">
                <span className="crm-kanban-col-title" style={{ color: col.color }}>{col.label}</span>
                <span className="crm-kanban-col-count">{cards.length}</span>
              </div>
              <div className="crm-kanban-cards">
                {cards.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--crm-text-faint)', textAlign: 'center', padding: '12px 0' }}>
                    Vazio
                  </div>
                )}
                {cards.map(e => {
                  const hoje = new Date().toISOString().slice(0, 10)
                  const atrasado = e.prazo && e.prazo < hoje && e.status !== 'concluido'
                  return (
                    <div key={e.id} className="crm-kanban-card" onClick={() => openCard(e)}>
                      <div className="crm-kanban-card-title">{e.titulo}</div>
                      <div className="crm-kanban-card-meta">
                        <span style={{ color: 'var(--crm-text-muted)' }}>{e.crm_clientes?.nome}</span>
                        {e.tipo && <span>{e.tipo}</span>}
                        {e.prazo && (
                          <span style={{ color: atrasado ? 'var(--crm-danger)' : 'var(--crm-text-faint)' }}>
                            {atrasado ? '⚠️ ' : '📅 '}
                            {new Date(e.prazo).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Card detail modal */}
      {cardModal && (
        <div className="crm-modal-backdrop" onClick={e => e.target === e.currentTarget && setCardModal(null)}>
          <div className="crm-modal" style={{ maxWidth: 420 }}>
            <div className="crm-modal-header">
              <h3 style={{ fontSize: 15 }}>{cardModal.titulo}</h3>
              <button className="crm-modal-close" onClick={() => setCardModal(null)}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div style={{ color: 'var(--crm-text-muted)' }}>
                <strong>Cliente:</strong> {cardModal.crm_clientes?.nome || '—'}
              </div>
              {cardModal.tipo && <div style={{ color: 'var(--crm-text-muted)' }}><strong>Tipo:</strong> {cardModal.tipo}</div>}
              {cardModal.prazo && <div style={{ color: 'var(--crm-text-muted)' }}><strong>Prazo:</strong> {new Date(cardModal.prazo).toLocaleDateString('pt-BR')}</div>}
              {cardModal.notas && (
                <div style={{ background: 'var(--crm-surface2)', borderRadius: 8, padding: 12, color: 'var(--crm-text-muted)', lineHeight: 1.6 }}>
                  {cardModal.notas}
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, color: 'var(--crm-text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Mover para</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {COLUNAS.filter(c => c.key !== cardModal.status).map(c => (
                    <button
                      key={c.key}
                      className="crm-btn crm-btn-ghost crm-btn-sm"
                      style={{ borderColor: c.color + '44', color: c.color }}
                      onClick={() => moveStatus(cardModal.id, c.key)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="crm-modal-footer">
              <button className="crm-btn crm-btn-danger-ghost crm-btn-sm" onClick={() => del(cardModal.id)}>Excluir</button>
              <button className="crm-btn crm-btn-ghost" onClick={() => openEdit(cardModal)}>Editar</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/edit modal */}
      {modal && (
        <div className="crm-modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="crm-modal">
            <div className="crm-modal-header">
              <h3>{editId ? 'Editar Entrega' : 'Nova Entrega'}</h3>
              <button className="crm-modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="crm-modal-body">
              <div className="crm-form-group">
                <label>Título *</label>
                <input className="crm-input" placeholder="Ex: Posts de maio – feed + stories" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
              </div>
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Cliente *</label>
                  <select className="crm-select" value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                    <option value="">Selecionar...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="crm-form-group">
                  <label>Serviço</label>
                  <select className="crm-select" value={form.servico} onChange={e => setForm(f => ({ ...f, servico: e.target.value, tipo: '' }))}>
                    {SERVICOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Tipo</label>
                  <select className="crm-select" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                    <option value="">Selecionar...</option>
                    {(TIPOS_POR_SERVICO[form.servico] || []).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="crm-form-group">
                  <label>Prazo</label>
                  <input className="crm-input" type="date" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
                </div>
              </div>
              <div className="crm-form-group">
                <label>Status</label>
                <select className="crm-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {COLUNAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className="crm-form-group">
                <label>Notas</label>
                <textarea className="crm-textarea" placeholder="Detalhes, links, referências..." value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
              </div>
            </div>
            <div className="crm-modal-footer">
              <button className="crm-btn crm-btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="crm-btn crm-btn-primary" onClick={save} disabled={saving || !form.titulo.trim() || !form.cliente_id}>
                {saving ? 'Salvando...' : editId ? 'Salvar' : 'Criar Entrega'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
