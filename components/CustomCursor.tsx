'use client'

import { useEffect, useState } from 'react'

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY })
      setVisible(true)
    }
    const onLeave = () => setVisible(false)
    const onEnter = () => setVisible(true)

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        pointerEvents: 'none',
        zIndex: 99999,
        opacity: visible ? 1 : 0,
        willChange: 'transform',
      }}
    >
      <svg
        width="22"
        height="28"
        viewBox="0 0 22 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Arrow cursor pointing top-left; hotspot at top-left corner of SVG */}
        <path
          d="M2 2 L2 22 L7 16.5 L11.5 25.5 L14.5 24 L10 15 L18 15 Z"
          fill="#F5C518"
          stroke="#0A0A0A"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
