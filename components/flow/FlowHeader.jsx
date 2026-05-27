'use client'

import { useFlow } from '@/app/flow/FlowContext'
import Icon from './FlowIcons'

export default function FlowHeader({ title, subtitle, actions }) {
  const { setMobileOpen } = useFlow()

  return (
    <header className="f-header">
      <button
        className="f-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <Icon name="menu" size={20} />
      </button>

      <div className="f-header-left">
        {/* Logo compacto — visível só no mobile */}
        <div className="f-header-logo-mobile">
          <div className="f-logo-mark" style={{ width: 28, height: 28, fontSize: 13 }}>
            <span>B</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
            BBOLD <span style={{ color: 'var(--f-yellow)' }}>Flow</span>
          </span>
        </div>
        <h1 className="f-header-title">{title}</h1>
        {subtitle && <p className="f-header-sub">{subtitle}</p>}
      </div>

      <div className="f-header-right">
        <div className="f-search">
          <Icon name="search" size={14} />
          <input type="text" placeholder="Buscar…" />
        </div>
        <button className="f-btn-icon" aria-label="Notificações">
          <Icon name="bell" size={16} />
          <span className="f-btn-icon-dot" />
        </button>
        {actions}
      </div>
    </header>
  )
}
