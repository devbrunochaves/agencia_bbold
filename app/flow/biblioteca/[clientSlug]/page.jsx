'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import FlowHeader from '@/components/flow/FlowHeader'
import Icon from '@/components/flow/FlowIcons'

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY        = 'bbold_flow_library'
const LS_CLIENTS    = 'bbold_flow_clients'
const LS_SUBFOLDERS = 'bbold_flow_subfolders'

const FALLBACK_CLIENTS = ['Academia Alpha','Clínica Essenza','Restaurante Origem','Urban Fit Store','Studio Bella Forma','Odonto Prime']
const TYPES     = ['Logo','Brandbook','Foto','Vídeo','Contrato','Briefing','Campanha']
const SORT_OPTS = ['Mais recentes','Mais antigos','Nome A-Z','Nome Z-A','Maior tamanho','Menor tamanho']
const FOLDER_COLORS = ['#FFD22E','#3B82F6','#22C55E','#8B5CF6','#F59E0B','#EF4444','#06B6D4','#EC4899']

const TYPE_ICON  = { Logo:'star', Brandbook:'doc', Foto:'image', Vídeo:'video', Contrato:'lock', Briefing:'file', Campanha:'zap' }
const TYPE_COLOR = { Logo:'#FFD22E', Brandbook:'#3B82F6', Foto:'#22C55E', Vídeo:'#8B5CF6', Contrato:'#EF4444', Briefing:'#F59E0B', Campanha:'#EC4899' }

