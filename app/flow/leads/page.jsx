'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function wppLink(phone) {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/55${digits}`
}

export default function LeadsPage() {
  const [leads, setLeads]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      setLeads(data ?? [])
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, payload => {
        setLeads(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const filtered = leads.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search) ||
    SEG_LABELS[l.segment]?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--f-text)', marginBottom: 4 }}>
          Leads
        </h1>
        <p style={{ fontSize: 13, color: 'var(--f-muted)' }}>
          Contatos captados pelo formulário de diagnóstico gratuito
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={statStyle}>
          <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--f-yellow)' }}>{leads.length}</span>
          <span style={{ fontSize: 12, color: 'var(--f-muted)', marginTop: 2 }}>Total de leads</span>
        </div>
        <div style={statStyle}>
          <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--f-text)' }}>
            {leads.filter(l => {
              const d = new Date(l.created_at)
              const now = new Date()
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            }).length}
          </span>
          <span style={{ fontSize: 12, color: 'var(--f-muted)', marginTop: 2 }}>Este mês</span>
        </div>
        <div style={statStyle}>
          <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--f-text)' }}>
            {leads.filter(l => {
              const d = new Date(l.created_at)
              const now = new Date()
              const diff = (now - d) / 1000 / 60 / 60 / 24
              return diff <= 7
            }).length}
          </span>
          <span style={{ fontSize: 12, color: 'var(--f-muted)', marginTop: 2 }}>Últimos 7 dias</span>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar por nome, telefone ou segmento…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', marginBottom: 16,
          background: 'var(--f-card)', border: '1px solid var(--f-border)',
          borderRadius: 8, color: 'var(--f-text)', fontSize: 13,
          fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
        }}
      />

      {/* Table */}
      {loading ? (
        <p style={{ color: 'var(--f-muted)', fontSize: 14 }}>Carregando…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--f-muted)', fontSize: 14 }}>
          {search ? 'Nenhum lead encontrado.' : 'Nenhum lead ainda. Quando alguém preencher o formulário, aparece aqui.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(lead => (
            <div key={lead.id} style={rowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--f-text)', marginBottom: 2 }}>
                  {lead.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--f-muted)' }}>
                  {SEG_LABELS[lead.segment] ?? lead.segment}
                </div>
              </div>

              <div style={{ fontSize: 13, color: 'var(--f-text)', minWidth: 140 }}>
                {lead.phone}
              </div>

              <div style={{ fontSize: 12, color: 'var(--f-muted)', minWidth: 130, textAlign: 'right' }}>
                {formatDate(lead.created_at)}
              </div>

              <a
                href={wppLink(lead.phone)}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#25D366', color: '#fff', fontSize: 12, fontWeight: 700,
                  padding: '6px 14px', borderRadius: 100, textDecoration: 'none',
                  whiteSpace: 'nowrap', flexShrink: 0, transition: 'opacity .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.876L0 24l6.327-1.504A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.028-1.38l-.36-.214-3.753.892.933-3.648-.234-.374A9.818 9.818 0 1112 21.818z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const statStyle = {
  background: 'var(--f-card)',
  border: '1px solid var(--f-border)',
  borderRadius: 10,
  padding: '14px 20px',
  display: 'flex',
  flexDirection: 'column',
  minWidth: 120,
}

const rowStyle = {
  background: 'var(--f-card)',
  border: '1px solid var(--f-border)',
  borderRadius: 10,
  padding: '14px 18px',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
}
