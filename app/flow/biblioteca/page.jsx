'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import FlowHeader from '@/components/flow/FlowHeader'
import Icon from '@/components/flow/FlowIcons'

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = 'bbold_flow_library'

const CLIENTS   = ['Academia Alpha','Clínica Essenza','Restaurante Origem','Urban Fit Store','Studio Bella Forma','Odonto Prime']
const TYPES     = ['Logo','Brandbook','Foto','Vídeo','Contrato','Briefing','Campanha']
const SORT_OPTS = ['Mais recentes','Mais antigos','Nome A-Z','Nome Z-A','Maior tamanho','Menor tamanho']

const TYPE_ICON  = { Logo:'star', Brandbook:'doc', Foto:'image', Vídeo:'video', Contrato:'lock', Briefing:'file', Campanha:'zap' }
const TYPE_COLOR = { Logo:'#FFD22E', Brandbook:'#3B82F6', Foto:'#22C55E', Vídeo:'#8B5CF6', Contrato:'#EF4444', Briefing:'#F59E0B', Campanha:'#EC4899' }

const INITIAL_FILES = [
  { id:'1',  name:'logo-academia-alpha.svg',      client:'Academia Alpha',     type:'Logo',      sizeKB:240,      date:'2026-05-15', observations:'Logo principal em SVG vetorial.' },
  { id:'2',  name:'brandbook-alpha-2025.pdf',     client:'Academia Alpha',     type:'Brandbook', sizeKB:4300,     date:'2026-01-10', observations:'Manual de identidade visual completo.' },
  { id:'3',  name:'fotos-estudio-abril.zip',      client:'Academia Alpha',     type:'Foto',      sizeKB:89088,    date:'2026-04-02', observations:'Pack de fotos do estúdio — sessão de abril.' },
  { id:'4',  name:'logo-essenza-principal.svg',   client:'Clínica Essenza',    type:'Logo',      sizeKB:180,      date:'2026-03-08', observations:'' },
  { id:'5',  name:'contrato-essenza-2025.pdf',    client:'Clínica Essenza',    type:'Contrato',  sizeKB:320,      date:'2026-01-01', observations:'Contrato de prestação de serviços 2025.' },
  { id:'6',  name:'briefing-junho-essenza.pdf',   client:'Clínica Essenza',    type:'Briefing',  sizeKB:156,      date:'2026-05-20', observations:'Briefing para campanha de junho.' },
  { id:'7',  name:'logo-origem-vetor.svg',        client:'Restaurante Origem', type:'Logo',      sizeKB:95,       date:'2026-02-05', observations:'' },
  { id:'8',  name:'fotos-restaurante-maio.zip',   client:'Restaurante Origem', type:'Foto',      sizeKB:126976,   date:'2026-05-18', observations:'Fotos dos pratos novos do cardápio.' },
  { id:'9',  name:'reels-bastidores-cozinha.mp4', client:'Restaurante Origem', type:'Vídeo',     sizeKB:215040,   date:'2026-05-22', observations:'Bastidores da cozinha para Reels.' },
  { id:'10', name:'logo-urbanfit-store.svg',      client:'Urban Fit Store',    type:'Logo',      sizeKB:310,      date:'2026-03-14', observations:'' },
  { id:'11', name:'campanha-inverno-2026.pdf',    client:'Urban Fit Store',    type:'Campanha',  sizeKB:2150,     date:'2026-05-10', observations:'Apresentação da campanha de inverno.' },
  { id:'12', name:'briefing-junho-urbanfit.pdf',  client:'Urban Fit Store',    type:'Briefing',  sizeKB:98,       date:'2026-05-19', observations:'' },
  { id:'13', name:'logo-bella-forma.svg',         client:'Studio Bella Forma', type:'Logo',      sizeKB:220,      date:'2026-02-20', observations:'' },
  { id:'14', name:'fotos-studio-abril.zip',       client:'Studio Bella Forma', type:'Foto',      sizeKB:57344,    date:'2026-04-05', observations:'Fotos de ensaio do studio — abril.' },
  { id:'15', name:'logo-odonto-prime.svg',        client:'Odonto Prime',       type:'Logo',      sizeKB:175,      date:'2026-01-12', observations:'' },
  { id:'16', name:'contrato-odonto-2025.pdf',     client:'Odonto Prime',       type:'Contrato',  sizeKB:290,      date:'2026-01-01', observations:'Contrato anual de serviços.' },
]

