'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import FlowHeader from '@/components/flow/FlowHeader'
import Icon from '@/components/flow/FlowIcons'

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_LIBRARY  = 'bbold_flow_library'
const LS_CLIENTS  = 'bbold_flow_clients'

const TYPES       = ['Logo','Brandbook','Foto','Vídeo','Contrato','Briefing','Campanha']

const FOLDER_COLORS = ['#FFD22E','#3B82F6','#22C55E','#8B5CF6','#F59E0B','#EF4444','#06B6D4','#EC4899']

const INITIAL_CLIENTS = [
  { id:'1', name:'Academia Alpha',     color:'#FFD22E', initials:'AA' },
  { id:'2', name:'Clínica Essenza',    color:'#3B82F6', initials:'CE' },
  { id:'3', name:'Restaurante Origem', color:'#F59E0B', initials:'RO' },
  { id:'4', name:'Urban Fit Store',    color:'#22C55E', initials:'UF' },
  { id:'5', name:'Studio Bella Forma', color:'#8B5CF6', initials:'SB' },
  { id:'6', name:'Odonto Prime',       color:'#EF4444', initials:'OP' },
]

const INITIAL_FILES = [
  { id:'1',  name:'logo-academia-alpha.svg',      client:'Academia Alpha',     type:'Logo',      sizeKB:240,    date:'2026-05-15', observations:'Logo principal em SVG vetorial.' },
  { id:'2',  name:'brandbook-alpha-2025.pdf',     client:'Academia Alpha',     type:'Brandbook', sizeKB:4300,   date:'2026-01-10', observations:'Manual de identidade visual completo.' },
  { id:'3',  name:'fotos-estudio-abril.zip',      client:'Academia Alpha',     type:'Foto',      sizeKB:89088,  date:'2026-04-02', observations:'Pack de fotos do estúdio — sessão de abril.' },
  { id:'4',  name:'logo-essenza-principal.svg',   client:'Clínica Essenza',    type:'Logo',      sizeKB:180,    date:'2026-03-08', observations:'' },
  { id:'5',  name:'contrato-essenza-2025.pdf',    client:'Clínica Essenza',    type:'Contrato',  sizeKB:320,    date:'2026-01-01', observations:'Contrato de prestação de serviços 2025.' },
  { id:'6',  name:'briefing-junho-essenza.pdf',   client:'Clínica Essenza',    type:'Briefing',  sizeKB:156,    date:'2026-05-20', observations:'Briefing para campanha de junho.' },
  { id:'7',  name:'logo-origem-vetor.svg',        client:'Restaurante Origem', type:'Logo',      sizeKB:95,     date:'2026-02-05', observations:'' },
  { id:'8',  name:'fotos-restaurante-maio.zip',   client:'Restaurante Origem', type:'Foto',      sizeKB:126976, date:'2026-05-18', observations:'Fotos dos pratos novos do cardápio.' },
  { id:'9',  name:'reels-bastidores-cozinha.mp4', client:'Restaurante Origem', type:'Vídeo',     sizeKB:215040, date:'2026-05-22', observations:'Bastidores da cozinha para Reels.' },
  { id:'10', name:'logo-urbanfit-store.svg',      client:'Urban Fit Store',    type:'Logo',      sizeKB:310,    date:'2026-03-14', observations:'' },
  { id:'11', name:'campanha-inverno-2026.pdf',    client:'Urban Fit Store',    type:'Campanha',  sizeKB:2150,   date:'2026-05-10', observations:'Apresentação da campanha de inverno.' },
  { id:'12', name:'briefing-junho-urbanfit.pdf',  client:'Urban Fit Store',    type:'Briefing',  sizeKB:98,     date:'2026-05-19', observations:'' },
  { id:'13', name:'logo-bella-forma.svg',         client:'Studio Bella Forma', type:'Logo',      sizeKB:220,    date:'2026-02-20', observations:'' },
  { id:'14', name:'fotos-studio-abril.zip',       client:'Studio Bella Forma', type:'Foto',      sizeKB:57344,  date:'2026-04-05', observations:'Fotos de ensaio do studio — abril.' },
  { id:'15', name:'logo-odonto-prime.svg',        client:'Odonto Prime',       type:'Logo',      sizeKB:175,    date:'2026-01-12', observations:'' },
  { id:'16', name:'contrato-odonto-2025.pdf',     client:'Odonto Prime',       type:'Contrato',  sizeKB:290,    date:'2026-01-01', observations:'Contrato anual de serviços.' },
]

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

