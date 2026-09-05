import React, { Component, useEffect, useMemo, useState } from 'react'
import Office3D, { moodFromEvent, type AgentMood } from './Office3D'
import type { HiveSwarmEvent } from '../../types'

class WebGLGate extends Component<{ children: React.ReactNode; fallback: React.ReactNode }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() {
    return { err: true }
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children
  }
}

export default function HiveOffice({ onBack, compact = false }: { onBack?: () => void; compact?: boolean }) {
  const [moods, setMoods] = useState<Record<string, AgentMood>>({})
  const [bubbles, setBubbles] = useState<Record<string, string>>({})
  const [log, setLog] = useState<{ t: number; who: string; text: string }[]>([])
  const [meeting, setMeeting] = useState(false)
  const [task, setTask] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const off = window.electronAPI?.hive?.onEvent?.((ev: HiveSwarmEvent) => {
      const who = ev.producerName || 'Hive'
      const key = who.toLowerCase()
      setMoods((p) => ({ ...p, [key]: moodFromEvent(ev) }))
      if (ev.text && (ev.type === 'model.answer' || ev.type === 'inference.stream')) {
        const snippet = ev.text.replace(/\s+/g, ' ').slice(0, 110)
        setBubbles((p) => ({ ...p, [key]: snippet }))
        if (ev.type === 'model.answer') setLog((p) => [{ t: Date.now(), who, text: snippet }, ...p].slice(0, 30))
      }
      if (ev.type === 'inference.started' || ev.type === 'function_call.started') setMeeting(true)
      if (ev.type === 'model.answer' && who === 'Hive') window.setTimeout(() => setMeeting(false), 2200)
    })
    return () => {
      try {
        off?.()
      } catch {}
    }
  }, [])

  const live = useMemo(() => Object.values(moods).some((m) => m !== 'idle' && m !== 'done'), [moods])

  const sendTask = async () => {
    const t = task.trim()
    if (!t || busy) return
    setBusy(true)
    setTask('')
    setMeeting(true)
    setLog((p) => [{ t: Date.now(), who: 'You', text: t }, ...p])
    try {
      await window.electronAPI?.hive?.send?.(t, 'office')
    } catch {}
    setBusy(false)
  }

  const fallback = (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-dim)', padding: 24, textAlign: 'center' }}>
      3D office needs WebGL. Drag to orbit once GPU is available.
    </div>
  )

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', background: '#0b0c0e', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: 48, borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
        {onBack && (
          <button type="button" onClick={onBack} style={{ background: 'transparent', border: '1px solid var(--border-soft)', color: 'var(--text-dim)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Back
          </button>
        )}
        <div style={{ fontWeight: 700, letterSpacing: '.06em' }}>HIVE OFFICE</div>
        <div style={{ fontSize: 12, color: live ? 'var(--accent)' : 'var(--text-faint)' }}>
          {live ? '3D floor live · drag to orbit · scroll to zoom' : '3D isometric floor · drag to look around'}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ width: 8, height: 8, borderRadius: 99, background: live ? '#10b981' : 'var(--text-faint)' }} />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 260px', overflow: 'hidden' }}>
        <div style={{ position: 'relative', minHeight: 0, height: '100%' }}>
          <WebGLGate fallback={fallback}>
            <Office3D moods={moods} bubbles={bubbles} meeting={meeting} />
          </WebGLGate>
          {!compact && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void sendTask()
              }}
              style={{
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: 14,
                display: 'flex',
                gap: 8,
                zIndex: 8,
              }}
            >
              <input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Give the floor a task — they walk to the table, search, and type"
                style={{
                  flex: 1,
                  background: 'rgba(20,18,14,.92)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontFamily: 'inherit',
                  fontSize: 14,
                }}
              />
              <button type="submit" disabled={busy} style={{ background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Send
              </button>
            </form>
          )}
        </div>

        {!compact && (
          <div style={{ borderLeft: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', minHeight: 0, background: '#101114' }}>
            <div style={{ padding: 14, fontSize: 12, fontWeight: 700, letterSpacing: '.08em', color: 'var(--text-dim)' }}>FLOOR LOG</div>
            <div style={{ flex: 1, overflow: 'auto', padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {log.length === 0 && (
                <div style={{ color: 'var(--text-faint)', fontSize: 13.5, lineHeight: 1.55 }}>
                  Search lab, talk table, dev desks, review. Agents walk in 3D when a task starts. Chat sits on the right.
                </div>
              )}
              {log.map((row) => (
                <div key={row.t + row.who} className="hive-write" style={{ fontSize: 13.5, borderBottom: '1px solid var(--border-soft)', paddingBottom: 8 }}>
                  <div style={{ color: 'var(--accent)', fontWeight: 650 }}>{row.who}</div>
                  <div style={{ color: 'var(--text)', marginTop: 4, lineHeight: 1.5 }}>{row.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