const CLIENT_COLOR = {
  'Academia Alpha':'#FFD22E','Clínica Essenza':'#22C55E','Restaurante Origem':'#F59E0B',
  'Urban Fit Store':'#3B82F6','Studio Bella Forma':'#EC4899','Odonto Prime':'#EF4444',
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

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

export default function ClientBibliotecaPage() {
  const params      = useParams()
  const router      = useRouter()
  const clientName  = decodeURIComponent(params.clientSlug)
  const clientColor = CLIENT_COLOR[clientName] ?? '#A1A1AA'

  const [files,       setFiles]       = useState([])
  const [subfolders,  setSubfolders]  = useState([])
  const [clientNames, setClientNames] = useState(FALLBACK_CLIENTS)
  const [loaded,      setLoaded]      = useState(false)
  const [search,      setSearch]      = useState('')
  const [fType,       setFType]       = useState('')
  const [sort,        setSort]        = useState('Mais recentes')
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [fileModal,   setFileModal]   = useState(false)
  const [folderModal, setFolderModal] = useState(false)
  const [renamingSf,  setRenamingSf]  = useState(null)
  const [deletingSf,  setDeletingSf]  = useState(null)
  const [editing,     setEditing]     = useState(null)
  const [viewing,     setViewing]     = useState(null)
  const [delTarget,   setDelTarget]   = useState(null)
  const [toast,       setToast]       = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    try {
      const rawF  = localStorage.getItem(LS_KEY)
      const rawC  = localStorage.getItem(LS_CLIENTS)
      const rawSF = localStorage.getItem(LS_SUBFOLDERS)
      setFiles(rawF ? JSON.parse(rawF) : [])
      setSubfolders(rawSF ? JSON.parse(rawSF) : [])
      if (rawC) setClientNames(JSON.parse(rawC).map(c => c.name))
    } catch { setFiles([]) }
    setLoaded(true)
  }, [])

  useEffect(() => { if (loaded) localStorage.setItem(LS_KEY,        JSON.stringify(files))      }, [files,      loaded])
  useEffect(() => { if (loaded) localStorage.setItem(LS_SUBFOLDERS, JSON.stringify(subfolders)) }, [subfolders, loaded])

  useEffect(() => {
    if (!menuOpen) return
    function h(e) { if (!menuRef.current?.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  function flash(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function handleSaveFile(form) {
    if (editing) {
      setFiles(prev => prev.map(f => f.id === editing.id ? { ...f, ...form } : f))
      flash('Arquivo atualizado!')
    } else {
      setFiles(prev => [{ ...form, id: uid(), subfolder: '' }, ...prev])
      flash('Arquivo adicionado!')
    }
    setFileModal(false); setEditing(null)
  }

  function handleNewSubfolder(name, color) {
    const next = { id: uid(), client: clientName, name, color }
    setSubfolders(prev => [...prev, next])
    setFolderModal(false)
    flash(`Pasta "${name}" criada!`)
  }

  function handleRenameSf(sf, newName) {
    setSubfolders(prev => prev.map(s => s.id === sf.id ? { ...s, name: newName } : s))
    setFiles(prev => prev.map(f => f.client === clientName && f.subfolder === sf.name ? { ...f, subfolder: newName } : f))
    setRenamingSf(null)
    flash(`Pasta renomeada para "${newName}"!`)
  }

  function handleDeleteSf(sf) {
    setFiles(prev => prev.map(f => f.client === clientName && f.subfolder === sf.name ? { ...f, subfolder: '' } : f))
    setSubfolders(prev => prev.filter(s => s.id !== sf.id))
    setDeletingSf(null)
    flash(`Pasta "${sf.name}" excluída.`, 'warn')
  }

  function handleShareSf(sf) {
    const url = `${window.location.origin}/flow/biblioteca/${encodeURIComponent(clientName)}/${encodeURIComponent(sf.name)}`
    navigator.clipboard.writeText(url).catch(() => {})
    flash('Link copiado para a área de transferência!')
  }

  function handleDelete(file) {
    setFiles(prev => prev.filter(f => f.id !== file.id))
    setDelTarget(null)
    flash('Arquivo removido.', 'warn')
  }

  function handleDownload(file) { flash(`Download: ${file.name}`) }

  const clientSubfolders = subfolders.filter(s => s.client === clientName)

  const rootFiles = useMemo(() => {
    let list = files.filter(f => {
      if (f.client !== clientName) return false
      if (f.subfolder)             return false
      if (fType && f.type !== fType) return false
      if (search) {
        const q = search.toLowerCase()
        return f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q)
      }
      return true
    })
    return [...list].sort((a, b) => {
      if (sort === 'Mais recentes') return (b.date || '').localeCompare(a.date || '')
      if (sort === 'Mais antigos')  return (a.date || '').localeCompare(b.date || '')
      if (sort === 'Nome A-Z')      return a.name.localeCompare(b.name)
      if (sort === 'Nome Z-A')      return b.name.localeCompare(a.name)
      if (sort === 'Maior tamanho') return (b.sizeKB || 0) - (a.sizeKB || 0)
      if (sort === 'Menor tamanho') return (a.sizeKB || 0) - (b.sizeKB || 0)
      return 0
    })
  }, [files, clientName, fType, sort, search])

  const clientFiles = files.filter(f => f.client === clientName)
  const totalKB     = clientFiles.reduce((acc, f) => acc + (f.sizeKB || 0), 0)

  const hasContent = clientSubfolders.length > 0 || rootFiles.length > 0

  return (
    <>
      <FlowHeader
        title={clientName}
        subtitle={`${clientFiles.length} arquivos · ${fmtSize(totalKB)}`}
        actions={
          <div style={{ position:'relative' }} ref={menuRef}>
            <button className="f-btn-primary" onClick={() => setMenuOpen(v => !v)} style={{ gap:6 }}>
              <Icon name="plus" size={14}/> <span>Novo</span>
            </button>
            {menuOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:6, minWidth:190, zIndex:300, boxShadow:'0 16px 48px rgba(0,0,0,0.6)', animation:'modalIn 0.15s ease' }}>
                <DropItem
                  icon={<FolderSVG size={15} color={clientColor}/>}
                  label="Nova pasta"
                  sub="Criar subpasta aqui"
                  onClick={() => { setMenuOpen(false); setFolderModal(true) }}
                />
                <DropItem
                  icon={<Icon name="upload" size={15}/>}
                  label="Enviar arquivo"
                  sub="Adicionar à raiz"
                  onClick={() => { setMenuOpen(false); setEditing(null); setFileModal(true) }}
                />
              </div>
            )}
          </div>
        }
      />

      <main className="f-content">
        {/* Back */}
        <button
          onClick={() => router.push('/flow/biblioteca')}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'var(--f-muted)', fontSize:12, fontFamily:'var(--f-font)', padding:0, alignSelf:'flex-start' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = ''}
        >
          <BackArrowSVG size={14}/> Biblioteca
        </button>

        {/* Accent bar */}
        <div style={{ height:3, borderRadius:4, background:`linear-gradient(90deg, ${clientColor}, ${clientColor}40)`, marginBottom:4 }}/>

        {/* Filters */}
        <div className="f-filter-row" style={{ gridTemplateColumns:'1fr 1fr' }}>
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
          <input className="f-input" style={{ paddingLeft:36 }} placeholder="Buscar por nome ou tipo..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>

        {/* Empty state */}
        {!hasContent && (
          <div className="f-empty-state" style={{ padding:'60px 20px' }}>
            <FolderSVG size={40} color="#A1A1AA"/>
            <h3>Pasta vazia</h3>
            <p>Crie uma subpasta ou adicione arquivos.</p>
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:12 }}>
              <button className="f-btn-ghost" onClick={() => setFolderModal(true)}>
                <Icon name="plus" size={13}/> Nova pasta
              </button>
              <button className="f-btn-primary" onClick={() => setFileModal(true)}>
                <Icon name="upload" size={13}/> Arquivo
              </button>
            </div>
          </div>
        )}

        {/* Subfolders */}
        {clientSubfolders.length > 0 && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>
              Pastas · {clientSubfolders.length}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:12 }}>
              {clientSubfolders.map(sf => {
                const sfFiles = files.filter(f => f.client === clientName && f.subfolder === sf.name)
                return (
                  <SubfolderCard
                    key={sf.id}
                    subfolder={sf}
                    fileCount={sfFiles.length}
                    onClick={() => router.push(`/flow/biblioteca/${encodeURIComponent(clientName)}/${encodeURIComponent(sf.name)}`)}
                    onRename={() => setRenamingSf(sf)}
                    onDelete={() => setDeletingSf(sf)}
                    onShare={() => handleShareSf(sf)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Root files */}
        {rootFiles.length > 0 && (
          <div>
            {clientSubfolders.length > 0 && (
              <div style={{ fontSize:11, fontWeight:700, color:'var(--f-muted-dim)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>
                Arquivos na raiz · {rootFiles.length}
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
              {rootFiles.map(file => (
                <FileCard
                  key={file.id}
                  file={file}
                  onView={() => setViewing(file)}
                  onEdit={() => { setEditing(file); setFileModal(true) }}
                  onDownload={() => handleDownload(file)}
                  onDelete={() => setDelTarget(file)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Rename subfolder modal */}
      {renamingSf && (
        <RenameFolderModal
          current={renamingSf}
          onClose={() => setRenamingSf(null)}
          onSave={(newName) => handleRenameSf(renamingSf, newName)}
        />
      )}

      {/* Delete subfolder confirmation */}
      {deletingSf && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(5px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={() => setDeletingSf(null)}>
          <div style={{ background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, maxWidth:360, width:'100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(239,68,68,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#EF4444', flexShrink:0 }}>
                <Icon name="trash" size={18}/>
              </div>
              <div>
                <div style={{ fontWeight:700, color:'#fff', fontSize:15 }}>Excluir pasta?</div>
                <div style={{ fontSize:12, color:'#A1A1AA', marginTop:2 }}>Os arquivos serão movidos para a raiz.</div>
              </div>
            </div>
            <p style={{ fontSize:13, color:'#A1A1AA', marginBottom:20, lineHeight:1.5 }}>
              A pasta "<strong style={{ color:'#fff' }}>{deletingSf.name}</strong>" será excluída. Os arquivos dentro dela serão mantidos na raiz do cliente.
            </p>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="f-btn-ghost" onClick={() => setDeletingSf(null)}>Cancelar</button>
              <button onClick={() => handleDeleteSf(deletingSf)} style={{ padding:'7px 16px', borderRadius:8, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#EF4444', cursor:'pointer', fontWeight:600, fontSize:13, fontFamily:'var(--f-font)' }}>Excluir pasta</button>
            </div>
          </div>
        </div>
      )}

      {/* New subfolder modal */}
      {folderModal && (
        <NewSubfolderModal
          onClose={() => setFolderModal(false)}
          onSave={handleNewSubfolder}
        />
      )}

      {/* File modal */}
      {fileModal && (
        <FileFormModal
          editing={editing}
          defaultClient={clientName}
          clientNames={clientNames}
          onClose={() => { setFileModal(false); setEditing(null) }}
          onSave={handleSaveFile}
        />
      )}

      {/* Detail modal */}
      {viewing && (
        <FileDetailModal
          file={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); setFileModal(true) }}
          onDownload={() => handleDownload(viewing)}
        />
      )}

      {/* Delete confirmation */}
      {delTarget && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(5px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={() => setDelTarget(null)}>
          <div style={{ background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, maxWidth:360, width:'100%' }} onClick={e => e.stopPropagation()}>
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
              <button onClick={() => handleDelete(delTarget)} style={{ padding:'7px 16px', borderRadius:8, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#EF4444', cursor:'pointer', fontWeight:600, fontSize:13, fontFamily:'var(--f-font)' }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:300, background: toast.type === 'warn' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', border:`1px solid ${toast.type === 'warn' ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.35)'}`, borderRadius:10, padding:'11px 18px', color: toast.type === 'warn' ? '#EF4444' : '#22C55E', fontSize:13, fontWeight:600, animation:'toastIn 0.2s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}

// ─── Subfolder Card ───────────────────────────────────────────────────────────

function SubfolderCard({ subfolder, fileCount, onClick, onRename, onDelete, onShare }) {
  const [hov,      setHov]      = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const color = subfolder.color ?? '#A1A1AA'

  useEffect(() => {
    if (!menuOpen) return
    function h(e) { if (!menuRef.current?.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ position:'relative', background: hov ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', border:`1px solid ${hov ? color + '50' : 'rgba(255,255,255,0.08)'}`, borderRadius:14, padding:'16px 14px', cursor:'pointer', transition:'all 0.18s ease', display:'flex', flexDirection:'column', gap:10, transform: hov ? 'translateY(-2px)' : 'none' }}
    >
      {/* Three dots button */}
      <div
        ref={menuRef}
        style={{ position:'absolute', top:8, right:8, zIndex:10 }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setMenuOpen(v => !v)}
          style={{ width:28, height:28, borderRadius:8, background: menuOpen ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.35)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', opacity: hov || menuOpen ? 1 : 0, transition:'opacity 0.15s' }}
        >
          <DotsVerticalSVG size={14}/>
        </button>
        {menuOpen && (
          <div style={{ position:'absolute', top:'calc(100% + 4px)', right:0, background:'#232323', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:6, minWidth:160, zIndex:300, boxShadow:'0 8px 32px rgba(0,0,0,0.6)', animation:'modalIn 0.15s ease' }}>
            <SfMenuItem icon="edit"  label="Renomear"     onClick={() => { setMenuOpen(false); onRename() }}/>
            <SfMenuItem icon="share" label="Compartilhar" onClick={() => { setMenuOpen(false); onShare() }}/>
            <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'4px 2px' }}/>
            <SfMenuItem icon="trash" label="Excluir" danger onClick={() => { setMenuOpen(false); onDelete() }}/>
          </div>
        )}
      </div>

      <div style={{ width:42, height:42, borderRadius:12, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <FolderSVG size={22} color={color}/>
      </div>
      <div>
        <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:3, lineHeight:1.3 }}>{subfolder.name}</div>
        <div style={{ fontSize:11, color:'var(--f-muted)' }}>{fileCount} {fileCount === 1 ? 'arquivo' : 'arquivos'}</div>
      </div>
    </div>
  )
}

function SfMenuItem({ icon, label, danger, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', borderRadius:7, background: hov ? 'rgba(255,255,255,0.06)' : 'none', border:'none', cursor:'pointer', color: danger ? (hov ? '#EF4444' : '#A1A1AA') : (hov ? '#fff' : '#A1A1AA'), fontSize:13, fontFamily:'var(--f-font)', transition:'all 0.12s' }}
    >
      <Icon name={icon} size={13}/> {label}
    </button>
  )
}

// ─── Rename Folder Modal ──────────────────────────────────────────────────────

function RenameFolderModal({ current, onClose, onSave }) {
  const [name, setName] = useState(current.name)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => { setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 80) }, [])
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Nome obrigatório'); return }
    onSave(name.trim())
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(5px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'overlayIn 0.18s ease' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:360, background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:18, boxShadow:'0 32px 96px rgba(0,0,0,0.7)', animation:'modalIn 0.22s cubic-bezier(.4,0,.2,1)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:'#fff', margin:0 }}>Renomear pasta</h2>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:30, height:30, cursor:'pointer', color:'#A1A1AA', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="xmark" size={14}/></button>
        </div>
        <form onSubmit={submit} style={{ padding:'16px 20px 18px', display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label className="f-field-label">Novo nome</label>
            <input ref={inputRef} className={`f-input ${error ? 'has-error' : ''}`} value={name} onChange={e => { setName(e.target.value); setError(null) }} placeholder="Nome da pasta"/>
            {error && <span className="f-field-error">{error}</span>}
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button type="button" className="f-btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="f-btn-primary"><Icon name="check" size={13}/> Renomear</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── File Card ────────────────────────────────────────────────────────────────

function FileCard({ file, onView, onEdit, onDownload, onDelete }) {
  const color = TYPE_COLOR[file.type] || '#A1A1AA'
  const icon  = TYPE_ICON[file.type]  || 'file'
  return (
    <div style={{ background:'var(--f-card)', border:'1px solid var(--f-border)', borderRadius:12, overflow:'hidden', cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s' }} onClick={onView}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}>
      <div style={{ height:76, background:`${color}12`, borderBottom:'1px solid var(--f-border)', display:'flex', alignItems:'center', justifyContent:'center', color, position:'relative' }}>
        <Icon name={icon} size={30}/>
        <span style={{ position:'absolute', top:8, right:8, fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:5, background:`${color}20`, border:`1px solid ${color}30`, color }}>{file.type}</span>
      </div>
      <div style={{ padding:'10px 12px 8px' }}>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--f-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>{file.name}</div>
        <div style={{ fontSize:10, color:'var(--f-muted-dim)' }}>{fmtSize(file.sizeKB)} · {fmtDate(file.date)}</div>
      </div>
      <div style={{ borderTop:'1px solid var(--f-border)', padding:'6px 8px', display:'flex', gap:4, justifyContent:'flex-end' }} onClick={e => e.stopPropagation()}>
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
    <button title={title} onClick={onClick}
      style={{ width:28, height:28, borderRadius:7, background:'rgba(255,255,255,0.04)', border:'1px solid var(--f-border)', color:'var(--f-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s, color 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = danger ? '#EF4444' : '#fff' }}
      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}>
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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center', animation:'overlayIn 0.18s ease' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:540, background:'#1E1E1E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px 20px 0 0', boxShadow:'0 -24px 80px rgba(0,0,0,0.6)', animation:'slideUp 0.28s cubic-bezier(.4,0,.2,1)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}><div style={{ width:36, height:4, borderRadius:99, background:'rgba(255,255,255,0.15)' }}/></div>
        <div style={{ height:100, background:`${color}10`, borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', color }}><Icon name={icon} size={40}/></div>
        <div style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:16 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:4 }}>{file.name}</div>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, color, background:`${color}18`, border:`1px solid ${color}30` }}>{file.type}</span>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#A1A1AA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon name="xmark" size={16}/></button>
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
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 12px', fontSize:13, color:'var(--f-muted)', lineHeight:1.6 }}>{file.observations}</div>
            </div>
          )}
        </div>
        <div style={{ padding:'12px 22px 32px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="f-btn-ghost" onClick={onClose}>Fechar</button>
          <button className="f-btn-ghost" onClick={onEdit} style={{ display:'flex', alignItems:'center', gap:5 }}><Icon name="edit" size={13}/> Editar</button>
          <button onClick={onDownload} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, background:'rgba(255,210,46,0.12)', border:'1px solid rgba(255,210,46,0.3)', color:'#FFD22E', cursor:'pointer', fontWeight:600, fontSize:13, fontFamily:'var(--f-font)' }}><Icon name="download" size={14}/> Baixar</button>
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

// ─── New Subfolder Modal ──────────────────────────────────────────────────────

function NewSubfolderModal({ onClose, onSave }) {
  const [name,  setName]  = useState('')
  const [color, setColor] = useState(FOLDER_COLORS[2])
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
    onSave(name.trim(), color)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(5px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'overlayIn 0.18s ease' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:380, background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, boxShadow:'0 32px 96px rgba(0,0,0,0.7)', animation:'modalIn 0.22s cubic-bezier(.4,0,.2,1)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'20px 22px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`${color}20`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FolderSVG size={18} color={color}/>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:'#fff', margin:0 }}>Nova pasta</h2>
              <p style={{ fontSize:11, color:'#A1A1AA', margin:'2px 0 0' }}>Criar subpasta dentro deste cliente</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#A1A1AA', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="xmark" size={16}/></button>
        </div>
        <form onSubmit={submit} style={{ padding:'20px 22px 22px', display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label className="f-field-label">Nome da pasta *</label>
            <input ref={inputRef} className={`f-input ${error ? 'has-error' : ''}`} value={name} onChange={e => { setName(e.target.value); setError(null) }} placeholder="Ex: Logos, Vídeos, Fotos..."/>
            {error && <span className="f-field-error">{error}</span>}
          </div>
          <div>
            <label className="f-field-label">Cor</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {FOLDER_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} style={{ width:28, height:28, borderRadius:8, background:c, border: color === c ? '3px solid #fff' : '3px solid transparent', cursor:'pointer', transition:'border 0.15s', flexShrink:0 }}/>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" className="f-btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="f-btn-primary"><Icon name="plus" size={14}/> Criar pasta</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── File Form Modal ──────────────────────────────────────────────────────────

function FileFormModal({ editing, defaultClient, clientNames, onClose, onSave }) {
  const allClients = clientNames?.length ? clientNames : FALLBACK_CLIENTS
  const [form, setForm] = useState({
    name:         editing?.name         ?? '',
    client:       editing?.client       ?? defaultClient ?? allClients[0],
    type:         editing?.type         ?? 'Logo',
    sizeKB:       editing?.sizeKB       ?? '',
    date:         editing?.date         ?? new Date().toISOString().slice(0,10),
    observations: editing?.observations ?? '',
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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(5px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'overlayIn 0.18s ease' }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', background:'#232323', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, boxShadow:'0 32px 96px rgba(0,0,0,0.7)', animation:'modalIn 0.22s cubic-bezier(.4,0,.2,1)', scrollbarWidth:'thin' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'20px 22px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, position:'sticky', top:0, background:'#232323', zIndex:1 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>{editing ? 'Editar Arquivo' : 'Adicionar Arquivo'}</h2>
            <p style={{ fontSize:12, color:'#A1A1AA', margin:'3px 0 0' }}>{editing ? 'Atualize as informações.' : 'Preencha os dados do arquivo.'}</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#A1A1AA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon name="xmark" size={16}/></button>
        </div>
        {!editing && (
          <div style={{ margin:'16px 22px 0', padding:'12px 14px', background:'rgba(255,210,46,0.06)', border:'1px solid rgba(255,210,46,0.2)', borderRadius:10, display:'flex', alignItems:'center', gap:10 }}>
            <Icon name="upload" size={16} style={{ color:'#FFD22E', flexShrink:0 }}/>
            <span style={{ fontSize:12, color:'#A1A1AA' }}>Upload real será habilitado em breve.</span>
          </div>
        )}
        <form onSubmit={submit} style={{ padding:'16px 22px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          <FField label="Nome do arquivo *" error={errors.name}>
            <input ref={firstRef} className={`f-input ${errors.name ? 'has-error' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: logo-cliente.svg"/>
          </FField>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FField label="Cliente">
              <select className="f-select" value={form.client} onChange={e => set('client', e.target.value)}>
                {allClients.map(c => <option key={c} value={c}>{c}</option>)}
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
            <textarea className="f-input" value={form.observations} onChange={e => set('observations', e.target.value)} placeholder="Anotações..." rows={3} style={{ resize:'vertical', minHeight:68 }}/>
          </FField>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" className="f-btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="f-btn-primary">
              <Icon name={editing ? 'check' : 'upload'} size={14}/> {editing ? 'Salvar' : 'Adicionar arquivo'}
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

function DotsVerticalSVG({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5"  r="1.5"/>
      <circle cx="12" cy="12" r="1.5"/>
      <circle cx="12" cy="19" r="1.5"/>
    </svg>
  )
}

function FolderSVG({ size = 24, color = '#A1A1AA' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function BackArrowSVG({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}

function DropItem({ icon, label, sub, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 12px', borderRadius:8, background: hov ? 'rgba(255,255,255,0.06)' : 'none', border:'none', cursor:'pointer', textAlign:'left', transition:'background 0.15s' }}>
      <div style={{ color:'var(--f-muted)', flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:'var(--f-muted)', marginTop:1 }}>{sub}</div>}
      </div>
    </button>
  )
}
