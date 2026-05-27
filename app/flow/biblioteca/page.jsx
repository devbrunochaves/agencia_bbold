'use client'

import { useState } from 'react'
import FlowHeader from '@/components/flow/FlowHeader'
import Icon from '@/components/flow/FlowIcons'

const FILE_TYPE_ICON  = { Logo:'star', Brandbook:'doc', Foto:'image', Video:'video', Contrato:'lock', Briefing:'file', Campanha:'zap' }
const FILE_TYPE_COLOR = { Logo:'#FFD22E', Brandbook:'#3B82F6', Foto:'#22C55E', Video:'#8B5CF6', Contrato:'#EF4444', Briefing:'#F59E0B', Campanha:'#F59E0B' }

const FILES = [
  { id:1,  name:'logo-academia-alpha.svg',     client:'Academia Alpha',     type:'Logo',      date:'15 Mai', size:'240 KB',  tag:'Identidade' },
  { id:2,  name:'brandbook-alpha-2025.pdf',    client:'Academia Alpha',     type:'Brandbook', date:'10 Jan', size:'4.2 MB',  tag:'Branding'   },
  { id:3,  name:'fotos-estudio-abril.zip',     client:'Academia Alpha',     type:'Foto',      date:'02 Abr', size:'87 MB',   tag:'Conteúdo'   },
  { id:4,  name:'logo-essenza-principal.svg',  client:'Clínica Essenza',    type:'Logo',      date:'08 Mar', size:'180 KB',  tag:'Identidade' },
  { id:5,  name:'contrato-essenza-2025.pdf',   client:'Clínica Essenza',    type:'Contrato',  date:'01 Jan', size:'320 KB',  tag:'Jurídico'   },
  { id:6,  name:'briefing-junho-essenza.pdf',  client:'Clínica Essenza',    type:'Briefing',  date:'20 Mai', size:'156 KB',  tag:'Briefing'   },
  { id:7,  name:'logo-origem-vetor.svg',       client:'Restaurante Origem', type:'Logo',      date:'05 Fev', size:'95 KB',   tag:'Identidade' },
  { id:8,  name:'fotos-restaurante-maio.zip',  client:'Restaurante Origem', type:'Foto',      date:'18 Mai', size:'124 MB',  tag:'Conteúdo'   },
  { id:9,  name:'reels-bastidores-cozinha.mp4',client:'Restaurante Origem', type:'Video',     date:'22 Mai', size:'210 MB',  tag:'Vídeo'      },
  { id:10, name:'logo-urbanfit-store.svg',     client:'Urban Fit Store',    type:'Logo',      date:'14 Mar', size:'310 KB',  tag:'Identidade' },
  { id:11, name:'campanha-inverno-2026.pdf',   client:'Urban Fit Store',    type:'Campanha',  date:'10 Mai', size:'2.1 MB',  tag:'Campanha'   },
  { id:12, name:'briefing-junho-urbanfit.pdf', client:'Urban Fit Store',    type:'Briefing',  date:'19 Mai', size:'98 KB',   tag:'Briefing'   },
  { id:13, name:'logo-bella-forma.svg',        client:'Studio Bella Forma', type:'Logo',      date:'20 Fev', size:'220 KB',  tag:'Identidade' },
  { id:14, name:'fotos-studio-abril.zip',      client:'Studio Bella Forma', type:'Foto',      date:'05 Abr', size:'56 MB',   tag:'Conteúdo'   },
  { id:15, name:'logo-odonto-prime.svg',       client:'Odonto Prime',       type:'Logo',      date:'12 Jan', size:'175 KB',  tag:'Identidade' },
  { id:16, name:'contrato-odonto-2025.pdf',    client:'Odonto Prime',       type:'Contrato',  date:'01 Jan', size:'290 KB',  tag:'Jurídico'   },
]

