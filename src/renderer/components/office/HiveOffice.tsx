import React, { Component, useEffect, useMemo, useState } from 'react'
import Office3D, { FLOOR_CREW, moodFromEvent, type AgentMood } from './Office3D'
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

export default function HiveOffice({ onBack }: { onBack?: () => void; compact?: boolean }) {
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
        const snippet = ev.text.replace(/\s+/g, ' ').slice(0, 90)
        setBubbles((p) => ({ ...p, [key]: snippet }))
        if (ev.type === 'model.answer') setLog((p) => [{ t: Date.now(), who, text: snippet }, ...p].slice(0, 16))
      }
      if (ev.type === 'inference.started' || ev.type === 'function_call.started') setMeeting(true)
      if (ev.type === 'model.answer' && who === 'Hive') window.setTimeout(() => setMeeting(false), 2400)
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

  return (
    <div style={{ height: '100%', width: '100%', minHeight: 0, minWidth: 0, position: 'relative', overflow: 'hidden', background: '#0b0c0e', flex: 1 }}>
      <WebGLGate
        fallback={
          <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>
            WebGL unavailable
          </div>
        }
      >
        <Office3D moods={moods} bubbles={bubbles} meeting={meeting} />
      </WebGLGate>

      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          pointerEvents: 'none',
          zIndex: 4,
        }}
      >
        {onBack && (
          <button type="button" onClick={onBack} style={{ pointerEvents: 'auto', background: 'rgba(11,12,14,.78)', border: '1px solid var(--border-soft)', color: 'var(--text)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ←
          </button>
        )}
        <div style={{ background: 'rgba(11,12,14,.78)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <b style={{ letterSpacing: '.08em', fontSize: 12 }}>HIVE OFFICE</b>
          <span style={{ fontSize: 12, color: live ? 'var(--accent)' : 'var(--text-faint)' }}>
            {live ? 'live · walking · typing' : 'drag to orbit · scroll to zoom'}
          </span>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: live ? '#10b981' : 'var(--text-faint)' }} />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ pointerEvents: 'none', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {FLOOR_CREW.map((a) => {
            const mood = moods[a.id] || moods[a.name.toLowerCase()] || 'idle'
            return (
              <div key={a.id} style={{ background: 'rgba(11,12,14,.78)', border: `1px solid ${mood === 'idle' ? 'var(--border-soft)' : a.color}`, borderRadius: 8, padding: '4px 8px', fontSize: 11 }}>
                <span style={{ color: a.color, fontWeight: 700 }}>{a.name}</span>
                <span style={{ color: 'var(--text-faint)', marginLeft: 6 }}>{mood === 'idle' ? a.job : mood}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 58,
          width: 240,
          maxHeight: 180,
          overflow: 'auto',
          background: 'rgba(11,12,14,.82)',
          border: '1px solid var(--border-soft)',
          borderRadius: 10,
          padding: 10,
          zIndex: 4,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--text-faint)', marginBottom: 6 }}>FLOOR</div>
        {log.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.45 }}>Give a task. Agents walk to the glass room, screens light up, legs swing.</div>}
        {log.slice(0, 6).map((row) => (
          <div key={row.t + row.who} style={{ fontSize: 12, marginBottom: 6 }}>
            <b style={{ color: 'var(--accent)' }}>{row.who}</b>
            <div style={{ color: 'var(--text-dim)' }}>{row.text}</div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void sendTask()
        }}
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          display: 'flex',
          gap: 8,
          zIndex: 5,
        }}
      >
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Task the floor — they walk, meet, and work"
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
    </div>
  )
}
