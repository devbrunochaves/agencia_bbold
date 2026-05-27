import Icon from './FlowIcons'

export default function MetricCard({ icon, value, label, desc, accentColor, trend }) {
  const positive = trend >= 0
  return (
    <div className="f-metric-card">
      <div className="f-metric-top">
        <div className="f-metric-icon" style={{ color: accentColor, background: `${accentColor}18` }}>
          <Icon name={icon} size={20} />
        </div>
        {trend !== undefined && (
          <span className={`f-metric-trend ${positive ? 'is-up' : 'is-down'}`}>
            {positive ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="f-metric-value">{value}</div>
      <div className="f-metric-label">{label}</div>
      {desc && <div className="f-metric-desc">{desc}</div>}
      {trend !== undefined && (
        <div className="f-metric-bar">
          <div
            className="f-metric-bar-fill"
            style={{ width: `${Math.min(Math.abs(trend) * 4, 100)}%`, background: accentColor }}
          />
        </div>
      )}
    </div>
  )
}
