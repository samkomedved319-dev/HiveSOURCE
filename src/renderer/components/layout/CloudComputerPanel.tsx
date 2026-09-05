import React, { useEffect, useState } from 'react'

type CloudSnap = {
  ok?: boolean
  kind?: string
  files?: string[]
  logs?: string[]
  jobs?: { agent?: string; status?: string; output?: string }[]
  error?: string
}

export default function CloudComputerPanel({ onClose }: { onClose: () => void }) {
  const [snap, setSnap] = useState<CloudSnap | null>(null)
  const [cmd, setCmd] = useState('ls')
  const [out, setOut] = useState('')

  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const r = await window.electronAPI?.cloud?.status?.()
        if (alive) setSnap(r || { ok: false, error: 'Cloud API missing' })
      } catch (e) {
        if (alive) setSnap({ ok: false, error: String(e) })
      }
    }
    tick()
    const id = setInterval(tick, 2000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  const run = async () => {
    const r = await window.electronAPI?.cloud?.exec?.(cmd)
    setOut(JSON.stringify(r?.output || r, null, 2).slice(0, 2000))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#050608', color: '#c8f7c5', fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #1c3320', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7CFF8A', letterSpacing: '.08em' }}>HIVEBOX · LIVE</div>
          <div style={{ fontSize: 10, color: '#6a8f6e' }}>{snap?.ok ? snap.kind || 'online' : snap?.error || 'offline'}</div>
        </div>
        <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid #1c3320', color: '#8fbf93', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>
          Close
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12, fontSize: 11, lineHeight: 1.55 }}>
        <div style={{ color: '#7CFF8A', marginBottom: 8 }}>disk</div>
        {(snap?.files || []).length ? (snap?.files || []).map((f) => <div key={f}>· {f}</div>) : <div style={{ color: '#4d6b50' }}>(empty)</div>}
        <div style={{ color: '#7CFF8A', margin: '14px 0 8px' }}>jobs</div>
        {(snap?.jobs || []).slice(-8).map((j, i) => (
          <div key={i}>
            {j.agent} · {j.status} {j.output ? `— ${String(j.output).slice(0, 80)}` : ''}
          </div>
        ))}
        <div style={{ color: '#7CFF8A', margin: '14px 0 8px' }}>log</div>
        {(snap?.logs || []).slice(-16).map((l, i) => (
          <div key={i} style={{ color: '#8fbf93' }}>
            {l}
          </div>
        ))}
        {out ? (
          <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap', color: '#d5ffd2' }}>{out}</pre>
        ) : null}
      </div>
      <div style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid #1c3320' }}>
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          style={{ flex: 1, background: '#0b120c', border: '1px solid #1c3320', color: '#c8f7c5', borderRadius: 6, padding: '6px 8px', fontSize: 11 }}
        />
        <button type="button" onClick={run} style={{ background: '#16351a', border: '1px solid #2a5a30', color: '#7CFF8A', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 11 }}>
          Run
        </button>
      </div>
    </div>
  )
}