function getInitials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function fmtSize(kb) {
  if (!kb) return '0 KB'
  if (kb >= 1024 * 1024) return `${(kb / 1024 / 1024).toFixed(1)} GB`
  if (kb >= 1024)        return `${(kb / 1024).toFixed(1)} MB`
  return `${kb} KB`
}

function fmtDate(iso) {
  if (!iso) return '—'
  const [, m, d] = iso.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${Number(d)} ${months[Number(m)-1]}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BibliotecaPage() {
  const [clients,     setClients]     = useState([])
  const [files,       setFiles]       = useState([])
  const [loaded,      setLoaded]      = useState(false)
  const [search,      setSearch]      = useState('')
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [fileModal,   setFileModal]   = useState(false)
  const [folderModal, setFolderModal] = useState(false)
  const [toast,       setToast]       = useState(null)
  const menuRef = useRef(null)
  const router  = useRouter()

  // Load from localStorage
  useEffect(() => {
    try {
      const rawC = localStorage.getItem(LS_CLIENTS)
      const rawF = localStorage.getItem(LS_LIBRARY)
      setClients(rawC ? JSON.parse(rawC) : INITIAL_CLIENTS)
      setFiles(rawF ? JSON.parse(rawF) : INITIAL_FILES)
    } catch {
      setClients(INITIAL_CLIENTS)
      setFiles(INITIAL_FILES)
    }
    setLoaded(true)
  }, [])

  // Persist
  useEffect(() => { if (loaded) localStorage.setItem(LS_CLIENTS, JSON.stringify(clients)) }, [clients, loaded])
  useEffect(() => { if (loaded) localStorage.setItem(LS_LIBRARY, JSON.stringify(files))   }, [files,   loaded])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function h(e) { if (!menuRef.current?.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleNewFolder(name, color) {
    const next = { id: uid(), name, color, initials: getInitials(name), niche:'', plan:'Start', responsible:'', contents:0, status:'Ativo', instagram:'', whatsapp:'', email:'', observations:'' }
    setClients(prev => [...prev, next])
    setFolderModal(false)
    flash(`Pasta "${name}" criada!`)
    setTimeout(() => router.push(`/flow/biblioteca/${encodeURIComponent(name)}`), 400)
  }

  function handleNewFile(form) {
    setFiles(prev => [{ ...form, id: uid() }, ...prev])
    setFileModal(false)
    flash('Arquivo adicionado!')
  }

  const folders = useMemo(() => {
    return clients
      .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
      .map(c => {
        const cf       = files.filter(f => f.client === c.name)
        const totalKB  = cf.reduce((acc, f) => acc + (f.sizeKB || 0), 0)
        const lastDate = cf.length > 0 ? cf.reduce((l, f) => f.date > l ? f.date : l, '') : null
        return { ...c, fileCount: cf.length, totalKB, lastDate }
      })
  }, [clients, files, search])

  const totalFiles = files.length
  const totalSize  = files.reduce((acc, f) => acc + (f.sizeKB || 0), 0)

  return (
    <>
      <FlowHeader
        title="Biblioteca"
        subtitle={`${totalFiles} arquivos · ${fmtSize(totalSize)} total`}
        actions={
          <div style={{ position:'relative' }} ref={menuRef}>
            <button
              className="f-btn-primary"
              onClick={() => setMenuOpen(v => !v)}
              style={{ gap:6 }}
            >
              <Icon name="plus" size={14}/> <span>Novo</span>
            </button>

            {menuOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:6, minWidth:176, zIndex:300, boxShadow:'0 16px 48px rgba(0,0,0,0.6)', animation:'modalIn 0.15s ease' }}>
                <MenuItem
                  icon={<FolderSVG size={15} color="#FFD22E"/>}
                  label="Nova pasta"
                  sub="Criar pasta de cliente"
                  onClick={() => { setMenuOpen(false); setFolderModal(true) }}
                />
                <MenuItem
                  icon={<Icon name="upload" size={15}/>}
                  label="Enviar arquivo"
                  sub="Adicionar ao acervo"
                  onClick={() => { setMenuOpen(false); setFileModal(true) }}
                />
              </div>
            )}
          </div>
        }
      />

      <main className="f-content">
        {/* Search */}
        <div style={{ position:'relative' }}>
          <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--f-muted)', pointerEvents:'none' }}>
            <Icon name="search" size={14}/>
          </div>
          <input
            className="f-input"
            style={{ paddingLeft:36 }}
            placeholder="Buscar cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <span style={{ fontSize:12, color:'var(--f-muted)' }}>
          {folders.length} {folders.length === 1 ? 'pasta' : 'pastas'}
        </span>

        {/* Folder Grid */}
        {folders.length === 0 ? (
          <div className="f-empty-state" style={{ padding:'60px 20px' }}>
            <FolderSVG size={40} color="#A1A1AA"/>
            <h3 style={{ marginTop:12 }}>Nenhuma pasta encontrada</h3>
            <p>Crie uma nova pasta para começar.</p>
            <button className="f-btn-primary" style={{ marginTop:12 }} onClick={() => setFolderModal(true)}>
              <Icon name="plus" size={14}/> Nova pasta
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:14 }}>
            {folders.map(folder => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onClick={() => router.push(`/flow/biblioteca/${encodeURIComponent(folder.name)}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* New folder modal */}
      {folderModal && (
        <NewFolderModal
          existingNames={clients.map(c => c.name.toLowerCase())}
          onClose={() => setFolderModal(false)}
          onSave={handleNewFolder}
        />
      )}

      {/* New file modal */}
      {fileModal && (
        <FileFormModal
          clientNames={clients.map(c => c.name)}
          defaultClient={clients[0]?.name ?? ''}
          onClose={() => setFileModal(false)}
          onSave={handleNewFile}
        />
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:400, background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.35)', borderRadius:10, padding:'11px 18px', color:'#22C55E', fontSize:13, fontWeight:600, animation:'toastIn 0.2s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}
    </>
  )
}

// ─── Dropdown Menu Item ───────────────────────────────────────────────────────

function MenuItem({ icon, label, sub, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 12px', borderRadius:8, background: hov ? 'rgba(255,255,255,0.06)' : 'none', border:'none', cursor:'pointer', textAlign:'left', transition:'background 0.15s' }}
    >
      <div style={{ color:'var(--f-muted)', flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:'var(--f-muted)', marginTop:1 }}>{sub}</div>}
      </div>
    </button>
  )
}

// ─── Folder Card ──────────────────────────────────────────────────────────────

function FolderCard({ folder, onClick }) {
  const [hov, setHov] = useState(false)
  const color = folder.color ?? '#A1A1AA'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hov ? color + '50' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 16, padding: '20px 16px 16px', cursor: 'pointer',
        transition: 'all 0.18s ease', display: 'flex', flexDirection: 'column', gap: 12,
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 8px 28px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {/* Icon */}
      <div style={{ width:50, height:50, borderRadius:14, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <FolderSVG size={26} color={color}/>
      </div>

      {/* Info */}
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:5, lineHeight:1.3 }}>{folder.name}</div>
        <div style={{ fontSize:11, color:'var(--f-muted)', marginBottom:3 }}>
          {folder.fileCount} {folder.fileCount === 1 ? 'arquivo' : 'arquivos'}
        </div>
        <div style={{ fontSize:11, color:'var(--f-muted-dim)' }}>
          {fmtSize(folder.totalKB)}{folder.lastDate ? ` · ${fmtDate(folder.lastDate)}` : ''}
        </div>
      </div>

      {/* Open */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4, color }}>
        <span style={{ fontSize:11, fontWeight:600 }}>Abrir</span>
        <ChevronRightSVG size={13} color={color}/>
      </div>
    </div>
  )
}

// ─── New Folder Modal ─────────────────────────────────────────────────────────

function NewFolderModal({ existingNames, onClose, onSave }) {
  const [name,  setName]  = useState('')
  const [color, setColor] = useState(FOLDER_COLORS[0])
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80) }, [])

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Nome obrigatório'); return }
    if (existingNames.includes(name.trim().toLowerCase())) { setError('Já existe uma pasta com este nome'); return }
    onSave(name.trim(), color)
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(5px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'overlayIn 0.18s ease' }}
      onClick={onClose}
    >
      <div
        style={{ width:'100%', maxWidth:400, background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, boxShadow:'0 32px 96px rgba(0,0,0,0.7)', animation:'modalIn 0.22s cubic-bezier(.4,0,.2,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'20px 22px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`${color}20`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FolderSVG size={18} color={color}/>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:'#fff', margin:0 }}>Nova pasta</h2>
              <p style={{ fontSize:11, color:'#A1A1AA', margin:'2px 0 0' }}>Criar pasta de cliente</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#A1A1AA', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="xmark" size={16}/>
          </button>
        </div>

        <form onSubmit={submit} style={{ padding:'20px 22px 22px', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Name */}
          <div>
            <label className="f-field-label">Nome da pasta *</label>
            <input
              ref={inputRef}
              className={`f-input ${error ? 'has-error' : ''}`}
              value={name}
              onChange={e => { setName(e.target.value); setError(null) }}
              placeholder="Ex: Nova Marca"
            />
            {error && <span className="f-field-error">{error}</span>}
          </div>

          {/* Color picker */}
          <div>
            <label className="f-field-label">Cor da pasta</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {FOLDER_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ width:28, height:28, borderRadius:8, background:c, border: color === c ? `3px solid #fff` : '3px solid transparent', cursor:'pointer', transition:'border 0.15s', flexShrink:0 }}
                />
              ))}
            </div>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" className="f-btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="f-btn-primary">
              <Icon name="plus" size={14}/> Criar pasta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── File Form Modal ──────────────────────────────────────────────────────────

function FileFormModal({ clientNames, defaultClient, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', client: defaultClient, type: 'Logo',
    sizeKB: '', date: new Date().toISOString().slice(0,10), observations: '',
  })
  const [errors, setErrors] = useState({})
  const firstRef = useRef(null)

  useEffect(() => { setTimeout(() => firstRef.current?.focus(), 80) }, [])

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function submit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nome obrigatório'
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ ...form, sizeKB: Number(form.sizeKB) || 0 })
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(5px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'overlayIn 0.18s ease' }}
      onClick={onClose}
    >
      <div
        style={{ width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, boxShadow:'0 32px 96px rgba(0,0,0,0.7)', animation:'modalIn 0.22s cubic-bezier(.4,0,.2,1)', scrollbarWidth:'thin' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding:'20px 22px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, position:'sticky', top:0, background:'#232323', zIndex:1 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>Adicionar Arquivo</h2>
            <p style={{ fontSize:12, color:'#A1A1AA', margin:'3px 0 0' }}>Preencha os dados do arquivo.</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#A1A1AA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon name="xmark" size={16}/>
          </button>
        </div>

        <div style={{ margin:'16px 22px 0', padding:'12px 14px', background:'rgba(255,210,46,0.06)', border:'1px solid rgba(255,210,46,0.2)', borderRadius:10, display:'flex', alignItems:'center', gap:10 }}>
          <Icon name="upload" size={16} style={{ color:'#FFD22E', flexShrink:0 }}/>
          <span style={{ fontSize:12, color:'#A1A1AA' }}>Upload real será habilitado em breve. Preencha os dados manualmente por ora.</span>
        </div>

        <form onSubmit={submit} style={{ padding:'16px 22px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          <FField label="Nome do arquivo *" error={errors.name}>
            <input ref={firstRef} className={`f-input ${errors.name ? 'has-error' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: logo-cliente.svg"/>
          </FField>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FField label="Cliente">
              <select className="f-select" value={form.client} onChange={e => set('client', e.target.value)}>
                {clientNames.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FField>
            <FField label="Tipo">
              <select className="f-select" value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FField>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FField label="Tamanho (KB)">
              <input className="f-input" type="number" min="0" value={form.sizeKB} onChange={e => set('sizeKB', e.target.value)} placeholder="Ex: 2048"/>
            </FField>
            <FField label="Data">
              <input className="f-input" type="date" value={form.date} onChange={e => set('date', e.target.value)}/>
            </FField>
          </div>

          <FField label="Observações">
            <textarea className="f-input" value={form.observations} onChange={e => set('observations', e.target.value)} placeholder="Anotações sobre o arquivo..." rows={3} style={{ resize:'vertical', minHeight:68 }}/>
          </FField>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" className="f-btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="f-btn-primary">
              <Icon name="upload" size={14}/> Adicionar arquivo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FField({ label, error, children }) {
  return (
    <div>
      <label className="f-field-label">{label}</label>
      {children}
      {error && <span className="f-field-error">{error}</span>}
    </div>
  )
}

// ─── SVG helpers ──────────────────────────────────────────────────────────────

function FolderSVG({ size = 24, color = '#A1A1AA' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function ChevronRightSVG({ size = 14, color = '#A1A1AA' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}
