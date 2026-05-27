'use client'

import { useState } from 'react'
import FlowHeader from '@/components/flow/FlowHeader'
import StatusBadge from '@/components/flow/StatusBadge'
import Icon from '@/components/flow/FlowIcons'

const CONTENTS = [
  { id:1,  title:'Reels — Antes e Depois',         client:'Academia Alpha',     format:'Reels',        pubDate:'28 Mai', responsible:'Ana Lima',   status:'Produção',             priority:'Alta' },
  { id:2,  title:'Post Feed — Cardápio Novo',       client:'Restaurante Origem', format:'Feed',         pubDate:'27 Mai', responsible:'Carlos M.',  status:'Aguardando Aprovação', priority:'Alta' },
  { id:3,  title:'Stories — Promoção Junho',        client:'Loja Urban Fit',     format:'Stories',      pubDate:'30 Mai', responsible:'Juliana K.', status:'Briefing',             priority:'Média' },
  { id:4,  title:'Carrossel — Tratamentos',         client:'Clínica Essenza',    format:'Carrossel',    pubDate:'26 Mai', responsible:'Ana Lima',   status:'Atrasado',             priority:'Alta' },
  { id:5,  title:'Reels — Treino do Mês',           client:'Academia Alpha',     format:'Reels',        pubDate:'29 Mai', responsible:'Pedro H.',   status:'Revisão',              priority:'Média' },
  { id:6,  title:'Post Feed — Lançamento SS',       client:'Loja Urban Fit',     format:'Feed',         pubDate:'01 Jun', responsible:'Carlos M.',  status:'Agendado',             priority:'Baixa' },
  { id:7,  title:'Stories — Depoimento Cliente',    client:'Clínica Essenza',    format:'Stories',      pubDate:'25 Mai', responsible:'Juliana K.', status:'Publicado',            priority:'Baixa' },
  { id:8,  title:'Carrossel — Dicas Nutrição',      client:'Academia Alpha',     format:'Carrossel',    pubDate:'31 Mai', responsible:'Pedro H.',   status:'Produção',             priority:'Média' },
  { id:9,  title:'Blog — Saúde Bucal em Foco',      client:'Odonto Prime',       format:'Blog',         pubDate:'02 Jun', responsible:'Ana Lima',   status:'Briefing',             priority:'Baixa' },
  { id:10, title:'Reels — Look do Dia',             client:'Urban Fit Store',    format:'Reels',        pubDate:'28 Mai', responsible:'Carlos M.',  status:'Produção',             priority:'Média' },
  { id:11, title:'Landing — Campanha Inverno',      client:'Urban Fit Store',    format:'Landing Page', pubDate:'05 Jun', responsible:'Pedro H.',   status:'Briefing',             priority:'Alta' },
  { id:12, title:'Carrossel — Resultados Clientes', client:'Studio Bella Forma', format:'Carrossel',    pubDate:'29 Mai', responsible:'Juliana K.', status:'Revisão',              priority:'Média' },
]

const FILTER_TABS = ['Todos','Briefing','Produção','Revisão','Aguardando Aprovação','Agendado','Publicado','Atrasado']

export default function ConteudosPage() {
  const [filter, setFilter] = useState('Todos')

  const filtered = CONTENTS.filter(item => {
    if (filter === 'Todos') return true
    return item.status === filter
  })

  const actions = (
    <button className="f-btn-primary" style={{ display:'flex', alignItems:'center', gap:6 }}>
      <Icon name="plus" size={14} /> Novo Conteúdo
    </button>
  )

  return (
    <>
      <FlowHeader
        title="Conteúdos"
        subtitle="Acompanhe tudo que está sendo produzido, revisado, aprovado e publicado."
        actions={actions}
      />

      <main className="f-content">
        <div style={{ display:'flex', gap:8, padding:'0 22px 16px', flexWrap:'wrap' }}>
          {FILTER_TABS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding:'6px 14px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer', border:'1px solid',
                background: filter === f ? 'var(--f-yellow)' : 'transparent',
                color: filter === f ? '#000' : 'var(--f-muted)',
                borderColor: filter === f ? 'var(--f-yellow)' : 'var(--f-border)',
                transition:'all 0.15s'
              }}
            >{f}</button>
          ))}
        </div>

        <p style={{ padding:'0 22px 12px', fontSize:12, color:'var(--f-muted)' }}>
          Exibindo {filtered.length} conteúdos
        </p>

        <div style={{ padding:'0 22px 24px' }}>
          <div className="f-card">
            <div className="f-card-header">
              <span className="f-card-title">Todos os Conteúdos</span>
              <span className="f-card-subtitle">{filtered.length} itens</span>
            </div>
            <div className="f-table-wrap">
              <table className="f-table">
                <thead>
                  <tr>
                    <th>Conteúdo</th>
                    <th>Cliente</th>
                    <th>Formato</th>
                    <th>Publicação</th>
                    <th>Responsável</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id} className="f-table-row">
                      <td><span className="f-content-title">{item.title}</span></td>
                      <td><span className="f-client-chip">{item.client}</span></td>
                      <td><span className="f-format-chip">{item.format}</span></td>
                      <td>
                        <span className="f-deadline" style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <Icon name="calendar" size={12} />{item.pubDate}
                        </span>
                      </td>
                      <td>
                        <div className="f-responsible">
                          <div className="f-avatar-sm">
                            {item.responsible.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span>{item.responsible}</span>
                        </div>
                      </td>
                      <td><StatusBadge status={item.priority} /></td>
                      <td><StatusBadge status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
