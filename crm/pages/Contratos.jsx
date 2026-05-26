import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SERVICOS = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'trafego_pago', label: 'Tráfego Pago' },
  { value: 'design',       label: 'Design Gráfico' },
  { value: 'site',         label: 'Site / Landing Page' },
  { value: 'gmn',          label: 'Google Meu Negócio' },
  { value: 'gestao_marca', label: 'Gestão de Marca' },
]

const STATUS_OPTS = ['ativo', 'pausado', 'encerrado']

const STATUS_BADGE = {
  ativo:     'crm-badge-success',
  pausado:   'crm-badge-warning',
  encerrado: 'crm-badge-muted',
}

function fmtBRL(v) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

const EMPTY_FORM = { cliente_id: '', servico: 'social_media', valor_mensal: '', data_inicio: '', data_renovacao: '', status: 'ativo' }

export default function Contratos() {
  const [contratos, setContratos] = useState([])
  const [clientes, setClientes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filtroServico, setFiltroServico] = useState('')
  const [filtroStatus, setFiltroStatus]   = useState('ativo')
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: ct }, { data: cl }] = await Promise.all([
      supabase.from('crm_contratos').select('*, crm_clientes(id, nome, avatar_color)').order('created_at', { ascending: false }),
      supabase.from('crm_clientes').select('id, nome').order('nome'),
    ])
    setContratos(ct || [])
    setClientes(cl || [])
    setLoading(false)
  }

  function openNew() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setModal(true)
  }

  function openEdit(ct) {
    setEditId(ct.id)
    setForm({
      cliente_id:      ct.cliente_id || '',
      servico:         ct.servico || 'social_media',
      valor_mensal:    ct.valor_mensal || '',
      data_inicio:     ct.data_inicio || '',
      data_renovacao:  ct.data_renovacao || '',
      status:          ct.status || 'ativo',
    })
    setModal(true)
  }

  async function save() {
    if (!form.cliente_id || !form.servico) return
    setSaving(true)
    const payload = { ...form, valor_mensal: parseFloat(form.valor_mensal) || 0 }
    if (editId) {
      await supabase.from('crm_contratos').update(payload).eq('id', editId)
    } else {
      await supabase.from('crm_contratos').insert(payload)
    }
    setSaving(false)
    setModal(false)
    load()
  }

  async function del(id) {
    if (!window.confirm('Remover este contrato?')) return
    await supabase.from('crm_contratos').delete().eq('id', id)
    load()
  }

  const filtered = contratos.filter(ct => {
    const matchServico = !filtroServico || ct.servico === filtroServico
    const matchStatus  = !filtroStatus  || ct.status  === filtroStatus
    return matchServico && matchStatus
  })

  const mrr = filtered.filter(ct => ct.status === 'ativo').reduce((s, ct) => s + (parseFloat(ct.valor_mensal) || 0), 0)

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
          <h2>Contratos</h2>
          <p>{contratos.filter(c => c.status === 'ativo').length} ativos · MRR total: {fmtBRL(contratos.filter(c => c.status === 'ativo').reduce((s,c) => s + (parseFloat(c.valor_mensal)||0), 0))}</p>
        </div>
        <button className="crm-btn crm-btn-primary" onClick={openNew}>+ Novo Contrato</button>
      </div>

      <div className="crm-search-bar">
        <select className="crm-select" style={{ width: 200 }} value={filtroServico} onChange={e => setFiltroServico(e.target.value)}>
          <option value="">Todos os serviços</option>
          {SERVICOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="crm-select" style={{ width: 160 }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="crm-card">
        {filtered.length === 0 ? (
          <div className="crm-empty">
            <div className="crm-empty-icon">📋</div>
            <p>Nenhum contrato encontrado</p>
          </div>
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Valor/mês</th>
                  <th>Início</th>
                  <th>Renovação</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ct => (
                  <tr key={ct.id}>
                    <td className="crm-td-main">
                      <Link to={`/crm/clientes/${ct.cliente_id}`} style={{ textDecoration: 'none', color: 'var(--crm-text)', fontWeight: 500 }}>
                        {ct.crm_clientes?.nome || '—'}
                      </Link>
                    </td>
                    <td>{SERVICOS.find(s => s.value === ct.servico)?.label || ct.servico}</td>
                    <td style={{ fontWeight: 600, color: 'var(--crm-accent)' }}>{fmtBRL(ct.valor_mensal)}</td>
                    <td>{ct.data_inicio ? new Date(ct.data_inicio).toLocaleDateString('pt-BR') : '—'}</td>
                    <td>{ct.data_renovacao ? new Date(ct.data_renovacao).toLocaleDateString('pt-BR') : '—'}</td>
                    <td>
                      <span className={`crm-badge ${STATUS_BADGE[ct.status] || 'crm-badge-muted'}`}>{ct.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => openEdit(ct)}>Editar</button>
                        <button className="crm-btn crm-btn-danger-ghost crm-btn-sm" onClick={() => del(ct.id)}>Excluir</button>
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
              <h3>{editId ? 'Editar Contrato' : 'Novo Contrato'}</h3>
              <button className="crm-modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="crm-modal-body">
              <div className="crm-form-group">
                <label>Cliente *</label>
                <select className="crm-select" value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                  <option value="">Selecionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Serviço *</label>
                  <select className="crm-select" value={form.servico} onChange={e => setForm(f => ({ ...f, servico: e.target.value }))}>
                    {SERVICOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="crm-form-group">
                  <label>Valor mensal (R$)</label>
                  <input className="crm-input" type="number" min="0" step="50" placeholder="1200" value={form.valor_mensal} onChange={e => setForm(f => ({ ...f, valor_mensal: e.target.value }))} />
                </div>
              </div>
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Data de início</label>
                  <input className="crm-input" type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
                </div>
                <div className="crm-form-group">
                  <label>Renovação</label>
                  <input className="crm-input" type="date" value={form.data_renovacao} onChange={e => setForm(f => ({ ...f, data_renovacao: e.target.value }))} />
                </div>
              </div>
              <div className="crm-form-group">
                <label>Status</label>
                <select className="crm-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="crm-modal-footer">
              <button className="crm-btn crm-btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="crm-btn crm-btn-primary" onClick={save} disabled={saving || !form.cliente_id}>
                {saving ? 'Salvando...' : editId ? 'Salvar' : 'Criar Contrato'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
