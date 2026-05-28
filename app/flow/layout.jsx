'use client'

import { useState, useEffect, useCallback } from 'react'
import { FlowContext } from './FlowContext'
import FlowSidebar from '@/components/flow/FlowSidebar'
import { supabase } from '@/lib/supabase'
import './flow.css'

const LS_NOTIF          = 'bbold_flow_notifs'
const LS_THEME          = 'bbold_flow_theme'
const LS_FONT           = 'bbold_flow_font'
const LS_NOTIF_SETTINGS = 'bbold_notif_settings'

const DEFAULT_SETTINGS = {
  'Novo conteúdo criado': true,
  'Aprovação pendente':   true,
  'Conteúdo publicado':   true,
  'Atraso detectado':     true,
  'Novo cliente':         true,
  'Relatório semanal':    false,
}

function loadNotifs() {
  try { return JSON.parse(localStorage.getItem(LS_NOTIF)) ?? [] } catch { return [] }
}

function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(LS_NOTIF_SETTINGS)) } }
  catch { return DEFAULT_SETTINGS }
}

export default function FlowLayout({ children }) {
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifOpen,     setNotifOpen]     = useState(false)

  // Load notifications from localStorage
  useEffect(() => { setNotifications(loadNotifs()) }, [])

  // Persist notifications
  useEffect(() => {
    if (notifications.length > 0 || localStorage.getItem(LS_NOTIF))
      localStorage.setItem(LS_NOTIF, JSON.stringify(notifications.slice(0, 50)))
  }, [notifications])

  // Apply saved theme & font
  useEffect(() => {
    const theme = localStorage.getItem(LS_THEME) ?? 'premium'
    const font  = localStorage.getItem(LS_FONT)  ?? 'Barlow'
    const root  = document.querySelector('.f-root')
    if (root) { root.setAttribute('data-theme', theme); root.setAttribute('data-font', font) }
  }, [])

  const addNotification = useCallback((notif) => {
    setNotifications(prev => {
      const dup = prev.find(n => n.type === notif.type && n.body === notif.body &&
        Date.now() - new Date(n.timestamp).getTime() < 5000)
      if (dup) return prev
      return [{
        ...notif,
        id:        Date.now().toString(36) + Math.random().toString(36).slice(2),
        read:      false,
        timestamp: new Date().toISOString(),
      }, ...prev]
    })
  }, [])

  const markRead           = useCallback((id) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n)), [])
  const markAllRead        = useCallback(()    => setNotifications(p => p.map(n => ({ ...n, read: true }))), [])
  const removeNotification = useCallback((id) => setNotifications(p => p.filter(n => n.id !== id)), [])

  // Supabase Realtime subscriptions
  useEffect(() => {
    const s = loadSettings()
    const ch = supabase.channel('flow-notif')

    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contents' }, (p) => {
      if (s['Novo conteúdo criado'])
        addNotification({ type: 'content', icon: 'file', title: 'Novo conteúdo criado', body: p.new.title ?? '', link: '/flow/conteudos' })
    })

    ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contents' }, (p) => {
      if (p.new.status === 'Publicado' && p.old?.status !== 'Publicado' && s['Conteúdo publicado'])
        addNotification({ type: 'published', icon: 'check', title: 'Conteúdo publicado', body: p.new.title ?? '', link: '/flow/conteudos' })
      if (p.new.status === 'Atrasado' && p.old?.status !== 'Atrasado' && s['Atraso detectado'])
        addNotification({ type: 'delay', icon: 'alert', title: 'Atraso detectado', body: p.new.title ?? '', link: '/flow/workflow' })
    })

    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'approvals' }, (p) => {
      if (s['Aprovação pendente'])
        addNotification({ type: 'approval', icon: 'check', title: 'Aprovação pendente', body: p.new.title ?? '', link: '/flow/aprovacoes' })
    })

    ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'approvals' }, (p) => {
      if (p.new.status !== p.old?.status && s['Aprovação pendente'])
        addNotification({ type: 'approval_update', icon: 'edit', title: 'Material atualizado', body: `${p.new.title} → ${p.new.status}`, link: '/flow/aprovacoes' })
    })

    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clients' }, (p) => {
      if (s['Novo cliente'])
        addNotification({ type: 'client', icon: 'user', title: 'Novo cliente', body: p.new.name ?? '', link: `/flow/clientes/${p.new.id}` })
    })

    ch.subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [addNotification])

  return (
    <FlowContext.Provider value={{ mobileOpen, setMobileOpen, notifications, addNotification, markRead, markAllRead, removeNotification, notifOpen, setNotifOpen }}>
      <div className="f-root">
        {mobileOpen && <div className="f-mobile-overlay" onClick={() => setMobileOpen(false)} />}
        <FlowSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="f-main">{children}</div>
      </div>
    </FlowContext.Provider>
  )
}
