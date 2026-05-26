import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SERVICO_LABEL = {
  social_media: 'Social Media',
  trafego_pago: 'Tráfego Pago',
  design:       'Design Gráfico',
  site:         'Site / Landing Page',
  gmn:          'Google Meu Negócio',
  gestao_marca: 'Gestão de Marca',
}

const STATUS_CONTRATO_BADGE = {
  ativo:     'crm-badge-success',
  pausado:   'crm-badge-warning',
  encerrado: 'crm-badge-muted',
}

const STATUS_ENTREGA_BADGE = {
  planejado:    'crm-badge-muted',
  em_andamento: 'crm-badge-info',
  revisao:      'crm-badge-warning',
  concluido:    'crm-badge-success',
}

function getInitials(nome) {
  if (!nome) return '?'
  const p = nome.trim().split(' ')
  return p.length >= 2 ? p[0][0] + p[1][0] : p[0].slice(0, 2)
}

function fmtBRL(v) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

function instagramUrl(val) {
  if (!val) return null
  if (val.startsWith('http')) return val
  return `https://instagram.com/${val.replace('@', '')}`
}

function InlineField({ icon, label, value, placeholder, type = 'text', onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value || '')
  const [saving, setSaving]   = useState(false)

  async function save() {
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    setEditing(false)
  }

  function cancel() {
    setDraft(value || '')
    setEditing(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--crm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {icon} {label}
        </span>
        {!editing && (
          <button
            onClick={() => { setDraft(value || ''); setEditing(true) }}
            style={{ background: 'none', border: 'none', color: 'var(--crm-accent)', fontSize: 12, cursor: 'pointer', padding: '2px 6px' }}
          >
            {value ? 'Editar' : '+ Adicionar'}
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            className="crm-input"
            type={type}
            placeholder={placeholder}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
            autoFocus
            style={{ flex: 1 }}
          />
          <button className="crm-btn crm-btn-primary crm-btn-sm" onClick={save} disabled={saving}>
            {saving ? '...' : 'OK'}
          </button>
          <button className="crm-btn crm-btn-ghost crm-btn-sm" onClick={cancel}>✕</button>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: value ? 'var(--crm-text-muted)' : 'var(--crm-text-faint)', fontStyle: value ? 'normal' : 'italic' }}>
          {value || `Nenhum ${label.toLowerCase()} cadastrado`}
        </div>
      )}
    </div>
  )
}