function uid()  { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

function fmtSize(kb) {
  if (!kb) return '—'
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

const selectStyle = {
  backgroundColor:'#1E1E1E',
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23FFD22E' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center',
  border:'1px solid rgba(255,210,46,0.25)', borderRadius:8,
  color:'var(--f-text)', fontSize:13, padding:'7px 28px 7px 10px',
  cursor:'pointer', outline:'none', width:'100%',
  appearance:'none', WebkitAppearance:'none',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BibliotecaPage() {
  const [files,    setFiles]    = useState([])
  const [loaded,   setLoaded]   = useState(false)
  const [search,   setSearch]   = useState('')
  const [fClient,  setFClient]  = useState('')
  const [fType,    setFType]    = useState('')
  const [sort,     setSort]     = useState('Mais recentes')
  const [modalOpen,setModalOpen]= useState(false)
  const [editing,  setEditing]  = useState(null)
  const [viewing,  setViewing]  = useState(null)
  const [delTarget,setDelTarget]= useState(null)
  const [toast,    setToast]    = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      setFiles(raw ? JSON.parse(raw) : INITIAL_FILES)
    } catch { setFiles(INITIAL_FILES) }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(LS_KEY, JSON.stringify(files))
  }, [files, loaded])

  function flash(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function handleSave(form) {
    if (editing) {
      setFiles(prev => prev.map(f => f.id === editing.id ? { ...f, ...form } : f))
      flash('Arquivo atualizado!')
    } else {
      setFiles(prev => [{ ...form, id: uid() }, ...prev])
      flash('Arquivo adicionado!')
    }
    setModalOpen(false); setEditing(null)
  }

  function handleDelete(file) {
    setFiles(prev => prev.filter(f => f.id !== file.id))
    setDelTarget(null)
    flash('Arquivo removido.', 'warn')
  }

  function handleDownload(file) {
    flash(`Iniciando download: ${file.name}`)
  }

  const filtered = useMemo(() => {
    let list = files.filter(f => {
      if (fClient && f.client !== fClient) return false
      if (fType   && f.type   !== fType)   return false
      if (search) {
        const q = search.toLowerCase()
        return f.name.toLowerCase().includes(q) ||
               f.client.toLowerCase().includes(q) ||
               f.type.toLowerCase().includes(q)
      }
      return true
    })

    list = [...list].sort((a, b) => {
      if (sort === 'Mais recentes') return (b.date || '').localeCompare(a.date || '')
      if (sort === 'Mais antigos')  return (a.date || '').localeCompare(b.date || '')
      if (sort === 'Nome A-Z')      return a.name.localeCompare(b.name)
      if (sort === 'Nome Z-A')      return b.name.localeCompare(a.name)
      if (sort === 'Maior tamanho') return (b.sizeKB || 0) - (a.sizeKB || 0)
      if (sort === 'Menor tamanho') return (a.sizeKB || 0) - (b.sizeKB || 0)
      return 0
    })

    return list
  }, [files, fClient, fType, sort, search])

  const hasFilters = fClient || fType || search

  return (
    <>
      <FlowHeader
        title="Biblioteca"
        subtitle="Organize logos, fotos, vídeos, documentos e materiais de todos os clientes."
        actions={
          <button className="f-btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
            <Icon name="upload" size={14}/> <span>Enviar Arquivo</span>
          </button>
        }
      />

      <main className="f-content">

        {/* Filters */}
        <div className="f-filter-row" style={{ gridTemplateColumns:'1fr 1fr 1fr' }}>
          <select style={selectStyle} value={fClient} onChange={e => setFClient(e.target.value)}>
            <option value="">Todos os clientes</option>
            {CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={selectStyle} value={fType} onChange={e => setFType(e.target.value)}>
            <option value="">Todos os tipos</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select style={selectStyle} value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Search */}
        <div style={{ position:'relative' }}>
          <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--f-muted)', pointerEvents:'none' }}>
            <Icon name="search" size={14}/>
          </div>
          <input
            className="f-input"
            style={{ paddingLeft:36 }}
            placeholder="Buscar por nome, cliente ou tipo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Count + clear */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, color:'var(--f-muted)' }}>
            {filtered.length} arquivo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </span>
          {hasFilters && (
            <button className="f-btn-ghost" style={{ fontSize:12 }} onClick={() => { setFClient(''); setFType(''); setSearch('') }}>
              Limpar filtros
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="f-empty-state" style={{ padding:'60px 20px' }}>
            <Icon name="folder" size={40}/>
            <h3>Nenhum arquivo encontrado</h3>
            <p>Envie um arquivo ou ajuste os filtros.</p>
            <button className="f-btn-primary" style={{ marginTop:12 }} onClick={() => { setEditing(null); setModalOpen(true) }}>
              <Icon name="upload" size={14}/> Enviar Arquivo
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
            {filtered.map(file => (
              <FileCard
                key={file.id}
                file={file}
                onView={() => setViewing(file)}
                onEdit={() => { setEditing(file); setModalOpen(true) }}
                onDownload={() => handleDownload(file)}
                onDelete={() => setDelTarget(file)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Upload / Edit modal */}
      {modalOpen && (
        <FileFormModal
          editing={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}

      {/* Detail modal */}
      {viewing && (
        <FileDetailModal
          file={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); setModalOpen(true) }}
          onDownload={() => handleDownload(viewing)}
        />
      )}

      {/* Delete confirmation */}
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
                <div style={{ fontWeight:700, color:'#fff', fontSize:15 }}>Excluir arquivo?</div>
                <div style={{ fontSize:12, color:'#A1A1AA', marginTop:2 }}>Esta ação não pode ser desfeita.</div>
              </div>
            </div>
            <p style={{ fontSize:13, color:'#A1A1AA', marginBottom:20, lineHeight:1.5 }}>
              "<strong style={{ color:'#fff' }}>{delTarget.name}</strong>" será removido permanentemente.
            </p>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="f-btn-ghost" onClick={() => setDelTarget(null)}>Cancelar</button>
              <button
                onClick={() => handleDelete(delTarget)}
                style={{ padding:'7px 16px', borderRadius:8, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#EF4444', cursor:'pointer', fontWeight:600, fontSize:13, fontFamily:'var(--f-font)' }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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

// ─── File Card ────────────────────────────────────────────────────────────────

function FileCard({ file, onView, onEdit, onDownload, onDelete }) {
  const color = TYPE_COLOR[file.type] || '#A1A1AA'
  const icon  = TYPE_ICON[file.type]  || 'file'

  return (
    <div
      style={{ background:'var(--f-card)', border:'1px solid var(--f-border)', borderRadius:12, overflow:'hidden', cursor:'pointer', transition:'background 0.15s, transform 0.15s, box-shadow 0.15s' }}
      onClick={onView}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
    >
      {/* Preview */}
      <div style={{ height:76, background:`${color}12`, borderBottom:'1px solid var(--f-border)', display:'flex', alignItems:'center', justifyContent:'center', color, position:'relative' }}>
        <Icon name={icon} size={30}/>
        <span style={{ position:'absolute', top:8, right:8, fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:5, background:`${color}20`, border:`1px solid ${color}30`, color }}>
          {file.type}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding:'10px 12px 8px' }}>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--f-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>
          {file.name}
        </div>
        <div style={{ fontSize:11, color:'var(--f-muted)', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {file.client}
        </div>
        <div style={{ fontSize:10, color:'var(--f-muted-dim)' }}>
          {fmtSize(file.sizeKB)} · {fmtDate(file.date)}
        </div>
      </div>

      {/* Actions — stop propagation */}
      <div
        style={{ borderTop:'1px solid var(--f-border)', padding:'6px 8px', display:'flex', gap:4, justifyContent:'flex-end' }}
        onClick={e => e.stopPropagation()}
      >
        <ActionIcon icon="eye"      title="Visualizar" onClick={onView}/>
        <ActionIcon icon="download" title="Baixar"     onClick={onDownload}/>
        <ActionIcon icon="edit"     title="Editar"     onClick={onEdit}/>
        <ActionIcon icon="trash"    title="Excluir"    onClick={onDelete} danger/>
      </div>
    </div>
  )
}

function ActionIcon({ icon, title, onClick, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{ width:28, height:28, borderRadius:7, background:'rgba(255,255,255,0.04)', border:'1px solid var(--f-border)', color:'var(--f-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s, color 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = danger ? '#EF4444' : '#fff' }}
      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}
    >
      <Icon name={icon} size={13}/>
    </button>
  )
}

// ─── File Detail Modal ────────────────────────────────────────────────────────

function FileDetailModal({ file, onClose, onEdit, onDownload }) {
  const color = TYPE_COLOR[file.type] || '#A1A1AA'
  const icon  = TYPE_ICON[file.type]  || 'file'

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center', animation:'overlayIn 0.18s ease' }}
      onClick={onClose}
    >
      <div
        style={{ width:'100%', maxWidth:540, background:'#1E1E1E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px 20px 0 0', boxShadow:'0 -24px 80px rgba(0,0,0,0.6)', animation:'slideUp 0.28s cubic-bezier(.4,0,.2,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:36, height:4, borderRadius:99, background:'rgba(255,255,255,0.15)' }}/>
        </div>

        {/* Preview area */}
        <div style={{ height:100, background:`${color}10`, borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', color }}>
          <Icon name={icon} size={40}/>
        </div>

        {/* Content */}
        <div style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:16 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:4 }}>{file.name}</div>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, color, background:`${color}18`, border:`1px solid ${color}30` }}>{file.type}</span>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#A1A1AA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="xmark" size={16}/>
            </button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            <DetailInfo label="Cliente"  value={file.client}/>
            <DetailInfo label="Tipo"     value={file.type}/>
            <DetailInfo label="Tamanho"  value={fmtSize(file.sizeKB)}/>
            <DetailInfo label="Data"     value={fmtDate(file.date)}/>
          </div>

          {file.observations && (
            <div style={{ marginBottom:16 }}>
              <span style={{ display:'block', fontSize:10, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Observações</span>
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 12px', fontSize:13, color:'var(--f-muted)', lineHeight:1.6 }}>
                {file.observations}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 22px 32px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="f-btn-ghost" onClick={onClose}>Fechar</button>
          <button className="f-btn-ghost" onClick={onEdit} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Icon name="edit" size={13}/> Editar
          </button>
          <button
            onClick={onDownload}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, background:'rgba(255,210,46,0.12)', border:'1px solid rgba(255,210,46,0.3)', color:'#FFD22E', cursor:'pointer', fontWeight:600, fontSize:13, fontFamily:'var(--f-font)' }}
          >
            <Icon name="download" size={14}/> Baixar
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailInfo({ label, value }) {
  return (
    <div>
      <span style={{ display:'block', fontSize:10, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:600, color:'var(--f-text)' }}>{value || '—'}</span>
    </div>
  )
}

// ─── File Form Modal (upload / edit) ─────────────────────────────────────────

function FileFormModal({ editing, onClose, onSave }) {
  const [form, setForm] = useState({
    name: editing?.name || '',
    client: editing?.client || 'Academia Alpha',
    type: editing?.type || 'Logo',
    sizeKB: editing?.sizeKB || '',
    date: editing?.date || new Date().toISOString().slice(0,10),
    observations: editing?.observations || '',
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
        {/* Header */}
        <div style={{ padding:'20px 22px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, position:'sticky', top:0, background:'#232323', zIndex:1 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>{editing ? 'Editar Arquivo' : 'Adicionar Arquivo'}</h2>
            <p style={{ fontSize:12, color:'#A1A1AA', margin:'3px 0 0' }}>
              {editing ? 'Atualize as informações do arquivo.' : 'Preencha os dados do arquivo a ser catalogado.'}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#A1A1AA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon name="xmark" size={16}/>
          </button>
        </div>

        {!editing && (
          <div style={{ margin:'16px 22px 0', padding:'12px 14px', background:'rgba(255,210,46,0.06)', border:'1px solid rgba(255,210,46,0.2)', borderRadius:10, display:'flex', alignItems:'center', gap:10 }}>
            <Icon name="upload" size={16} style={{ color:'#FFD22E', flexShrink:0 }}/>
            <span style={{ fontSize:12, color:'#A1A1AA' }}>Upload real de arquivos será habilitado em breve. Preencha os dados manualmente por ora.</span>
          </div>
        )}

        <form onSubmit={submit} style={{ padding:'16px 22px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          <FField label="Nome do arquivo *" error={errors.name}>
            <input ref={firstRef} className={`f-input ${errors.name ? 'has-error' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: logo-cliente.svg"/>
          </FField>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FField label="Cliente">
              <select className="f-select" value={form.client} onChange={e => set('client', e.target.value)}>
                {CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FField>
            <FField label="Tipo">
              <select className="f-select" value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FField>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FField label="Tamanho (em KB)">
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
              <Icon name={editing ? 'check' : 'upload'} size={14}/>
              {editing ? 'Salvar alterações' : 'Adicionar arquivo'}
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
