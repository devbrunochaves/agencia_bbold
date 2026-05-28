'use client'

import { useState, useEffect } from 'react'
import FlowHeader from '@/components/flow/FlowHeader'
import Icon from '@/components/flow/FlowIcons'

const LS_TEAM  = 'bbold_flow_team'
const LS_THEME = 'bbold_flow_theme'
const LS_FONT  = 'bbold_flow_font'
const LS_NOTIF = 'bbold_notif_settings'

const SECTIONS = ['Agência', 'Equipe', 'Permissões', 'Status', 'Notificações', 'Aparência']

const TEAM_SEED = [
  { name: 'Ana Lima',       role: 'Gestora de Conteúdo', avatar: 'AL', status: 'Ativo',   access: 'Admin'  },
  { name: 'Carlos Mendes',  role: 'Social Media',        avatar: 'CM', status: 'Ativo',   access: 'Editor' },
  { name: 'Juliana K.',     role: 'Designer',            avatar: 'JK', status: 'Ativo',   access: 'Editor' },
  { name: 'Pedro Henrique', role: 'Copywriter',          avatar: 'PH', status: 'Ativo',   access: 'Editor' },
  { name: 'Lucas Freitas',  role: 'Analista',            avatar: 'LF', status: 'Inativo', access: 'Viewer' },
]

const CUSTOM_STATUS = [
  { label: 'Briefing',             color: '#8B5CF6' },
  { label: 'Produção',             color: '#3B82F6' },
  { label: 'Revisão',              color: '#F59E0B' },
  { label: 'Aguardando Aprovação', color: '#F59E0B' },
  { label: 'Agendado',             color: '#22C55E' },
  { label: 'Publicado',            color: '#A1A1AA' },
  { label: 'Atrasado',             color: '#EF4444' },
]

const PERMISSIONS = {
  headers: ['Permissão', 'Admin', 'Editor', 'Viewer'],
  rows: [
    ['Ver conteúdos',      true,  true,  true ],
    ['Criar conteúdos',    true,  true,  false],
    ['Aprovar conteúdos',  true,  false, false],
    ['Gerenciar clientes', true,  false, false],
    ['Configurações',      true,  false, false],
  ],
}

const DEFAULT_NOTIF_SETTINGS = {
  'Novo conteúdo criado': true,
  'Aprovação pendente':   true,
  'Conteúdo publicado':   true,
  'Atraso detectado':     true,
  'Novo cliente':         true,
  'Relatório semanal':    false,
}

const THEMES = [
  { id: 'premium', name: 'Dark Premium', colors: ['#212121', '#2A2A2A', '#FFD22E'] },
  { id: 'minimal', name: 'Dark Minimal', colors: ['#1A1A1A', '#222222', '#FFFFFF'] },
  { id: 'green',   name: 'Dark Forest',  colors: ['#1A1F1A', '#2A2F2A', '#22C55E'] },
  { id: 'blue',    name: 'Dark Ocean',   colors: ['#1A1C2A', '#22253A', '#3B82F6'] },
  { id: 'rose',    name: 'Dark Rose',    colors: ['#231A1A', '#352A2A', '#F43F5E'] },
]

const FONTS = [{ name: 'Barlow' }, { name: 'Inter' }]

// ─── Toggle (controlled) ─────────────────────────────────────────────────────

function Toggle({ label, on, onToggle }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--f-border)' }}>
      <span style={{ fontSize: 13, color: 'var(--f-text)' }}>{label}</span>
      <button
        onClick={onToggle}
        style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: on ? 'var(--f-yellow)' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
      >
        <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: on ? '#000' : 'var(--f-muted)', transition: 'left 0.2s', display: 'block' }} />
      </button>
    </div>
  )
}

// ─── Section: Agência ─────────────────────────────────────────────────────────

