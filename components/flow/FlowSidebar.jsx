'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import Icon from './FlowIcons'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',     icon: 'grid',     href: '/flow',                group: 'principal' },
  { id: 'clientes',      label: 'Clientes',      icon: 'users',    href: '/flow/clientes',       group: 'principal' },
  { id: 'conteudos',     label: 'Conteúdos',     icon: 'file',     href: '/flow/conteudos',      group: 'principal' },
  { id: 'workflow',      label: 'Workflow',      icon: 'workflow', href: '/flow/workflow',       group: 'principal' },
  { id: 'calendario',    label: 'Calendário',    icon: 'calendar', href: '/flow/calendario',     group: 'principal' },
  { id: 'leads',         label: 'Leads',         icon: 'zap',      href: '/flow/leads',          group: 'recursos' },
  { id: 'aprovacoes',    label: 'Aprovações',    icon: 'check',    href: '/flow/aprovacoes',     group: 'recursos' },
  { id: 'biblioteca',    label: 'Biblioteca',    icon: 'folder',   href: '/flow/biblioteca',     group: 'recursos' },
  { id: 'performance',   label: 'Performance',   icon: 'chart',    href: '/flow/performance',    group: 'recursos' },
  { id: 'relatorios',    label: 'Relatórios',    icon: 'report',   href: '/flow/relatorios',     group: 'recursos' },
  { id: 'configuracoes', label: 'Configurações', icon: 'settings', href: '/flow/configuracoes',  group: 'recursos' },
]

function initials(email) {
  if (!email) return 'AD'
  const [local] = email.split('@')
  const parts = local.split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

function displayName(user) {
  const meta = user?.user_metadata
  if (meta?.full_name) return meta.full_name
  if (meta?.name) return meta.name
  return user?.email?.split('@')[0] ?? 'Admin'
}

export default function FlowSidebar({ mobileOpen, onClose }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

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

      {/* Footer: user info + logout */}
      <div className="f-sidebar-footer">
        <div className="f-user-row">
          <div className="f-user-avatar">{initials(user?.email)}</div>
          <div className="f-user-info">
            <span className="f-user-name">{displayName(user)}</span>
            <span className="f-user-role">{user?.email ?? ''}</span>
          </div>
          <span className="f-user-status" />
          <button
            onClick={logout}
            title="Sair"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--f-muted)', display: 'flex', alignItems: 'center',
              padding: '4px', borderRadius: 6, flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--f-red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--f-muted)'}
          >
            <Icon name="logout" size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
