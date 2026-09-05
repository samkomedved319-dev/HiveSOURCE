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

function readable(raw: string) {
  let t = raw.replace(/\r/g, '')
  t = t.replace(/```[\s\S]*?```/g, (block) => {
    const inner = block.replace(/^```\w*\n?/, '').replace(/```$/, '').trim()
    return inner.length > 280 ? inner.slice(0, 280) + '…' : inner
  })
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, '')
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1')
  t = t.replace(/\*([^*]+)\*/g, '$1')
  t = t.replace(/`([^`]+)`/g, '$1')
  t = t.replace(/^\s*[-*]\s+/gm, '• ')
  t = t.replace(/\n{3,}/g, '\n\n')
  t = t.replace(/[ \t]+\n/g, '\n').trim()
  if (t.length > 900) t = t.slice(0, 900).replace(/\s+\S*$/, '') + '…'
  return t
}

export default function HiveOffice({ onBack }: { onBack?: () => void; compact?: boolean }) {
  const [moods, setMoods] = useState<Record<string, AgentMood>>({})
  const [log, setLog] = useState<FloorMsg[]>([])
  const [meeting, setMeeting] = useState(false)
  const [task, setTask] = useState('')
  const [busy, setBusy] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const drafts = useRef<Record<string, string>>({})

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [log])

  useEffect(() => {
    const off = window.electronAPI?.hive?.onEvent?.((ev: HiveSwarmEvent) => {
      const who = ev.producerName || 'Hive'
      const key = who.toLowerCase()
      setMoods((p) => ({ ...p, [key]: moodFromEvent(ev) }))
      if (ev.type === 'inference.stream' && ev.text) {
        drafts.current[who] = (drafts.current[who] || '') + ev.text
      }
      if (ev.type === 'model.answer') {
        const raw = (ev.text || drafts.current[who] || '').trim()
        delete drafts.current[who]
        const text = readable(raw)
        if (!text) return
        const color = FLOOR_CREW.find((a) => a.name.toLowerCase() === key)?.color
        setLog((p) => {
          const last = p[p.length - 1]
          if (last && last.who === who && last.text === text) return p
          return [...p, { t: Date.now(), who, text, color }].slice(-24)
        })
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
    <div style={{ height: '100%', width: '100%', minHeight: 0, display: 'grid', gridTemplateRows: 'minmax(0,1fr) 280px', background: '#0b0c0e', overflow: 'hidden' }}>
      <div style={{ position: 'relative', minHeight: 0 }}>
        <WebGLGate fallback={<div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>WebGL unavailable</div>}>
          <Office3D moods={moods} bubbles={{}} meeting={meeting} />
        </WebGLGate>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{ position: 'absolute', top: 10, left: 10, zIndex: 3, background: '#141414', border: '1px solid var(--border-soft)', color: 'var(--text)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
          >
            Chat
          </button>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', minHeight: 0, background: '#101114' }}>
        <div ref={scroller} style={{ flex: 1, overflow: 'auto', padding: '14px 18px 8px', minHeight: 0 }}>
          {log.length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.5, maxWidth: 640 }}>
              Floor chat. Idle they sit. A task sends them to the glass room. Replies land here, not in the main thread.
            </div>
          )}
          {log.map((row) => (
            <div key={row.t + row.who} style={{ marginBottom: 14, maxWidth: 720 }}>
              <div style={{ fontSize: 12, fontWeight: 650, letterSpacing: '.02em', color: row.color || (row.who === 'You' ? 'var(--text)' : 'var(--accent)'), marginBottom: 4 }}>
                {row.who}
              </div>
              <div
                style={{
                  fontSize: 15,
                  color: 'var(--text)',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                }}
              >
                {row.text}
              </div>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void sendTask()
          }}
          style={{ display: 'flex', gap: 8, padding: '8px 14px 14px' }}
        >
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Task the floor…"
            style={{
              flex: 1,
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: 10,
              padding: '11px 14px',
              fontFamily: 'inherit',
              fontSize: 15,
            }}
          />
          <button type="submit" disabled={busy} style={{ background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 10, padding: '11px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