function SectionAgencia() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--f-text)', marginBottom: 16 }}>Perfil da Agência</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--f-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#000', flexShrink: 0 }}>B</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--f-text)' }}>BBOLD Agência</div>
            <div style={{ fontSize: 12, color: 'var(--f-muted)', marginTop: 2 }}>Marketing Digital · São Paulo, SP</div>
            <button className="f-btn-ghost" style={{ fontSize: 12, marginTop: 6, padding: '4px 10px' }}>Alterar logo</button>
          </div>
        </div>
        {[
          ['Nome da agência', 'BBOLD Agência'],
          ['E-mail', 'contato@agenciabbold.com.br'],
          ['Telefone', '(11) 99999-0000'],
          ['Site', 'agenciabbold.com.br'],
          ['CNPJ', '00.000.000/0001-00'],
        ].map(([label, value]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--f-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>{label}</label>
            <input readOnly defaultValue={value} style={{ width: '100%', maxWidth: 400, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--f-border)', borderRadius: 'var(--f-r-sm)', color: 'var(--f-text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}
        <button className="f-btn-primary" style={{ marginTop: 4 }}>Salvar alterações</button>
      </div>
    </div>
  )
}

// ─── Section: Equipe ─────────────────────────────────────────────────────────

function SectionEquipe() {
  const [showModal,     setShowModal]     = useState(false)
  const [extraMembers,  setExtraMembers]  = useState([])
  const [form,          setForm]          = useState({ name: '', role: '', access: 'Editor' })
  const [nameErr,       setNameErr]       = useState(false)

  useEffect(() => {
    try { setExtraMembers(JSON.parse(localStorage.getItem(LS_TEAM)) ?? []) } catch { }
  }, [])

  function addMember() {
    if (!form.name.trim()) { setNameErr(true); return }
    const parts  = form.name.trim().split(' ').filter(Boolean)
    const avatar = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
    const member  = { name: form.name.trim(), role: form.role || '—', avatar, status: 'Ativo', access: form.access }
    const updated = [...extraMembers, member]
    setExtraMembers(updated)
    localStorage.setItem(LS_TEAM, JSON.stringify(updated))
    setForm({ name: '', role: '', access: 'Editor' })
    setNameErr(false)
    setShowModal(false)
  }

  const allMembers = [...TEAM_SEED, ...extraMembers]

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--f-text)' }}>Equipe Interna</div>
        <button className="f-btn-primary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => setShowModal(true)}>
          <Icon name="plus" size={13} /> Adicionar Membro
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {allMembers.map((m, idx) => (
          <div key={m.name + idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--f-border)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.07)', border: '1px solid var(--f-border-s)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--f-text)', flexShrink: 0 }}>{m.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--f-text)' }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--f-muted)' }}>{m.role}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: m.access === 'Admin' ? 'rgba(255,210,46,0.15)' : 'rgba(255,255,255,0.06)', color: m.access === 'Admin' ? 'var(--f-yellow)' : 'var(--f-muted)', flexShrink: 0 }}>{m.access}</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.status === 'Ativo' ? 'var(--f-green)' : 'var(--f-muted-dim)', flexShrink: 0, display: 'inline-block' }} />
            <button className="f-btn-ghost" style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}><Icon name="edit" size={13} /></button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="f-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="f-modal" style={{ animation: 'modalIn 0.18s ease' }} onClick={e => e.stopPropagation()}>
            <div className="f-modal-header">
              <h2 className="f-modal-title">Adicionar Membro</h2>
              <button className="f-modal-close" onClick={() => setShowModal(false)}><Icon name="xmark" size={18} /></button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="f-label">Nome *</label>
                <input
                  className={`f-input${nameErr ? ' has-error' : ''}`}
                  placeholder="Nome completo"
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setNameErr(false) }}
                />
                {nameErr && <span className="f-field-error">Nome é obrigatório</span>}
              </div>
              <div>
                <label className="f-label">Cargo</label>
                <input className="f-input" placeholder="Ex: Designer, Copywriter…" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
              </div>
              <div>
                <label className="f-label">Nível de Acesso</label>
                <select className="f-input" value={form.access} onChange={e => setForm(f => ({ ...f, access: e.target.value }))}>
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button className="f-btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="f-btn-primary" onClick={addMember}>Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Section: Permissões ──────────────────────────────────────────────────────

function SectionPermissoes() {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--f-text)', marginBottom: 20 }}>Matriz de Permissões</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 320 }}>
          <thead>
            <tr>
              {PERMISSIONS.headers.map((h, i) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: i === 0 ? 'left' : 'center', fontSize: 11, fontWeight: 700, color: 'var(--f-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--f-border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.rows.map(([perm, admin, editor, viewer]) => (
              <tr key={perm} style={{ borderBottom: '1px solid var(--f-border)' }}>
                <td style={{ padding: '11px 12px', fontSize: 13, color: 'var(--f-text)' }}>{perm}</td>
                {[admin, editor, viewer].map((val, idx) => (
                  <td key={idx} style={{ padding: '11px 12px', textAlign: 'center' }}>
                    {val ? <span style={{ color: 'var(--f-green)', fontWeight: 700, fontSize: 15 }}>✓</span>
                         : <span style={{ color: 'var(--f-muted-dim)', fontWeight: 700, fontSize: 14 }}>✕</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Section: Status ──────────────────────────────────────────────────────────

function SectionStatus() {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--f-text)', marginBottom: 20 }}>Status Personalizados</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {CUSTOM_STATUS.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--f-border)' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--f-text)' }}>{s.label}</span>
            <button className="f-btn-ghost" style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}><Icon name="edit" size={13} /></button>
            <button className="f-btn-ghost" style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', color: 'var(--f-red)' }}><Icon name="trash" size={13} /></button>
          </div>
        ))}
      </div>
      <button className="f-btn-ghost" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        <Icon name="plus" size={14} /> Novo status
      </button>
    </div>
  )
}

// ─── Section: Notificações ────────────────────────────────────────────────────

