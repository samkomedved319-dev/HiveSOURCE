import React from 'react'
import { FREE_GLM } from '../../lib/freeModels'

export const FREE_MODEL_CARDS = [
  {
    id: FREE_GLM,
    name: 'GLM 5.3',
    tag: 'Hive Free',
    desc: 'The only Hive Free model. Fast chat, code, and everyday work. Nemotron is off — it had zero credits.',
    mode: 'fast' as const,
  },
]

export default function FreeModelCards({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string, mode: 'fast' | 'heavy') => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
      {FREE_MODEL_CARDS.map((m) => {
        const on = value === m.id || !value
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id, m.mode)}
            style={{
              textAlign: 'left',
              background: on ? 'color-mix(in oklab, var(--accent) 12%, var(--panel-2))' : 'var(--panel-2)',
              border: on ? '1px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 14,
              padding: '12px 12px 14px',
              cursor: 'pointer',
              color: 'var(--text)',
              fontFamily: 'inherit',
              boxShadow: on ? '0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent)' : 'none',
              transition: 'border-color 180ms, background 180ms, box-shadow 180ms, transform 150ms',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  color: on ? 'var(--accent-fg)' : 'var(--accent)',
                  background: on ? 'var(--accent)' : 'color-mix(in oklab, var(--accent) 16%, transparent)',
                  borderRadius: 999,
                  padding: '3px 8px',
                }}
              >
                {m.tag}
              </span>
              {on && <span style={{ fontSize: 13, color: 'var(--accent)' }}>on</span>}
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>{m.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.45, marginTop: 4 }}>{m.desc}</div>
          </button>
        )
      })}
    </div>
  )
}
