import React, { useEffect, useRef, useState } from 'react'

interface FloatingPanelProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: number
  height?: number
  initialX?: number
  initialY?: number
  zIndex?: number
}

/** Chrome-style floating window: drag title bar, close like a desktop pane. */
export default function FloatingPanel({
  title,
  onClose,
  children,
  width = 420,
  height = 560,
  initialX,
  initialY,
  zIndex = 40,
}: FloatingPanelProps) {
  const [pos, setPos] = useState(() => ({
    x: initialX ?? Math.max(80, window.innerWidth - width - 32),
    y: initialY ?? 72,
  }))
  const [elevated, setElevated] = useState(zIndex)
  const drag = useRef<{ dx: number; dy: number } | null>(null)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return
      const x = Math.min(Math.max(8, e.clientX - drag.current.dx), window.innerWidth - 80)
      const y = Math.min(Math.max(8, e.clientY - drag.current.dy), window.innerHeight - 40)
      setPos({ x, y })
    }
    const onUp = () => {
      drag.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  return (
    <div
      onPointerDown={() => setElevated((z) => z + 1)}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width,
        height,
        zIndex: elevated,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
        overflow: 'hidden',
      }}
    >
      <div
        onPointerDown={(e) => {
          drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
        }}
        style={{
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px 0 12px',
          background: 'var(--panel-2)',
          borderBottom: '1px solid var(--border-soft)',
          cursor: 'grab',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>{title}</span>
        <button
          type="button"
          title="Close"
          onClick={onClose}
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-faint)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#E24B4A'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-faint)'
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{children}</div>
    </div>
  )
}