const CLIENT_TABS = [
  'Todos',
  'Academia Alpha',
  'Clínica Essenza',
  'Restaurante Origem',
  'Urban Fit Store',
  'Studio Bella Forma',
  'Odonto Prime',
]

const TYPE_TABS = ['Todos', 'Logo', 'Brandbook', 'Foto', 'Video', 'Contrato', 'Briefing', 'Campanha']

const pillStyle = (active) => ({
  padding:'5px 13px',
  borderRadius:99,
  border: active ? '1px solid var(--f-yellow)' : '1px solid var(--f-border)',
  background: active ? 'rgba(255,210,46,0.12)' : 'transparent',
  color: active ? 'var(--f-yellow)' : 'var(--f-muted)',
  fontSize:12,
  fontWeight: active ? 600 : 400,
  cursor:'pointer',
  transition:'all 0.15s',
  whiteSpace:'nowrap',
})

export default function BibliotecaPage() {
  const [clientFilter, setClientFilter] = useState('Todos')
  const [typeFilter,   setTypeFilter]   = useState('Todos')

  const filtered = FILES.filter(f => {
    const matchClient = clientFilter === 'Todos' || f.client === clientFilter
    const matchType   = typeFilter   === 'Todos' || f.type   === typeFilter
    return matchClient && matchType
  })

  const actions = (
    <button className="f-btn-primary" style={{ display:'flex', alignItems:'center', gap:6 }}>
      <Icon name="upload" size={14}/> Enviar Arquivo
    </button>
  )

  return (
    <>
      <FlowHeader
        title="Biblioteca"
        subtitle="Organize logos, fotos, vídeos, documentos e materiais de todos os clientes."
        actions={actions}
      />

      <main className="f-content">
        {/* Client filter */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
          {CLIENT_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setClientFilter(tab)}
              style={pillStyle(clientFilter === tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
          {TYPE_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setTypeFilter(tab)}
              style={pillStyle(typeFilter === tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* File grid with count */}
        <div style={{ marginTop:4 }}>
          <p style={{ fontSize:12, color:'var(--f-muted)', marginBottom:12 }}>
            {filtered.length} arquivo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
            {filtered.map(item => (
              <div
                key={item.id}
                style={{
                  background:'var(--f-card)',
                  border:'1px solid var(--f-border)',
                  borderRadius:12,
                  overflow:'hidden',
                  cursor:'pointer',
                  transition:'background 0.15s, transform 0.15s',
                }}
              >
                {/* Preview area */}
                <div style={{
                  height:80,
                  background:`${FILE_TYPE_COLOR[item.type]}10`,
                  borderBottom:'1px solid var(--f-border)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: FILE_TYPE_COLOR[item.type],
                }}>
                  <Icon name={FILE_TYPE_ICON[item.type]} size={28}/>
                </div>

                {/* Info */}
                <div style={{ padding:'12px 14px' }}>
                  <div style={{
                    fontSize:12, fontWeight:600, color:'var(--f-text)',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    marginBottom:4,
                  }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize:11, color:'var(--f-muted)', marginBottom:8 }}>
                    {item.client}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:10, color:'var(--f-muted-dim)' }}>
                      {item.size} · {item.date}
                    </span>
                    <span style={{
                      fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:99,
                      background:`${FILE_TYPE_COLOR[item.type]}15`,
                      color: FILE_TYPE_COLOR[item.type],
                    }}>
                      {item.type}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ borderTop:'1px solid var(--f-border)', padding:'8px 10px', display:'flex', gap:6, justifyContent:'flex-end' }}>
                  <button style={{ background:'none', border:'none', color:'var(--f-muted)', cursor:'pointer', padding:'3px 6px', borderRadius:6, display:'flex', alignItems:'center' }}>
                    <Icon name="download" size={14}/>
                  </button>
                  <button style={{ background:'none', border:'none', color:'var(--f-muted)', cursor:'pointer', padding:'3px 6px', borderRadius:6, display:'flex', alignItems:'center' }}>
                    <Icon name="trash" size={14}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
