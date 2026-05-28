'use client'
import { createContext, useContext } from 'react'

export const FlowContext = createContext({
  mobileOpen:         false,
  setMobileOpen:      () => {},
  notifications:      [],
  addNotification:    () => {},
  markRead:           () => {},
  markAllRead:        () => {},
  removeNotification: () => {},
  notifOpen:          false,
  setNotifOpen:       () => {},
})

export function useFlow() {
  return useContext(FlowContext)
}
