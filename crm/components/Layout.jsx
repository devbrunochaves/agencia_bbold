import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/crm/',           icon: '📊', label: 'Dashboard',  end: true },
  { to: '/crm/clientes',   icon: '👥', label: 'Clientes'              },
  { to: '/crm/demandas',   icon: '⚡', label: 'Demandas'              },
  { to: '/crm/contratos',  icon: '📋', label: 'Contratos'             },
  { to: '/crm/entregas',   icon: '🗂️', label: 'Kanban'                },
  { to: '/crm/financeiro', icon: '💰', label: 'Financeiro'            },
]

export default function Layout({ session, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/crm/login')
  }

  const currentPage = navItems.find(n =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
  )

  return (
    <div className="crm-shell">

      {/* Mobile header */}
      <div className="crm-mobile-header">
        <button className="crm-hamburger" onClick={() => setOpen(o => !o)} aria-label="Menu">
          <span className="crm-ham-bar" />
          <span className="crm-ham-bar" />
          <span className="crm-ham-bar" />
        </button>
        <span className="crm-mobile-title">
          {currentPage ? `${currentPage.icon} ${currentPage.label}` : '⚡ CRM'}
        </span>
        <div style={{ width: 30 }} />
      </div>

      {open && <div className="crm-sidebar-backdrop" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`crm-sidebar ${open ? 'crm-sidebar-open' : ''}`}>
        <div className="crm-sidebar-logo">
          <h1>⚡ BBold CRM</h1>
          <span>Gestão de Clientes</span>
        </div>

        <nav className="crm-sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="crm-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="crm-sidebar-footer">
          <div className="crm-sidebar-user">{session?.user?.email}</div>
          <button className="crm-btn-logout" onClick={handleLogout}>Sair</button>
        </div>
      </aside>

      {/* Main */}
      <main className="crm-main">
        {children}
      </main>
    </div>
  )
}
