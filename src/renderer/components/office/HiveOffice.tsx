import React, { Component, useEffect, useRef, useState } from 'react'
import Office3D, { FLOOR_CREW, moodFromEvent, type AgentMood } from './Office3D'
import type { HiveSwarmEvent } from '../../types'
import { useAgentStore } from '../../stores/agentStore'
import { useChatStore } from '../../stores/chatStore'
import { emitTitleChat } from '../../chatTitle'

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
      const key = who.toLowerCase()
      setMoods((p) => ({ ...p, [key]: moodFromEvent(ev) }))
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
    const agentId = activeAgent?.id
    if (!agentId) return
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
            content: `You are ${speaker.current} at the Hive office. Reply as that one person. Short, useful, no markdown walls, no speaking as other bots.`,
          },
          { role: 'user', content: t },
        ],
        undefined,
        { webSearch: speaker.current === 'Scout' }
      )
      const text = readable(res?.content || res?.error || 'No reply.')
      addMessage(agentId, {
        id: `m-${Date.now() + 1}`,
        agentId,
        content: text,
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
          {thread.length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.5, maxWidth: 640 }}>
              Same thread as Chat. Messages here are saved in the sidebar and named by topic.
            </div>
          )}
          {thread.map((row) => {
            const who = row.role === 'user' ? 'You' : row.botName || 'Hive'
            const color = FLOOR_CREW.find((a) => a.name === who)?.color
            return (
              <div key={row.id} style={{ marginBottom: 14, maxWidth: 720 }}>
                <div style={{ fontSize: 12, fontWeight: 650, color: color || (row.role === 'user' ? 'var(--text)' : 'var(--accent)'), marginBottom: 4 }}>
                  {who}
                </div>
                <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {row.content}
                </div>
              </div>
            )
          })}
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
