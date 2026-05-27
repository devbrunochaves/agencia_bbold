const STATUS_CONFIG = {
  'Briefing':             { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  'Produção':             { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  'Revisão':              { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  'Aguardando Aprovação': { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  'Aguardando revisão':   { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  'Ajustes solicitados':  { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  'Liberado p/ cliente':  { color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  'Agendado':             { color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  'Publicado':            { color: '#A1A1AA', bg: 'rgba(161,161,170,0.15)' },
  'Atrasado':             { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  'Ativo':                { color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  'Pausado':              { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  'Em onboarding':        { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  'Atenção':              { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  'Urgente':              { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  'Alta':                 { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  'Média':                { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  'Baixa':                { color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { color: '#A1A1AA', bg: 'rgba(161,161,170,0.15)' }
  return (
    <span className="f-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {status}
    </span>
  )
}
