'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from './FlowIcons'

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',     icon: 'grid',     href: '/flow',                group: 'principal' },
  { id: 'clientes',      label: 'Clientes',      icon: 'users',    href: '/flow/clientes',       group: 'principal' },
  { id: 'conteudos',     label: 'Conteúdos',     icon: 'file',     href: '/flow/conteudos',      group: 'principal' },
  { id: 'workflow',      label: 'Workflow',      icon: 'workflow', href: '/flow/workflow',       group: 'principal' },
  { id: 'calendario',    label: 'Calendário',    icon: 'calendar', href: '/flow/calendario',     group: 'principal' },
  { id: 'aprovacoes',    label: 'Aprovações',    icon: 'check',    href: '/flow/aprovacoes',     group: 'recursos',  badge: 8 },
  { id: 'biblioteca',    label: 'Biblioteca',    icon: 'folder',   href: '/flow/biblioteca',     group: 'recursos' },
  { id: 'performance',   label: 'Performance',   icon: 'chart',    href: '/flow/performance',    group: 'recursos' },
  { id: 'relatorios',   label: 'Relatórios',    icon: 'report',   href: '/flow/relatorios',     group: 'recursos' },
  { id: 'configuracoes', label: 'Configurações', icon: 'settings', href: '/flow/configuracoes',  group: 'recursos' },
]

export default function FlowSidebar({ mobileOpen, onClose }) {
  const pathname = usePathname()
  const principal = NAV_ITEMS.filter(i => i.group === 'principal')
  const recursos  = NAV_ITEMS.filter(i => i.group === 'recursos')

  function isActive(href) {
    if (href === '/flow') return pathname === '/flow'
    return pathname.startsWith(href)
  }

  return (
    <aside className={`f-sidebar ${mobileOpen ? 'is-mobile-open' : ''}`}>
      {/* Logo */}
      <div className="f-sidebar-logo">
        <div className="f-logo-mark">
          <span>B</span>
          <div className="f-logo-dot" />
        </div>
        <div className="f-logo-text">
          <span className="f-logo-name">BBOLD</span>
          <span className="f-logo-sub">Flow</span>
        </div>
        <button className="f-sidebar-close" onClick={onClose} aria-label="Fechar menu">
          <Icon name="xmark" size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="f-sidebar-nav">
        <p className="f-nav-label">Principal</p>
        {principal.map(item => (
          <Link
            key={item.id}
            href={item.href}
            className={`f-nav-item ${isActive(item.href) ? 'is-active' : ''}`}
            onClick={onClose}
          >
            <span className="f-nav-icon"><Icon name={item.icon} size={16} /></span>
            <span className="f-nav-text">{item.label}</span>
          </Link>
        ))}

        <p className="f-nav-label" style={{ marginTop: 20 }}>Recursos</p>
        {recursos.map(item => (
          <Link
            key={item.id}
            href={item.href}
            className={`f-nav-item ${isActive(item.href) ? 'is-active' : ''}`}
            onClick={onClose}
          >
            <span className="f-nav-icon"><Icon name={item.icon} size={16} /></span>
            <span className="f-nav-text">{item.label}</span>
            {item.badge && <span className="f-nav-badge">{item.badge}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="f-sidebar-footer">
        <div className="f-user-row">
          <div className="f-user-avatar">AD</div>
          <div className="f-user-info">
            <span className="f-user-name">Admin BBOLD</span>
            <span className="f-user-role">Gestor de Conteúdo</span>
          </div>
          <span className="f-user-status" />
        </div>
      </div>
    </aside>
  )
}
