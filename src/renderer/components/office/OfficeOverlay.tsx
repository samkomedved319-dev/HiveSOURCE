import React, { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import { FLOOR_CREW, moodFromEvent, type AgentMood } from './crew'
import type { HiveSwarmEvent } from '../../types'
import { useAgentStore } from '../../stores/agentStore'
import { useChatStore } from '../../stores/chatStore'
import { emitTitleChat } from '../../chatTitle'

const Office3D = lazy(() => import('./Office3D'))

class Gate extends Component<{ children: React.ReactNode; fallback: React.ReactNode }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() {
    return { err: true }
  }
  componentDidCatch() {
    this.setState({ err: true })
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children
  }
}

function pickSpeaker(task: string) {
  const t = task.toLowerCase()
  if (/\b(search|web|find|news|who is|what is|lookup)\b/.test(t)) return 'Scout'
  if (/\b(code|fix|build|bug|file|repo|script)\b/.test(t)) return 'Apollo'
  if (/\b(review|critique|wrong|ship)\b/.test(t)) return 'Critic'
  if (/\b(risk|assume|pulse|check)\b/.test(t)) return 'Pulse'
  if (/\b(intel|athena)\b/.test(t)) return 'Athena'
  return 'Hive'
}

function readable(raw: string) {
  let t = raw.replace(/\r/g, '')
  t = t.replace(/```[\s\S]*?```/g, (b) => b.replace(/^```\w*\n?/, '').replace(/```$/, '').trim())
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
  t = t.replace(/`([^`]+)`/g, '$1').replace(/^\s*[-*]\s+/gm, '• ').trim()
  if (t.length > 900) t = t.slice(0, 900) + '…'
  return t
}

function Desks2D({ moods, meeting }: { moods: Record<string, AgentMood>; meeting: boolean }) {
  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14, padding: 18, background: '#d7b57a' }}>
      {FLOOR_CREW.map((a) => {
        const mood = moods[a.id] || moods[a.name.toLowerCase()] || 'idle'
        const live = meeting || mood !== 'idle'
        return (
          <div key={a.id} style={{ background: '#1a1712', border: `3px solid ${a.color}`, borderRadius: 16, padding: 16, color: '#fff' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: a.color, marginBottom: 8 }} />
            <div style={{ fontWeight: 800, fontSize: 18 }}>{a.name}</div>
            <div style={{ color: '#c4b396', fontSize: 12 }}>{live ? mood : a.job}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function OfficeOverlay({ onClose }: { onClose: () => void }) {
  const [moods, setMoods] = useState<Record<string, AgentMood>>({})
  const [meeting, setMeeting] = useState(false)
  const [task, setTask] = useState('')
  const [busy, setBusy] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const speaker = useRef('Hive')
  const { activeAgent } = useAgentStore()
  const addMessage = useChatStore((s) => s.addMessage)
  const thread = useChatStore((s) => (activeAgent ? s.messages[activeAgent.id] : []) || [])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [thread])

  useEffect(() => {
    const off = window.electronAPI?.hive?.onEvent?.((ev: HiveSwarmEvent) => {
      const who = ev.producerName || 'Hive'
      setMoods((p) => ({ ...p, [who.toLowerCase()]: moodFromEvent(ev) }))
      if (ev.type === 'inference.started' || ev.type === 'function_call.started') setMeeting(true)
      if (ev.type === 'model.answer') window.setTimeout(() => setMeeting(false), 2400)
    })
    return () => {
      try {
        off?.()
      } catch {}
    }
  }, [])

  const send = async () => {
    const t = task.trim()
    if (!t || busy) return
    const agentId = activeAgent?.id
    if (!agentId) return
    setBusy(true)
    setTask('')
    setMeeting(true)
    speaker.current = pickSpeaker(t)
    addMessage(agentId, {
      id: `m-${Date.now()}`,
      agentId,
      content: t,
      role: 'user',
      timestamp: Date.now(),
      type: 'text',
      via: 'local',
    })
    emitTitleChat(t)
    try {
      void window.electronAPI?.hive?.send?.(t, 'office')
      const res = await window.electronAPI?.ai?.chat?.(
        [
          {
            role: 'system',
            content: `You are ${speaker.current} at the Hive office. Reply as that one person. Short, useful.`,
          },
          { role: 'user', content: t },
        ],
        undefined,
        { webSearch: speaker.current === 'Scout' }
      )
      addMessage(agentId, {
        id: `m-${Date.now() + 1}`,
        agentId,
        content: readable(res?.content || res?.error || 'No reply.'),
        role: 'assistant',
        timestamp: Date.now(),
        type: 'text',
        via: 'local',
        botName: speaker.current,
        botRole: 'Office',
      })
    } catch (e) {
      addMessage(agentId, {
        id: `m-err-${Date.now()}`,
        agentId,
        content: e instanceof Error ? e.message : 'Send failed',
        role: 'assistant',
        timestamp: Date.now(),
        type: 'text',
        botName: 'Office',
      })
    }
    setMeeting(false)
    setBusy(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        background: '#1c1812',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          height: 52,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 14px',
          background: '#111',
          color: '#F2C14E',
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
          }}
        >
          BACK TO CHAT
        </button>
        <div style={{ fontWeight: 900, letterSpacing: '.08em' }}>HIVE OFFICE</div>
        <div style={{ fontSize: 12, color: '#c4b396' }}>{meeting ? 'Crew moving' : 'Idle · drag to look around'}</div>
      </div>

      <div style={{ flex: 1, minHeight: 280, position: 'relative', background: '#1c1812' }}>
        <Gate fallback={<Desks2D moods={moods} meeting={meeting} />}>
          <Suspense fallback={<Desks2D moods={moods} meeting={meeting} />}>
            <Office3D moods={moods} bubbles={{}} meeting={meeting} />
          </Suspense>
        </Gate>
      </div>

      <div
        style={{
          height: 230,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#111',
          borderTop: '2px solid #F2C14E',
        }}
      >
        <div ref={scroller} style={{ flex: 1, overflow: 'auto', padding: '10px 16px', color: '#f3eee4' }}>
          {thread.length === 0 && <div style={{ color: '#c4b396' }}>Same history as Chat. Named in the sidebar.</div>}
          {thread.map((row) => {
            const who = row.role === 'user' ? 'You' : row.botName || 'Hive'
            const color = FLOOR_CREW.find((a) => a.name === who)?.color
            return (
              <div key={row.id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: color || '#F2C14E' }}>{who}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{row.content}</div>
              </div>
            )
          })}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
          style={{ display: 'flex', gap: 8, padding: '8px 14px 12px' }}
        >
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Task the floor…"
            style={{
              flex: 1,
              background: '#1a1712',
              border: '1px solid #333',
              color: '#fff',
              borderRadius: 8,
              padding: '10px 12px',
              fontFamily: 'inherit',
            }}
          />
          <button type="submit" disabled={busy} style={{ background: '#F2C14E', color: '#111', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
