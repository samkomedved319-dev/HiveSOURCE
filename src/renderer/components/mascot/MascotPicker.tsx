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
          marginBottom: 8,
        }}
      >
        Premade Bloub mascots
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
          gap: 8,
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
                background: on ? 'var(--panel-2)' : 'transparent',
                border: on ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
                borderRadius: 12,
                padding: '10px 6px 8px',
                cursor: 'pointer',
                color: 'var(--text)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <BloubEngineAvatar
                size={52}
                crop={118}
                ink={m.ink}
                paper={m.paper}
                botState={m.pose}
                shapeId={m.shape}
                live={on}
                fps={24}
              />
              <span style={{ fontSize: 11, fontWeight: on ? 700 : 500 }}>{m.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
