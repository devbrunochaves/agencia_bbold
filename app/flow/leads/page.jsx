'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const COLUMNS = [
  { id: 'em_aberto',        label: 'Em Aberto',        color: '#FFD22E' },
  { id: 'contato_feito',    label: 'Contato Feito',    color: '#3B82F6' },
  { id: 'reuniao_agendada', label: 'Reunião Agendada', color: '#22C55E' },
  { id: 'stand_by',         label: 'Stand By',         color: '#71717A' },
]

const SEG_LABELS = {
  alimentacao: 'Restaurante / Alimentação',
  beleza:      'Beleza / Estética',
  saude:       'Saúde / Bem-estar',
  varejo:      'Varejo / Loja',
  servicos:    'Serviços Profissionais',
  construcao:  'Construção / Reformas',
  educacao:    'Educação / Cursos',
  imobiliaria: 'Imobiliária',
  outro:       'Outro',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function wppHref(phone) {
  return `https://wa.me/55${phone.replace(/\D/g, '')}`
}

export default function LeadsPage() {
  const [leads, setLeads]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [editObs, setEditObs]     = useState(null)   // lead id being edited
  const [obsValue, setObsValue]   = useState('')
  const [savingObs, setSavingObs] = useState(false)
  const [movingId, setMovingId]   = useState(null)   // lead id with status dropdown open

  useEffect(() => {
    supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data ?? []); setLoading(false) })

    const channel = supabase
      .channel('leads-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, ({ new: row }) => {
        setLeads(prev => [row, ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, ({ new: row }) => {
        setLeads(prev => prev.map(l => l.id === row.id ? row : l))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function moveCard(id, status) {
    setMovingId(null)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    await supabase.from('leads').update({ status }).eq('id', id)
  }

  function openObs(lead) {
    setEditObs(lead.id)
    setObsValue(lead.observations ?? '')
  }

  async function saveObs(id) {
    setSavingObs(true)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, observations: obsValue } : l))
    await supabase.from('leads').update({ observations: obsValue }).eq('id', id)
    setSavingObs(false)
    setEditObs(null)
  }

  const total = leads.length
  const thisMonth = leads.filter(l => {
    const d = new Date(l.created_at), n = new Date()
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
  }).length

  return (
    <div style={{ padding: '28px 24px', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--f-text)', marginBottom: 4 }}>Leads</h1>
        <p style={{ fontSize: 13, color: 'var(--f-muted)' }}>
          {total} captado{total !== 1 ? 's' : ''} · {thisMonth} este mês
        </p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--f-muted)', fontSize: 14 }}>Carregando…</p>
      ) : (

        /* Kanban board */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 12,
        }}>
          {COLUMNS.map(col => {
            const cards = leads.filter(l => (l.status ?? 'em_aberto') === col.id)
            return (
              <div key={col.id} style={{
                background: 'var(--f-card)',
                border: '1px solid var(--f-border)',
                borderRadius: 12,
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                minHeight: 200,
              }}>
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--f-muted)' }}>
                    {col.label}
                  </span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                    background: 'var(--f-bg)', color: 'var(--f-muted)',
                    borderRadius: 100, padding: '2px 8px',
                  }}>{cards.length}</span>
                </div>

                {/* Cards */}
                {cards.length === 0 && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', textAlign: 'center', padding: '20px 0' }}>
                    Vazio
                  </div>
                )}

                {cards.map(lead => (
                  <div key={lead.id} style={{
                    background: 'var(--f-bg)',
                    border: '1px solid var(--f-border)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    {/* Name + date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--f-text)', lineHeight: 1.3 }}>{lead.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--f-muted)', flexShrink: 0 }}>{formatDate(lead.created_at)}</span>
                    </div>

                    {/* Segment + Instagram */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'var(--f-muted)' }}>
                        {SEG_LABELS[lead.segment] ?? lead.segment}
                      </span>
                      {lead.instagram && (
                        <a
                          href={`https://instagram.com/${lead.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 11, fontWeight: 700,
                            color: '#E1306C', textDecoration: 'none',
                            background: 'rgba(225,48,108,0.08)',
                            border: '1px solid rgba(225,48,108,0.2)',
                            borderRadius: 100, padding: '2px 8px',
                            transition: 'opacity .15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          {lead.instagram}
                        </a>
                      )}
                    </div>

                    {/* Observations */}
                    {editObs === lead.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <textarea
                          autoFocus
                          value={obsValue}
                          onChange={e => setObsValue(e.target.value)}
                          placeholder="Escreva uma observação…"
                          rows={3}
                          style={{
                            width: '100%', background: 'var(--f-card)',
                            border: '1px solid var(--f-yellow)',
                            borderRadius: 6, padding: '8px 10px',
                            color: 'var(--f-text)', fontSize: 12,
                            fontFamily: 'inherit', resize: 'vertical',
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => saveObs(lead.id)}
                            disabled={savingObs}
                            style={btnStyle('#FFD22E', '#000')}
                          >
                            {savingObs ? 'Salvando…' : 'Salvar'}
                          </button>
                          <button
                            onClick={() => setEditObs(null)}
                            style={btnStyle('transparent', 'var(--f-muted)', true)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => openObs(lead)}
                        title="Clique para editar observação"
                        style={{
                          fontSize: 12, color: lead.observations ? 'var(--f-text)' : 'rgba(255,255,255,0.2)',
                          background: 'var(--f-card)', borderRadius: 6,
                          padding: '7px 10px', cursor: 'pointer', lineHeight: 1.5,
                          border: '1px dashed var(--f-border)',
                          transition: 'border-color .15s',
                          minHeight: 34,
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--f-yellow)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--f-border)'}
                      >
                        {lead.observations || '+ Observação'}
                      </div>
                    )}

                    {/* Actions row */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 2, position: 'relative' }}>
                      {/* WPP button */}
                      <a
                        href={wppHref(lead.phone)}
                        target="_blank"
                        rel="noreferrer"
                        title={lead.phone}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: '#25D366', color: '#fff',
                          fontSize: 11, fontWeight: 700,
                          padding: '5px 10px', borderRadius: 100,
                          textDecoration: 'none', flexShrink: 0,
                          transition: 'opacity .15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '.82'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.876L0 24l6.327-1.504A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.028-1.38l-.36-.214-3.753.892.933-3.648-.234-.374A9.818 9.818 0 1112 21.818z"/>
                        </svg>
                        {lead.phone}
                      </a>

                      {/* Move button */}
                      <div style={{ position: 'relative', marginLeft: 'auto' }}>
                        <button
                          onClick={() => setMovingId(movingId === lead.id ? null : lead.id)}
                          style={{
                            background: 'var(--f-card)', border: '1px solid var(--f-border)',
                            borderRadius: 100, padding: '5px 10px',
                            color: 'var(--f-muted)', fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'color .15s, border-color .15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--f-text)'; e.currentTarget.style.borderColor = 'var(--f-yellow)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--f-muted)'; e.currentTarget.style.borderColor = 'var(--f-border)' }}
                        >
                          Mover ▾
                        </button>

                        {movingId === lead.id && (
                          <div style={{
                            position: 'absolute', bottom: 'calc(100% + 6px)', right: 0,
                            background: 'var(--f-card)', border: '1px solid var(--f-border)',
                            borderRadius: 8, overflow: 'hidden', zIndex: 50,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            minWidth: 170,
                          }}>
                            {COLUMNS.filter(c => c.id !== col.id).map(c => (
                              <button
                                key={c.id}
                                onClick={() => moveCard(lead.id, c.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  width: '100%', padding: '10px 14px',
                                  background: 'none', border: 'none',
                                  color: 'var(--f-text)', fontSize: 12, fontWeight: 600,
                                  cursor: 'pointer', fontFamily: 'inherit',
                                  textAlign: 'left', transition: 'background .12s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--f-bg)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                                {c.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Click outside closes move dropdown */}
      {movingId && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 49 }}
          onClick={() => setMovingId(null)}
        />
      )}
    </div>
  )
}

function btnStyle(bg, color, border = false) {
  return {
    flex: 1, padding: '6px 0', borderRadius: 6,
    background: bg, color,
    border: border ? '1px solid var(--f-border)' : 'none',
    fontSize: 11, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'opacity .15s',
  }
}
