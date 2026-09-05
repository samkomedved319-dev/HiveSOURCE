import React, { useState } from 'react'

const DESKS = [
  { name: 'Scout', job: 'search', color: '#5B8DEF' },
  { name: 'Athena', job: 'intel', color: '#38BDF8' },
  { name: 'Hive', job: 'lead', color: '#F2C14E' },
  { name: 'Pulse', job: 'check', color: '#FB7185' },
  { name: 'Apollo', job: 'code', color: '#F97316' },
  { name: 'Critic', job: 'review', color: '#C084FC' },
]

export default function OfficeOverlay({ onClose }: { onClose: () => void }) {
  const [task, setTask] = useState('')
  const [log, setLog] = useState<string[]>(['Floor is ready. Type a task below.'])
  const [busy, setBusy] = useState(false)

  const send = async () => {
    const t = task.trim()
    if (!t || busy) return
    setBusy(true)
    setTask('')
    setLog((p) => [...p, `You: ${t}`])
    try {
      const res = await window.electronAPI?.ai?.chat?.(
        [
          { role: 'system', content: 'You are Hive at the office. One short useful reply. No markdown walls.' },
          { role: 'user', content: t },
        ],
        undefined,
        { webSearch: false }
      )
      setLog((p) => [...p, `Hive: ${res?.content || res?.error || 'No reply.'}`])
    } catch (e) {
      setLog((p) => [...p, e instanceof Error ? e.message : 'Failed'])
    }
    setBusy(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#F2C14E',
        color: '#111',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          background: '#111',
          color: '#F2C14E',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            background: '#F2C14E',
            color: '#111',
            border: 'none',
            borderRadius: 8,
            padding: '8px 14px',
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
          }}
        >
          BACK TO CHAT
        </button>
        <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: '.08em' }}>HIVE OFFICE</div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 16,
          padding: 20,
          overflow: 'auto',
          minHeight: 0,
        }}
      >
        {DESKS.map((d) => (
          <div
            key={d.name}
            style={{
              background: '#1a1712',
              color: '#fff',
              borderRadius: 16,
              padding: 20,
              border: `3px solid ${d.color}`,
              minHeight: 120,
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: d.color, marginBottom: 10 }} />
            <div style={{ fontSize: 22, fontWeight: 800 }}>{d.name}</div>
            <div style={{ color: '#c4b396', marginTop: 4 }}>{d.job}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#111', color: '#f3eee4', padding: 12, flexShrink: 0, height: 200, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {log.map((line, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              {line}
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Task the floor…"
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#1a1712', color: '#fff', fontFamily: 'inherit' }}
          />
          <button type="submit" disabled={busy} style={{ background: '#F2C14E', color: '#111', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
