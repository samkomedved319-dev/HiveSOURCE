import React from 'react'
import BloubEngineAvatar from './BloubEngineAvatar'
import { BLOUB_MASCOTS } from './mascotLibrary'

export default function MascotPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
          marginBottom: 4,
        }}
      >
        Premade Bloub mascots
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '0 0 10px' }}>
        Every face is a real Bloub. Thinking / searching / done play while that bot works.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          gap: 10,
        }}
      >
        {BLOUB_MASCOTS.map((m) => {
          const on = value === m.id
          return (
            <button
              key={m.id}
              type="button"
              title={m.hint}
              onClick={() => onChange(m.id)}
              style={{
                background: on ? 'rgba(242,193,78,0.08)' : 'var(--panel-2)',
                border: on ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
                borderRadius: 16,
                padding: '14px 8px 10px',
                cursor: 'pointer',
                color: 'var(--text)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <BloubEngineAvatar
                size={64}
                crop={120}
                ink={m.ink}
                paper={m.paper}
                botState="idle"
                shapeId={m.shape}
                live={on}
                fps={24}
              />
              <span style={{ fontSize: 12, fontWeight: on ? 700 : 500 }}>{m.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
