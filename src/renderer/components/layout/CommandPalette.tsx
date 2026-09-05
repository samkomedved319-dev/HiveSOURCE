import React, { useEffect, useMemo, useState } from 'react'

export type PaletteAction = {
  id: string
  label: string
  hint?: string
  run: () => void
}

export default function CommandPalette({
  open,
  onClose,
  actions,
}: {
  open: boolean
  onClose: () => void
  actions: PaletteAction[]
}) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return actions
    return actions.filter((a) => a.label.toLowerCase().includes(n) || a.id.includes(n))
  }, [q, actions])

  useEffect(() => {
    if (!open) setQ('')
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 80,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: '92vw',
          background: '#12141A',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
        }}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'Enter' && filtered[0]) {
              filtered[0].run()
              onClose()
            }
          }}
          placeholder="Search commands\u2026  Ctrl+K"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border-soft)',
            color: 'var(--text)',
            padding: '14px 16px',
            fontSize: 14,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: 6 }}>
          {filtered.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                a.run()
                onClose()
              }}
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--panel-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span>{a.label}</span>
              {a.hint && <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>{a.hint}</span>}
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 16, color: 'var(--text-faint)', fontSize: 13 }}>No commands</div>
          )}
        </div>
      </div>
    </div>
  )
}
