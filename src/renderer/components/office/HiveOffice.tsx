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
  t = t.replace(/\n{3,}/g, '\n\n')
  t = t.replace(/[ \t]+\n/g, '\n').trim()
  if (t.length > 900) t = t.slice(0, 900).replace(/\s+\S*$/, '') + '…'
  return t
}

function Floor2D({ moods, meeting }: { moods: Record<string, AgentMood>; meeting: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #2a2418 0%, #1a1712 40%, #12100c 100%)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 24,
          borderRadius: 16,
          background:
            'repeating-linear-gradient(90deg, #3d3428 0 2px, transparent 2px 48px), repeating-linear-gradient(0deg, #3d3428 0 2px, transparent 2px 48px), #c4b396',
          boxShadow: 'inset 0 0 80px rgba(0,0,0,.35)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 36,
          transform: 'translateX(-50%)',
          width: 220,
          height: 90,
          borderRadius: 12,
          background: meeting ? 'rgba(242,193,78,.28)' : 'rgba(20,22,28,.7)',
          border: '1px solid rgba(242,193,78,.45)',
          color: '#f5e6b8',
          display: 'grid',
          placeItems: 'center',
          fontSize: 13,
          fontWeight: 650,
        }}
      >
        {meeting ? 'Glass room · working' : 'Glass room'}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 40,
          right: 40,
          bottom: 28,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 14,
        }}
      >
        {FLOOR_CREW.map((a) => {
          const mood = moods[a.id] || moods[a.name.toLowerCase()] || 'idle'
          const live = meeting || mood !== 'idle'
          return (
            <div
              key={a.id}
              style={{
                background: '#1c1a16',
                border: `1px solid ${live ? a.color : 'var(--border-soft)'}`,
                borderRadius: 12,
                padding: '12px 12px 10px',
                minHeight: 88,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: a.color,
                    boxShadow: live ? `0 0 12px ${a.color}` : 'none',
                  }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: '#b8b0a0' }}>{live ? mood : 'at desk'}</div>
                </div>
              </div>
              <div style={{ marginTop: 8, height: 6, borderRadius: 4, background: '#2a2722' }}>
                <div
                  style={{
                    width: live ? '70%' : '12%',
                    height: '100%',
                    borderRadius: 4,
                    background: a.color,
                    transition: 'width .4s',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
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
    <div
      style={{
        height: '100%',
        width: '100%',
        minHeight: 0,
        display: 'grid',
        gridTemplateRows: 'minmax(200px, 1fr) 240px',
        background: '#16130e',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', minHeight: 200 }}>
        <Floor2D moods={moods} meeting={meeting} />
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 4,
              background: '#141414',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
            }}
          >
            ← Chat
          </button>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', minHeight: 0, background: '#101114' }}>
        <div ref={scroller} style={{ flex: 1, overflow: 'auto', padding: '14px 18px 8px', minHeight: 0 }}>
          {thread.length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.5 }}>
              Floor chat is the same history as Chat. Named in the sidebar.
            </div>
          )}
          {thread.map((row) => {
            const who = row.role === 'user' ? 'You' : row.botName || 'Hive'
            const color = FLOOR_CREW.find((a) => a.name === who)?.color
            return (
              <div key={row.id} style={{ marginBottom: 12, maxWidth: 720 }}>
                <div style={{ fontSize: 12, fontWeight: 650, color: color || (row.role === 'user' ? 'var(--text)' : 'var(--accent)'), marginBottom: 4 }}>
                  {who}
                </div>
                <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{row.content}</div>
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
