import React, { useState } from 'react'

const STEPS = [
  {
    title: 'Chat',
    body: 'This is home. New chat is on the left. Pick Fast / Auto / Heavy / Max in the top bar.',
  },
  {
    title: 'Workers',
    body: 'The grid icon opens AI workers. Start a chat with one bot, or make a group.',
  },
  {
    title: 'Office',
    body: 'The house icon is the 3D office. Agents live there while they work.',
  },
  {
    title: 'Buddy',
    body: 'Turn Buddy on in the left rail. It follows your cursor. Settings → General sets Fast, Auto, or No.',
  },
  {
    title: 'Updates',
    body: 'When a new Hive is out, a banner appears. Click Update and restart. You do not install by hand again.',
  },
]

export default function FirstRunTour({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const step = STEPS[i]
  const last = i === STEPS.length - 1

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: '100%',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{ padding: '22px 24px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="./icon.png" alt="" style={{ width: 36, height: 36, borderRadius: 10 }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 650 }}>Welcome to Hive</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
              {i + 1} / {STEPS.length}
            </div>
          </div>
        </div>
        <div style={{ padding: '8px 24px 20px' }}>
          <div style={{ fontSize: 15, fontWeight: 650, marginBottom: 8 }}>{step.title}</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--text-dim)' }}>{step.body}</div>
        </div>
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={onDone}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-dim)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => (last ? onDone() : setI((n) => n + 1))}
            style={{
              flex: 1,
              background: 'var(--accent)',
              color: 'var(--accent-fg)',
              border: 'none',
              borderRadius: 10,
              padding: '10px 16px',
              fontWeight: 650,
              fontSize: 13.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {last ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
