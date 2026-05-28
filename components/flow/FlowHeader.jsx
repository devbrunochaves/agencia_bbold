'use client'

import { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFlow } from '@/app/flow/FlowContext'
import Icon from './FlowIcons'

const NOTIF_ICONS = {
  content:         { color: '#3B82F6', icon: 'file'  },
  published:       { color: '#22C55E', icon: 'check' },
  delay:           { color: '#EF4444', icon: 'alert' },
  approval:        { color: '#F59E0B', icon: 'check' },
  approval_update: { color: '#8B5CF6', icon: 'edit'  },
  client:          { color: '#FFD22E', icon: 'user'  },
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)    return 'agora'
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function FlowHeader({ title, subtitle, actions }) {
  const { setMobileOpen, notifications, markRead, markAllRead, removeNotification, notifOpen, setNotifOpen } = useFlow()
  const router   = useRouter()
  const wrapRef  = useRef(null)
  const unread   = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (!notifOpen) return
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [notifOpen, setNotifOpen])

  function handleClick(notif) {
    markRead(notif.id)
    setNotifOpen(false)
    if (notif.link) router.push(notif.link)
  }

  return (
    <header className="f-header">
      <button className="f-hamburger" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
        <Icon name="menu" size={20} />
      </button>

      <div className="f-header-left">
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

        {/* Bell + panel */}
        <div style={{ position: 'relative' }} ref={wrapRef}>
          <button
            className="f-btn-icon"
            aria-label="Notificações"
            onClick={() => setNotifOpen(o => !o)}
          >
            <Icon name="bell" size={16} />
            {unread > 0 && (
              <span className="f-notif-badge">{unread > 9 ? '9+' : unread}</span>
            )}
          </button>

          {notifOpen && (
            <div className="f-notif-panel">
              <div className="f-notif-panel-head">
                <span className="f-notif-panel-title">Notificações</span>
                {unread > 0 && (
                  <button
                    className="f-btn-ghost"
                    style={{ fontSize: 11, padding: '3px 8px' }}
                    onClick={markAllRead}
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="f-notif-list">
                {notifications.length === 0 ? (
                  <div className="f-notif-empty">Nenhuma notificação</div>
                ) : (
                  notifications.slice(0, 14).map(n => {
                    const meta = NOTIF_ICONS[n.type] ?? { color: 'var(--f-muted)', icon: 'bell' }
                    return (
                      <div
                        key={n.id}
                        className={`f-notif-item${n.read ? '' : ' is-unread'}`}
                        onClick={() => handleClick(n)}
                      >
                        <div className="f-notif-icon" style={{ background: `${meta.color}18`, color: meta.color }}>
                          <Icon name={meta.icon} size={14} />
                        </div>
                        <div className="f-notif-body">
                          <div className="f-notif-title">{n.title}</div>
                          {n.body && <div className="f-notif-desc">{n.body}</div>}
                          <div className="f-notif-time">{timeAgo(n.timestamp)}</div>
                        </div>
                        {!n.read && <span className="f-notif-dot" />}
                        <button
                          className="f-notif-dismiss"
                          onClick={e => { e.stopPropagation(); removeNotification(n.id) }}
                          aria-label="Remover"
                        >✕</button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {actions}
      </div>
    </header>
  )
}
