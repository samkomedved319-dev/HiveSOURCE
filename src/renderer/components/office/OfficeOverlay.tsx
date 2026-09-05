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
  t = t.replace(/```[\s\S]*?```/g, (b) => b.replace(/^```\w*\n?/, '').replace(/```$/, '').trim())
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
  t = t.replace(/`([^`]+)`/g, '$1').replace(/^\s*[-*]\s+/gm, '• ').trim()
  if (t.length > 900) t = t.slice(0, 900) + '…'
  return t
}

const DESK_POS = [
  { left: 8, top: 10 },
  { left: 38, top: 10 },
  { left: 68, top: 10 },
  { left: 8, top: 48 },
  { left: 38, top: 48 },
  { left: 68, top: 48 },
]

function IsoOffice({ moods, meeting }: { moods: Record<string, AgentMood>; meeting: boolean }) {
  return (
    <div
      style={{
        height: '100%',
        minHeight: 280,
        background: 'radial-gradient(ellipse at 50% 20%, #5a4a32 0%, #2a2218 55%, #16130e 100%)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '46%',
          width: 640,
          height: 420,
          marginLeft: -320,
          marginTop: -210,
          transform: 'rotateX(56deg) rotateZ(-32deg)',
          transformStyle: 'preserve-3d',
          background:
            'repeating-linear-gradient(90deg, rgba(0,0,0,.08) 0 2px, transparent 2px 48px), repeating-linear-gradient(0deg, rgba(0,0,0,.08) 0 2px, transparent 2px 48px), #c9a66b',
          boxShadow: '0 40px 80px rgba(0,0,0,.45)',
          border: '8px solid #8a6a3a',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 18,
            transform: 'translateX(-50%)',
            width: 160,
            height: 70,
            background: meeting ? 'rgba(242,193,78,.55)' : 'rgba(20,20,24,.75)',
            border: '2px solid #F2C14E',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          {meeting ? 'MEETING' : 'GLASS ROOM'}
        </div>
        {FLOOR_CREW.map((a, i) => {
          const mood = moods[a.id] || moods[a.name.toLowerCase()] || 'idle'
          const live = meeting || mood !== 'idle'
          const pos = DESK_POS[i]
          const goMeet = live && meeting
          return (
            <div
              key={a.id}
              style={{
                position: 'absolute',
                left: goMeet ? `${28 + (i % 3) * 14}%` : `${pos.left}%`,
                top: goMeet ? `${8 + Math.floor(i / 3) * 8}%` : `${pos.top}%`,
                width: 120,
                height: 88,
                transition: 'left .8s ease, top .8s ease',
              }}
            >
              <div style={{ width: 110, height: 52, background: '#6b5340', border: '2px solid #3d2e22', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 18, top: -18, width: 74, height: 22, background: '#111', border: `2px solid ${a.color}` }} />
              </div>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: a.color,
                  margin: '6px auto 0',
                  boxShadow: live ? `0 0 14px ${a.color}` : 'none',
                  animation: live ? 'hive-bob .45s ease-in-out infinite alternate' : 'none',
                }}
              />
              <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#1a1712', marginTop: 2 }}>{a.name}</div>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes hive-bob { from { transform: translateY(0) } to { transform: translateY(-6px) } }`}</style>
    </div>
  )
}

export default function OfficeOverlay({ onClose }: { onClose: () => void }) {
  const [moods, setMoods] = useState<Record<string, AgentMood>>({})
  const [meeting, setMeeting] = useState(false)
  const [task, setTask] = useState('')
  const [busy, setBusy] = useState(false)
  const [world, setWorld] = useState<'hive' | 'delegation'>('hive')
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
          { role: 'system', content: `You are ${speaker.current} at the Hive office. Reply as that one person. Short, useful.` },
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', background: '#2a2218', fontFamily: 'inherit' }}>
      <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', background: '#111', color: '#F2C14E' }}>
        <button type="button" onClick={onClose} style={goldBtn}>
          BACK TO CHAT
        </button>
        <div style={{ fontWeight: 900, letterSpacing: '.08em' }}>HIVE OFFICE</div>
        <button type="button" onClick={() => setWorld('hive')} style={world === 'hive' ? goldBtn : ghostBtn}>
          Floor
        </button>
        <button type="button" onClick={() => setWorld('delegation')} style={world === 'delegation' ? goldBtn : ghostBtn}>
          The Delegation 3D
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 240, position: 'relative', background: '#2a2218' }}>
        {world === 'delegation' ? (
          <iframe
            title="The Delegation"
            src="https://arturitu.github.io/the-delegation/"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', background: '#111' }}
          />
        ) : (
          <IsoOffice moods={moods} meeting={meeting} />
        )}
      </div>

      <div style={{ height: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#111', borderTop: '2px solid #F2C14E' }}>
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
            style={{ flex: 1, background: '#1a1712', border: '1px solid #333', color: '#fff', borderRadius: 8, padding: '10px 12px', fontFamily: 'inherit' }}
          />
          <button type="submit" disabled={busy} style={goldBtn}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

const goldBtn: React.CSSProperties = {
  background: '#F2C14E',
  color: '#111',
  border: 'none',
  borderRadius: 8,
  padding: '8px 14px',
  fontWeight: 800,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent',
  color: '#c4b396',
  border: '1px solid #3d3428',
  borderRadius: 8,
  padding: '8px 14px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
