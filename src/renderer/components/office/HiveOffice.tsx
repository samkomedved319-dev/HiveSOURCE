import React, { Component, useEffect, useRef, useState } from 'react'
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

type FloorMsg = { t: number; who: string; text: string; color?: string }

export default function HiveOffice({ onBack }: { onBack?: () => void; compact?: boolean }) {
  const [moods, setMoods] = useState<Record<string, AgentMood>>({})
  const [log, setLog] = useState<FloorMsg[]>([])
  const [meeting, setMeeting] = useState(false)
  const [task, setTask] = useState('')
  const [busy, setBusy] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [log])

  useEffect(() => {
    const off = window.electronAPI?.hive?.onEvent?.((ev: HiveSwarmEvent) => {
      const who = ev.producerName || 'Hive'
      const key = who.toLowerCase()
      setMoods((p) => ({ ...p, [key]: moodFromEvent(ev) }))
      if (ev.type === 'model.answer' && ev.text) {
        const color = FLOOR_CREW.find((a) => a.name.toLowerCase() === key)?.color
        setLog((p) => [...p, { t: Date.now(), who, text: ev.text.replace(/\s+/g, ' ').trim(), color }].slice(-40))
      }
      if (ev.type === 'inference.started' || ev.type === 'function_call.started') setMeeting(true)
      if (ev.type === 'model.answer' && who === 'Hive') window.setTimeout(() => setMeeting(false), 2800)
    })
    return () => {
      try {
        off?.()
      } catch {}
    }
  }, [])

  const sendTask = async () => {
    const t = task.trim()
    if (!t || busy) return
    setBusy(true)
    setTask('')
    setMeeting(true)
    setLog((p) => [...p, { t: Date.now(), who: 'You', text: t }])
    try {
      await window.electronAPI?.hive?.send?.(t, 'office')
    } catch (e) {
      setLog((p) => [...p, { t: Date.now(), who: 'Office', text: e instanceof Error ? e.message : 'Send failed', color: '#f87171' }])
      setMeeting(false)
    }
    setBusy(false)
  }

  return (
    <div style={{ height: '100%', width: '100%', minHeight: 0, display: 'grid', gridTemplateRows: 'minmax(0,1fr) 240px', background: '#0b0c0e', overflow: 'hidden' }}>
      <div style={{ position: 'relative', minHeight: 0 }}>
        <WebGLGate fallback={<div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>WebGL unavailable</div>}>
          <Office3D moods={moods} bubbles={{}} meeting={meeting} />
        </WebGLGate>
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 8, zIndex: 3 }}>
          {onBack && (
            <button type="button" onClick={onBack} style={{ background: '#141414', border: '1px solid var(--border-soft)', color: 'var(--text)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
              Chat
            </button>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', minHeight: 0, background: '#101114' }}>
        <div style={{ padding: '8px 14px 0', fontSize: 11, letterSpacing: '.12em', color: 'var(--text-faint)' }}>OFFICE</div>
        <div ref={scroller} style={{ flex: 1, overflow: 'auto', padding: '8px 14px', minHeight: 0 }}>
          {log.length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontSize: 13.5, lineHeight: 1.5 }}>
              This chat talks to the floor. They sit and type at idle. On a task they walk to the glass room.
            </div>
          )}
          {log.map((row) => (
            <div key={row.t + row.who} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 650, color: row.color || (row.who === 'You' ? 'var(--text)' : 'var(--accent)') }}>{row.who}</div>
              <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.45, marginTop: 2 }}>{row.text}</div>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void sendTask()
          }}
          style={{ display: 'flex', gap: 8, padding: '8px 12px 12px' }}
        >
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Message the office…"
            style={{
              flex: 1,
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: 10,
              padding: '10px 12px',
              fontFamily: 'inherit',
              fontSize: 14,
            }}
          />
          <button type="submit" disabled={busy} style={{ background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
