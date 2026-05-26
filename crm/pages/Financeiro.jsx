import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '../lib/supabase'

const STATUS_OPTS = ['aguardando', 'pago', 'atraso']
const STATUS_BADGE = {
  aguardando: 'crm-badge-info',
  pago:       'crm-badge-success',
  atraso:     'crm-badge-danger',
}

function fmtBRL(v) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

function mesRef(offset = 0) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function mesLabel(ref) {
  const [y, m] = ref.split('-')
  const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${nomes[parseInt(m) - 1]}/${y.slice(2)}`
}

const EMPTY_FORM = { cliente_id: '', mes_ref: mesRef(), valor: '', status: 'aguardando', data_pagamento: '' }

export default function Financeiro() {
  const [cobrancas, setCobrancas] = useState([])
  const [clientes, setClientes]   = useState([])
  const [contratos, setContratos] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filtroMes, setFiltroMes] = useState(mesRef())
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: cb }, { data: cl }, { data: ct }] = await Promise.all([
      supabase.from('crm_cobrancas').select('*, crm_clientes(id, nome, avatar_color)').order('mes_ref', { ascending: false }),
      supabase.from('crm_clientes').select('id, nome').order('nome'),
      supabase.from('crm_contratos').select('cliente_id, valor_mensal, status').eq('status', 'ativo'),
    ])
    setCobrancas(cb || [])
    setClientes(cl || [])
    setContratos(ct || [])
    setLoading(false)
  }

  function openNew() {
    setEditId(null)
    setForm({ ...EMPTY_FORM, mes_ref: filtroMes })
    setModal(true)
  }

  function openEdit(cb) {
    setEditId(cb.id)
    setForm({
      cliente_id:      cb.cliente_id || '',
      mes_ref:         cb.mes_ref || mesRef(),
      valor:           cb.valor || '',
      status:          cb.status || 'aguardando',
      data_pagamento:  cb.data_pagamento || '',
    })
    setModal(true)
  }

  async function gerarMes() {
    if (!window.confirm(`Gerar cobranças de ${mesLabel(filtroMes)} para todos os clientes com contrato ativo?`)) return
    const existentes = cobrancas.filter(c => c.mes_ref === filtroMes).map(c => c.cliente_id)
    const porCliente = {}
    contratos.forEach(ct => {
      if (!porCliente[ct.cliente_id]) porCliente[ct.cliente_id] = 0
      porCliente[ct.cliente_id] += parseFloat(ct.valor_mensal) || 0
    })
    const novas = Object.entries(porCliente)
      .filter(([cid]) => !existentes.includes(cid))
      .map(([cliente_id, valor]) => ({ cliente_id, mes_ref: filtroMes, valor, status: 'aguardando' }))
    if (novas.length === 0) {
      alert('Todas as cobranças deste mês já foram geradas.')
      return
    }
    await supabase.from('crm_cobrancas').insert(novas)
    load()
  }

  async function save() {
    if (!form.cliente_id || !form.mes_ref) return
    setSaving(true)
    const payload = { ...form, valor: parseFloat(form.valor) || 0 }
    if (editId) {
      await supabase.from('crm_cobrancas').update(payload).eq('id', editId)
    } else {
      await supabase.from('crm_cobrancas').insert(payload)
    }
    setSaving(false)
    setModal(false)
    load()
  }

  async function del(id) {
    if (!window.confirm('Excluir esta cobrança?')) return
    await supabase.from('crm_cobrancas').delete().eq('id', id)
    load()
  }

  // Gráfico: MRR dos últimos 6 meses
  const meses = Array.from({ length: 6 }, (_, i) => mesRef(-(5 - i)))
  const chartData = meses.map(m => ({
    name: mesLabel(m),
    pago:       cobrancas.filter(c => c.mes_ref === m && c.status === 'pago').reduce((s, c) => s + (parseFloat(c.valor) || 0), 0),
    aguardando: cobrancas.filter(c => c.mes_ref === m && c.status === 'aguardando').reduce((s, c) => s + (parseFloat(c.valor) || 0), 0),
    atraso:     cobrancas.filter(c => c.mes_ref === m && c.status === 'atraso').reduce((s, c) => s + (parseFloat(c.valor) || 0), 0),
  }))

  const filtered = cobrancas.filter(c => {
    const matchMes    = !filtroMes    || c.mes_ref  === filtroMes
    const matchStatus = !filtroStatus || c.status   === filtroStatus
    return matchMes && matchStatus
  })

  const totalMes   = filtered.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0)
  const pagoMes    = filtered.filter(c => c.status === 'pago').reduce((s, c) => s + (parseFloat(c.valor) || 0), 0)
  const pendMes    = filtered.filter(c => c.status === 'aguardando').reduce((s, c) => s + (parseFloat(c.valor) || 0), 0)
  const atrasadoMes = filtered.filter(c => c.status === 'atraso').reduce((s, c) => s + (parseFloat(c.valor) || 0), 0)

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.fill, fontWeight: 600, fontSize: 12 }}>
            {p.name}: {fmtBRL(p.value)}
          </p>
        ))}
      </div>
    )
  }

  if (loading) return (
    <div className="crm-loading-screen">
      <div className="crm-loading-spinner" />
      <p>Carregando...</p>
    </div>
  )

  const mesesOpts = Array.from({ length: 12 }, (_, i) => mesRef(-(11 - i)))

  return (
    <div>
      <div className="crm-page-header">
        <div className="crm-page-header-left">
          <h2>Financeiro</h2>
          <p>Cobranças e MRR da agência</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="crm-btn crm-btn-ghost" onClick={gerarMes}>⚡ Gerar mês</button>
          <button className="crm-btn crm-btn-primary" onClick={openNew}>+ Nova cobrança</button>
        </div>
      </div>

      {/* Stats do mês */}
      <div className="crm-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total do mês', value: fmtBRL(totalMes),     color: 'var(--crm-text)'    },
          { label: 'Pago',         value: fmtBRL(pagoMes),      color: 'var(--crm-success)' },
          { label: 'Aguardando',   value: fmtBRL(pendMes),      color: 'var(--crm-info)'    },
          { label: 'Em atraso',    value: fmtBRL(atrasadoMes),  color: 'var(--crm-danger)'  },
        ].map(s => (
          <div key={s.label} className="crm-card crm-card-sm">
            <div className="crm-stat">
              <div className="crm-stat-label">{s.label}</div>
              <div className="crm-stat-value" style={{ fontSize: 22, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div className="crm-card" style={{ marginBottom: 20 }}>
        <div className="crm-section-title" style={{ marginBottom: 18 }}>Receita — últimos 6 meses</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={20} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="pago"       name="Pago"       fill="#10b981" radius={[3,3,0,0]} />
            <Bar dataKey="aguardando" name="Aguardando" fill="#3b82f6" radius={[3,3,0,0]} />
            <Bar dataKey="atraso"     name="Atraso"     fill="#ef4444" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filtros + tabela */}
      <div className="crm-search-bar">
        <select className="crm-select" style={{ width: 160 }} value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
          {mesesOpts.map(m => <option key={m} value={m}>{mesLabel(m)}</option>)}
        </select>
        <select className="crm-select" style={{ width: 160 }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="crm-card">
        {filtered.length === 0 ? (
          <div className="crm-empty">
            <div className="crm-empty-icon">💰</div>
            <p>Nenhuma cobrança neste período</p>
            <button className="crm-btn crm-btn-ghost" style={{ marginTop: 12 }} onClick={gerarMes}>
              Gerar cobranças do mês
            </button>
          </div>
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Mês</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Pgto</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td className="crm-td-main">
                      <Link to={`/crm/clientes/${c.cliente_id}`} style={{ textDecoration: 'none', color: 'var(--crm-text)', fontWeight: 500 }}>
                        {c.crm_clientes?.nome || '—'}
                      </Link>
                    </td>
                    <td>{mesLabel(c.mes_ref)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--crm-accent)' }}>{fmtBRL(c.valor)}</td>
                    <td>
                      <span className={`crm-badge ${STATUS_BADGE[c.status] || 'crm-badge-muted'}`}>{c.status}</span>
                    </td>
                    <td>{c.data_pagamento ? new Date(c.data_pagamento).toLocaleDateString('pt-BR') : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        {c.status !== 'pago' && (
                          <button className="crm-btn crm-btn-ghost crm-btn-sm" style={{ color: 'var(--crm-success)', borderColor: 'rgba(16,185,129,0.3)' }}
                            onClick={async () => {
                              await supabase.from('crm_cobrancas').update({ status: 'pago', data_pagamento: new Date().toISOString().slice(0,10) }).eq('id', c.id)
                              load()
                            }}>
                            ✓ Pago
                          </button>
                        )}
                        <button className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => openEdit(c)}>Editar</button>
                        <button className="crm-btn crm-btn-danger-ghost crm-btn-sm" onClick={() => del(c.id)}>Excluir</button>
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
              <h3>{editId ? 'Editar Cobrança' : 'Nova Cobrança'}</h3>
              <button className="crm-modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="crm-modal-body">
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Cliente *</label>
                  <select className="crm-select" value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                    <option value="">Selecionar...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="crm-form-group">
                  <label>Mês de referência</label>
                  <input className="crm-input" type="month" value={form.mes_ref} onChange={e => setForm(f => ({ ...f, mes_ref: e.target.value }))} />
                </div>
              </div>
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Valor (R$)</label>
                  <input className="crm-input" type="number" min="0" step="50" placeholder="0" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
                </div>
                <div className="crm-form-group">
                  <label>Status</label>
                  <select className="crm-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              {form.status === 'pago' && (
                <div className="crm-form-group">
                  <label>Data do pagamento</label>
                  <input className="crm-input" type="date" value={form.data_pagamento} onChange={e => setForm(f => ({ ...f, data_pagamento: e.target.value }))} />
                </div>
              )}
            </div>
            <div className="crm-modal-footer">
              <button className="crm-btn crm-btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="crm-btn crm-btn-primary" onClick={save} disabled={saving || !form.cliente_id}>
                {saving ? 'Salvando...' : editId ? 'Salvar' : 'Criar Cobrança'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