export default function ClienteDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  const [cliente, setCliente]     = useState(null)
  const [contratos, setContratos] = useState([])
  const [entregas, setEntregas]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  useEffect(() => { load() }, [id])

  async function load() {
    const [{ data: c }, { data: ct }, { data: e }] = await Promise.all([
      supabase.from('crm_clientes').select('*').eq('id', id).single(),
      supabase.from('crm_contratos').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
      supabase.from('crm_entregas').select('*').eq('cliente_id', id).order('prazo', { ascending: true }),
    ])
    setCliente(c)
    setContratos(ct || [])
    setEntregas(e || [])
    setLoading(false)
  }

  async function saveField(field, value) {
    await supabase.from('crm_clientes').update({ [field]: value }).eq('id', id)
    setCliente(c => ({ ...c, [field]: value }))
  }

  async function handleContrato(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setUploadMsg('Arquivo muito grande. Máximo: 10 MB.')
      return
    }
    setUploading(true)
    setUploadMsg('')
    const ext  = file.name.split('.').pop()
    const path = `contratos/${id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('crm-arquivos').upload(path, file, { upsert: true })
    if (upErr) {
      setUploadMsg('Erro no upload. Verifique se o bucket "crm-arquivos" existe no Supabase Storage.')
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('crm-arquivos').getPublicUrl(path)
    await supabase.from('crm_clientes').update({ contrato_url: publicUrl }).eq('id', id)
    setCliente(c => ({ ...c, contrato_url: publicUrl }))
    setUploadMsg('Contrato salvo com sucesso!')
    setUploading(false)
    fileRef.current.value = ''
  }

  async function removerContrato() {
    if (!window.confirm('Remover o contrato salvo?')) return
    await supabase.from('crm_clientes').update({ contrato_url: null }).eq('id', id)
    setCliente(c => ({ ...c, contrato_url: null }))
    setUploadMsg('')
  }

  if (loading) return (
    <div className="crm-loading-screen">
      <div className="crm-loading-spinner" />
      <p>Carregando...</p>
    </div>
  )

  if (!cliente) return (
    <div className="crm-empty">
      <div className="crm-empty-icon">❌</div>
      <p>Cliente não encontrado</p>
      <button className="crm-btn crm-btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate('/crm/clientes')}>
        ← Voltar
      </button>
    </div>
  )

  const mrr      = contratos.filter(c => c.status === 'ativo').reduce((s, c) => s + (parseFloat(c.valor_mensal) || 0), 0)
  const pendentes = entregas.filter(e => e.status !== 'concluido').length
  const igUrl    = instagramUrl(cliente.instagram)

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--crm-text-faint)' }}>
        <Link to="/crm/clientes" style={{ color: 'var(--crm-text-faint)', textDecoration: 'none' }}>Clientes</Link>
        {' → '}
        <span style={{ color: 'var(--crm-text-muted)' }}>{cliente.nome}</span>
      </div>

      {/* Header */}
      <div className="crm-detail-header">
        <div className="crm-avatar crm-detail-avatar" style={{ background: cliente.avatar_color || '#f59e0b' }}>
          {getInitials(cliente.nome).toUpperCase()}
        </div>
        <div className="crm-detail-meta">
          <h2>{cliente.nome}</h2>
          <p>
            {cliente.empresa && <span>{cliente.empresa} · </span>}
            {cliente.nicho   && <span>{cliente.nicho} · </span>}
            <span className={`crm-badge ${cliente.status === 'ativo' ? 'crm-badge-success' : cliente.status === 'lead' ? 'crm-badge-info' : 'crm-badge-muted'}`} style={{ fontSize: 11 }}>
              {cliente.status}
            </span>
          </p>
        </div>
        <button className="crm-btn crm-btn-ghost crm-btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/crm/clientes')}>
          ← Voltar
        </button>
      </div>

      {/* Stats */}
      <div className="crm-grid-3" style={{ marginBottom: 20 }}>
        <div className="crm-card crm-card-sm">
          <div className="crm-stat">
            <div className="crm-stat-label">MRR do cliente</div>
            <div className="crm-stat-value" style={{ fontSize: 22 }}>{fmtBRL(mrr)}</div>
          </div>
        </div>
        <div className="crm-card crm-card-sm">
          <div className="crm-stat">
            <div className="crm-stat-label">Serviços ativos</div>
            <div className="crm-stat-value" style={{ fontSize: 22 }}>{contratos.filter(c => c.status === 'ativo').length}</div>
          </div>
        </div>
        <div className="crm-card crm-card-sm">
          <div className="crm-stat">
            <div className="crm-stat-label">Entregas pendentes</div>
            <div className="crm-stat-value" style={{ fontSize: 22 }}>{pendentes}</div>
          </div>
        </div>
      </div>

      {/* Linha: Contato | Instagram | Drive */}
      <div className="crm-grid-3" style={{ marginBottom: 20 }}>

        {/* Contato */}
        <div className="crm-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="crm-section-title" style={{ marginBottom: 0 }}>Contato</div>

          <InlineField
            icon="📱" label="WhatsApp"
            value={cliente.whatsapp}
            placeholder="(27) 99999-9999"
            onSave={v => saveField('whatsapp', v)}
          />
          <InlineField
            icon="✉️" label="E-mail"
            value={cliente.email}
            placeholder="email@empresa.com"
            type="email"
            onSave={v => saveField('email', v)}
          />

          {cliente.whatsapp && (
            <a
              href={`https://wa.me/55${cliente.whatsapp.replace(/\D/g,'')}`}
              target="_blank" rel="noreferrer"
              className="crm-btn crm-btn-ghost crm-btn-sm"
              style={{ justifyContent: 'center', marginTop: 4, color: '#25d366', borderColor: 'rgba(37,211,102,0.3)' }}
            >
              Abrir WhatsApp ↗
            </a>
          )}
        </div>

        {/* Instagram */}
        <div className="crm-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="crm-section-title" style={{ marginBottom: 0 }}>Instagram</div>

          <InlineField
            icon="📸" label="Perfil"
            value={cliente.instagram}
            placeholder="@perfil ou URL completa"
            onSave={v => saveField('instagram', v)}
          />

          {igUrl && (
            <a
              href={igUrl}
              target="_blank" rel="noreferrer"
              className="crm-btn crm-btn-ghost crm-btn-sm"
              style={{ justifyContent: 'center', marginTop: 4, color: '#e1306c', borderColor: 'rgba(225,48,108,0.3)' }}
            >
              Abrir Instagram ↗
            </a>
          )}

          {!igUrl && (
            <div style={{ fontSize: 12, color: 'var(--crm-text-faint)', lineHeight: 1.5 }}>
              Digite @handle ou cole a URL completa do perfil.
            </div>
          )}
        </div>

        {/* Google Drive */}
        <div className="crm-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="crm-section-title" style={{ marginBottom: 0 }}>Google Drive</div>

          <InlineField
            icon="📁" label="Pasta do cliente"
            value={cliente.drive_link}
            placeholder="https://drive.google.com/..."
            onSave={v => saveField('drive_link', v)}
          />

          {cliente.drive_link && (
            <a
              href={cliente.drive_link}
              target="_blank" rel="noreferrer"
              className="crm-btn crm-btn-ghost crm-btn-sm"
              style={{ justifyContent: 'center', marginTop: 4, color: '#4285f4', borderColor: 'rgba(66,133,244,0.3)' }}
            >
              Abrir Drive ↗
            </a>
          )}

          {!cliente.drive_link && (
            <div style={{ fontSize: 12, color: 'var(--crm-text-faint)', lineHeight: 1.5 }}>
              Cole o link da pasta compartilhada no Drive.
            </div>
          )}
        </div>
      </div>

      {/* Linha: Contrato + Serviços */}
      <div className="crm-grid-2" style={{ marginBottom: 20 }}>

        {/* Contrato assinado */}
        <div className="crm-card">
          <div className="crm-section-title">Contrato Assinado</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cliente.contrato_url ? (
              <>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', background: 'var(--crm-success-dim)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8 }}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--crm-success)' }}>Contrato salvo</div>
                    <div style={{ fontSize: 11, color: 'var(--crm-text-faint)' }}>Clique para visualizar ou baixar</div>
                  </div>
                  <a href={cliente.contrato_url} target="_blank" rel="noreferrer" className="crm-btn crm-btn-ghost crm-btn-sm">
                    Abrir
                  </a>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="crm-btn crm-btn-ghost crm-btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? 'Enviando...' : '🔄 Substituir'}
                  </button>
                  <button className="crm-btn crm-btn-danger-ghost crm-btn-sm" onClick={removerContrato}>
                    Remover
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{ border: '2px dashed var(--crm-border)', borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onClick={() => fileRef.current?.click()}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--crm-accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--crm-border)'}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                <div style={{ fontSize: 13, color: 'var(--crm-text-muted)', fontWeight: 500 }}>
                  {uploading ? 'Enviando...' : 'Clique para subir o contrato'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--crm-text-faint)', marginTop: 4 }}>
                  PDF, DOC, DOCX ou imagem · máx. 10 MB
                </div>
              </div>
            )}

            {uploadMsg && (
              <div style={{ fontSize: 12, padding: '8px 12px', borderRadius: 6,
                background: uploadMsg.includes('sucesso') ? 'var(--crm-success-dim)' : 'var(--crm-danger-dim)',
                color: uploadMsg.includes('sucesso') ? 'var(--crm-success)' : 'var(--crm-danger)' }}>
                {uploadMsg}
              </div>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={handleContrato} />
          </div>
        </div>

        {/* Serviços Contratados */}
        <div className="crm-card">
          <div className="crm-section-title">Serviços Contratados</div>
          {contratos.length === 0 ? (
            <div style={{ color: 'var(--crm-text-faint)', fontSize: 13, marginTop: 12 }}>
              Nenhum contrato. <Link to="/crm/contratos" style={{ color: 'var(--crm-accent)' }}>Adicionar →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {contratos.map(ct => (
                <div key={ct.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--crm-surface2)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--crm-text)' }}>
                      {SERVICO_LABEL[ct.servico] || ct.servico}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--crm-text-faint)' }}>
                      {fmtBRL(ct.valor_mensal)}/mês
                      {ct.data_inicio && ` · desde ${new Date(ct.data_inicio).toLocaleDateString('pt-BR')}`}
                    </div>
                  </div>
                  <span className={`crm-badge ${STATUS_CONTRATO_BADGE[ct.status] || 'crm-badge-muted'}`}>
                    {ct.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notas */}
      {cliente.notas && (
        <div className="crm-card" style={{ marginBottom: 20 }}>
          <div className="crm-section-title">Notas</div>
          <p style={{ fontSize: 13, color: 'var(--crm-text-muted)', lineHeight: 1.7, marginTop: 10 }}>{cliente.notas}</p>
        </div>
      )}

      {/* Entregas */}
      {entregas.length > 0 && (
        <div className="crm-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="crm-section-title" style={{ marginBottom: 0 }}>Entregas</div>
            <Link to="/crm/entregas" style={{ fontSize: 12, color: 'var(--crm-accent)', textDecoration: 'none' }}>Ver no kanban →</Link>
          </div>
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Prazo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entregas.slice(0, 8).map(e => (
                  <tr key={e.id}>
                    <td className="crm-td-main">{e.titulo}</td>
                    <td>{e.tipo || '—'}</td>
                    <td>{e.prazo ? new Date(e.prazo).toLocaleDateString('pt-BR') : '—'}</td>
                    <td>
                      <span className={`crm-badge ${STATUS_ENTREGA_BADGE[e.status] || 'crm-badge-muted'}`}>
                        {e.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
