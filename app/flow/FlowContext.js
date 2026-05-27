'use client'
import { createContext, useContext } from 'react'

export const FlowContext = createContext({
  mobileOpen: false,
  setMobileOpen: () => {},
})

export function useFlow() {
  return useContext(FlowContext)
}
