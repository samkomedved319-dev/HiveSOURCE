import React, { useEffect, useRef, useState } from 'react'
import { FLOOR_CREW, moodFromEvent, type AgentMood } from './crew'
import type { HiveSwarmEvent } from '../../types'
import { useAgentStore } from '../../stores/agentStore'
import { useChatStore } from '../../stores/chatStore'
import { emitTitleChat } from '../../chatTitle'

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
  t = t.replace(/\n{3,}/g, '\n\n').trim()
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
      setMoods((p) => ({ ...p, [who.toLowerCase()]: moodFromEvent(ev) }))
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
            content: `You are ${speaker.current} at the Hive office. Reply as that one person. Short and useful.`,
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
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        background: '#c9a66b',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 14px',
          background: '#1a1712',
          color: '#f5e6b8',
          borderBottom: '1px solid #3d3428',
        }}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              background: '#F2C14E',
              color: '#111',
              border: 'none',
              borderRadius: 8,
              padding: '7px 12px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
            }}
          >
            ← Chat
          </button>
        )}
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '.04em' }}>HIVE OFFICE</div>
        <div style={{ fontSize: 12, color: '#c4b396' }}>{meeting ? 'Crew is working' : 'Everyone at desks'}</div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 160,
          overflow: 'auto',
          padding: 18,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 14,
          alignContent: 'start',
          background:
            'repeating-linear-gradient(90deg, rgba(0,0,0,.06) 0 1px, transparent 1px 40px), repeating-linear-gradient(0deg, rgba(0,0,0,.06) 0 1px, transparent 1px 40px), #d7b57a',
        }}
      >
        {FLOOR_CREW.map((a) => {
          const mood = moods[a.id] || moods[a.name.toLowerCase()] || 'idle'
          const live = meeting || mood !== 'idle'
          return (
            <div
              key={a.id}
              style={{
                background: '#241f18',
                border: `2px solid ${live ? a.color : '#3d3428'}`,
                borderRadius: 14,
                padding: 14,
                minHeight: 110,
                boxShadow: live ? `0 0 18px ${a.color}` : '0 8px 18px rgba(0,0,0,.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: a.color,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{a.name}</div>
                  <div style={{ color: '#d7c4a0', fontSize: 12 }}>{a.job}</div>
                </div>
              </div>
              <div style={{ marginTop: 12, color: live ? a.color : '#9a8b74', fontSize: 12, fontWeight: 650 }}>
                {live ? mood : 'at desk'}
              </div>
            </div>
          )
        })}
      </div>

      <div
        style={{
          flexShrink: 0,
          height: 230,
          display: 'flex',
          flexDirection: 'column',
          background: '#141210',
          borderTop: '2px solid #F2C14E',
        }}
      >
        <div ref={scroller} style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
          {thread.length === 0 && (
            <div style={{ color: '#c4b396', fontSize: 14 }}>Same chat as the Chat tab. Give the floor a task.</div>
          )}
          {thread.map((row) => {
            const who = row.role === 'user' ? 'You' : row.botName || 'Hive'
            const color = FLOOR_CREW.find((a) => a.name === who)?.color
            return (
              <div key={row.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: color || '#F2C14E' }}>{who}</div>
                <div style={{ fontSize: 14, color: '#f3eee4', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{row.content}</div>
              </div>
            )
          })}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void sendTask()
          }}
          style={{ display: 'flex', gap: 8, padding: '8px 14px 12px' }}
        >
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Task the floor…"
            style={{
              flex: 1,
              background: '#1c1914',
              border: '1px solid #3d3428',
              color: '#fff',
              borderRadius: 10,
              padding: '10px 12px',
              fontFamily: 'inherit',
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            disabled={busy}
            style={{
              background: '#F2C14E',
              color: '#111',
              border: 'none',
              borderRadius: 10,
              padding: '10px 16px',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
