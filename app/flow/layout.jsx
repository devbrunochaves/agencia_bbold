'use client'

import { useState } from 'react'
import { FlowContext } from './FlowContext'
import FlowSidebar from '@/components/flow/FlowSidebar'
import './flow.css'

export default function FlowLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <FlowContext.Provider value={{ mobileOpen, setMobileOpen }}>
      <div className="f-root">
        {mobileOpen && (
          <div className="f-mobile-overlay" onClick={() => setMobileOpen(false)} />
        )}
        <FlowSidebar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <div className="f-main">
          {children}
        </div>
      </div>
    </FlowContext.Provider>
  )
}