function SectionNotificacoes() {
  const [settings, setSettings] = useState({ ...DEFAULT_NOTIF_SETTINGS })

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_NOTIF))
      if (stored) setSettings(prev => ({ ...prev, ...stored }))
    } catch { }
  }, [])

  function toggle(label) {
    const updated = { ...settings, [label]: !settings[label] }
    setSettings(updated)
    localStorage.setItem(LS_NOTIF, JSON.stringify(updated))
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--f-text)', marginBottom: 4 }}>Notificações</div>
      <p style={{ fontSize: 12, color: 'var(--f-muted)', marginBottom: 20 }}>
        Escolha quais eventos geram notificações em tempo real.
      </p>
      <div style={{ maxWidth: 440 }}>
        {Object.keys(DEFAULT_NOTIF_SETTINGS).map(label => (
          <Toggle key={label} label={label} on={settings[label]} onToggle={() => toggle(label)} />
        ))}
      </div>
    </div>
  )
}

// ─── Section: Aparência ───────────────────────────────────────────────────────

function SectionAparencia() {
  const [theme, setTheme] = useState('premium')
  const [font,  setFont]  = useState('Barlow')

  useEffect(() => {
    setTheme(localStorage.getItem(LS_THEME) ?? 'premium')
    setFont(localStorage.getItem(LS_FONT)   ?? 'Barlow')
  }, [])

  function applyTheme(id) {
    setTheme(id)
    localStorage.setItem(LS_THEME, id)
    document.querySelector('.f-root')?.setAttribute('data-theme', id)
  }

  function applyFont(name) {
    setFont(name)
    localStorage.setItem(LS_FONT, name)
    document.querySelector('.f-root')?.setAttribute('data-font', name)
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Tema */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--f-text)', marginBottom: 14 }}>Tema</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {THEMES.map(t => (
            <div
              key={t.id}
              onClick={() => applyTheme(t.id)}
              style={{
                border: theme === t.id ? '2px solid var(--f-yellow)' : '1px solid var(--f-border)',
                borderRadius: 12, padding: 12, cursor: 'pointer', minWidth: 110,
                background: theme === t.id ? 'rgba(255,210,46,0.05)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {t.colors.map((c, i) => (
                  <div key={i} style={{ width: 20, height: 20, borderRadius: 4, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme === t.id ? 'var(--f-yellow)' : 'var(--f-muted)' }}>{t.name}</div>
              {theme === t.id && <div style={{ fontSize: 10, color: 'var(--f-yellow)', marginTop: 2 }}>✓ Ativo</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Fonte */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--f-text)', marginBottom: 12 }}>Fonte</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {FONTS.map(f => (
            <div
              key={f.name}
              onClick={() => applyFont(f.name)}
              style={{
                border: font === f.name ? '2px solid var(--f-yellow)' : '1px solid var(--f-border)',
                borderRadius: 10, padding: '10px 20px', cursor: 'pointer',
                background: font === f.name ? 'rgba(255,210,46,0.05)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: font === f.name ? 'var(--f-yellow)' : 'var(--f-muted)', fontFamily: f.name }}>Aa</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: font === f.name ? 'var(--f-yellow)' : 'var(--f-muted)', marginTop: 4 }}>{f.name}</div>
              {font === f.name && <div style={{ fontSize: 10, color: 'var(--f-yellow)', marginTop: 2 }}>✓ Ativo</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [active, setActive] = useState('Agência')

  const renderSection = () => {
    switch (active) {
      case 'Agência':      return <SectionAgencia />
      case 'Equipe':       return <SectionEquipe />
      case 'Permissões':   return <SectionPermissoes />
      case 'Status':       return <SectionStatus />
      case 'Notificações': return <SectionNotificacoes />
      case 'Aparência':    return <SectionAparencia />
      default:             return null
    }
  }

  return (
    <>
      <FlowHeader title="Configurações" subtitle="Ajuste preferências, equipe, permissões e padrões da operação." />
      <main className="f-content">
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }} className="cfg-layout">
          <div className="f-card" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SECTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setActive(s)}
                  style={{
                    padding: '9px 12px', borderRadius: 'var(--f-r-sm)', border: 'none',
                    background: active === s ? 'rgba(255,210,46,0.1)' : 'transparent',
                    color: active === s ? 'var(--f-yellow)' : 'var(--f-muted)',
                    fontWeight: active === s ? 700 : 500, fontSize: 13, textAlign: 'left',
                    cursor: 'pointer', borderLeft: active === s ? '2px solid var(--f-yellow)' : '2px solid transparent',
                    transition: 'all 0.15s', fontFamily: 'inherit', width: '100%',
                  }}
                >{s}</button>
              ))}
            </div>
          </div>
          <div className="f-card" style={{ minHeight: 400 }}>{renderSection()}</div>
        </div>
        <style>{`
          @media (max-width: 640px) { .cfg-layout { grid-template-columns: 1fr !important; } }
        `}</style>
      </main>
    </>
  )
}
