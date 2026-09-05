import React, { useEffect, useMemo, useState } from 'react'
import BloubEngineAvatar from '../mascot/BloubEngineAvatar'
import { getMascot } from '../mascot/mascotLibrary'
import type { StateId } from '../../bot/states'
import type { HiveSwarmEvent } from '../../types'

type AgentMood = 'idle' | 'thinking' | 'searching' | 'talking' | 'coding' | 'done'

type DeskAgent = {
  id: string
  name: string
  mascot: string
  job: string
  room: 'search' | 'talk' | 'code' | 'review'
  desk: { x: number; y: number }
  meet: { x: number; y: number }
}

const CREW: DeskAgent[] = [
  { id: 'scout', name: 'Scout', mascot: 'bloub-blue', job: 'search the web', room: 'search', desk: { x: 14, y: 42 }, meet: { x: 46, y: 50 } },
  { id: 'athena', name: 'Athena', mascot: 'bloub-blue', job: 'intel', room: 'search', desk: { x: 22, y: 62 }, meet: { x: 42, y: 56 } },
  { id: 'hive', name: 'Hive', mascot: 'bloub-gold', job: 'lead', room: 'talk', desk: { x: 50, y: 28 }, meet: { x: 50, y: 48 } },
  { id: 'pulse', name: 'Pulse', mascot: 'bloub-rose', job: 'check facts', room: 'talk', desk: { x: 62, y: 38 }, meet: { x: 56, y: 52 } },
  { id: 'apollo', name: 'Apollo', mascot: 'bloub-orange', job: 'write code', room: 'code', desk: { x: 82, y: 36 }, meet: { x: 58, y: 48 } },
  { id: 'critic', name: 'Critic', mascot: 'bloub-violet', job: 'review', room: 'review', desk: { x: 78, y: 72 }, meet: { x: 54, y: 60 } },
]

const POSE: Record<AgentMood, StateId> = {
  idle: 'idle',
  thinking: 'thinking',
  searching: 'orbit',
  talking: 'exclaim',
  coding: 'thinking',
  done: 'idle',
}

function moodFromEvent(ev: HiveSwarmEvent): AgentMood {
  if (ev.type === 'function_call.started') return 'searching'
  if (ev.type === 'inference.started' || ev.type === 'inference.stream') {
    return ev.producerName === 'Apollo' ? 'coding' : 'thinking'
  }
  if (ev.type === 'model.answer') return 'talking'
  return 'idle'
}

function Room({
  label,
  left,
  top,
  width,
  height,
  live,
}: {
  label: string
  left: string
  top: string
  width: string
  height: string
  live?: boolean
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        border: `1px solid ${live ? 'rgba(242,193,78,0.45)' : 'rgba(242,193,78,0.16)'}`,
        background: live ? 'rgba(242,193,78,0.06)' : 'rgba(10,10,12,0.35)',
        borderRadius: 12,
        animation: live ? 'office-glow 2.4s ease-in-out infinite' : undefined,
      }}
    >
      <div style={{ position: 'absolute', top: 8, left: 12, fontSize: 11, letterSpacing: '.12em', color: 'var(--accent)', fontWeight: 700 }}>
        {label}
      </div>
    </div>
  )
}

function Monitor({ mood }: { mood: AgentMood }) {
  const coding = mood === 'coding' || mood === 'thinking'
  const searching = mood === 'searching'
  return (
    <div
      style={{
        width: 54,
        height: 36,
        margin: '0 auto 4px',
        background: '#0a0b0d',
        border: '1px solid rgba(242,193,78,0.35)',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 8px 16px rgba(0,0,0,.4)',
      }}
    >
      <div style={{ height: 8, background: '#1a1814', fontSize: 7, color: 'var(--accent)', padding: '0 4px' }}>
        {searching ? 'search' : coding ? 'editor' : 'idle'}
      </div>
      <div
        style={{
          height: '100%',
          backgroundImage: coding
            ? 'repeating-linear-gradient(180deg, rgba(242,193,78,0.25) 0 2px, transparent 2px 8px)'
            : searching
              ? 'radial-gradient(circle at 30% 40%, rgba(91,141,239,.5), transparent 55%)'
              : 'linear-gradient(#14120e, #0d0e11)',
          backgroundSize: '100% 48px',
          animation: coding ? 'office-screen 1.2s linear infinite' : undefined,
        }}
      />
      {(coding || mood === 'talking') && (
        <span
          style={{
            position: 'absolute',
            bottom: 4,
            left: 6,
            width: 6,
            height: 10,
            background: 'var(--accent)',
            animation: 'office-type .7s steps(1) infinite',
          }}
        />
      )}
    </div>
  )
}

export default function HiveOffice({ onBack, compact = false }: { onBack?: () => void; compact?: boolean }) {
  const [moods, setMoods] = useState<Record<string, AgentMood>>({})
  const [bubbles, setBubbles] = useState<Record<string, string>>({})
  const [log, setLog] = useState<{ t: number; who: string; text: string }[]>([])
  const [focus, setFocus] = useState<string | null>(null)
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
        if (ev.type === 'model.answer') {
          setLog((p) => [{ t: Date.now(), who, text: snippet }, ...p].slice(0, 30))
        }
      }
      if (ev.type === 'inference.started' || ev.type === 'function_call.started') setMeeting(true)
      if (ev.type === 'model.answer' && who === 'Hive') {
        window.setTimeout(() => setMeeting(false), 2200)
      }
    })
    return () => {
      try {
        off?.()
      } catch {}
    }
  }, [])

  const live = useMemo(() => Object.values(moods).some((m) => m !== 'idle' && m !== 'done'), [moods])
  const roomLive = (room: DeskAgent['room']) =>
    CREW.some((a) => a.room === room && (moods[a.name.toLowerCase()] || moods[a.id] || 'idle') !== 'idle')

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
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', background: '#0b0c0e', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: 48, borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
        {onBack && (
          <button type="button" onClick={onBack} style={{ background: 'transparent', border: '1px solid var(--border-soft)', color: 'var(--text-dim)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Chat
          </button>
        )}
        <div style={{ fontWeight: 700, letterSpacing: '.06em' }}>HIVE OFFICE</div>
        <div style={{ fontSize: 12, color: live ? 'var(--accent)' : 'var(--text-faint)' }}>
          {live ? 'live floor · walking · talking · typing' : 'floor idle · give them a task'}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ width: 8, height: 8, borderRadius: 99, background: live ? '#10b981' : 'var(--text-faint)' }} />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 280px', overflow: 'hidden' }}>
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(ellipse at 50% 0%, rgba(242,193,78,0.12), transparent 50%),
                linear-gradient(180deg, #16140f 0%, #0b0c0e 75%)
              `,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '4%',
              right: '4%',
              top: '8%',
              bottom: compact ? '8%' : '16%',
              background: `
                repeating-linear-gradient(90deg, transparent 0 39px, rgba(242,193,78,0.04) 39px 40px),
                repeating-linear-gradient(0deg, transparent 0 39px, rgba(242,193,78,0.04) 39px 40px),
                linear-gradient(180deg, #1c1914, #12110e)
              `,
              transform: 'perspective(1400px) rotateX(14deg)',
              transformOrigin: 'center top',
              borderRadius: 14,
              border: '1px solid rgba(242,193,78,0.14)',
            }}
          >
            <Room label="SEARCH LAB" left="3%" top="10%" width="28%" height="52%" live={roomLive('search')} />
            <Room label="TALK TABLE" left="34%" top="12%" width="32%" height="48%" live={roomLive('talk') || meeting} />
            <Room label="DEV DESKS" left="69%" top="10%" width="28%" height="52%" live={roomLive('code')} />
            <Room label="REVIEW" left="52%" top="66%" width="44%" height="28%" live={roomLive('review')} />
            {roomLive('search') && (
              <div
                style={{
                  position: 'absolute',
                  left: '12%',
                  top: '28%',
                  width: 70,
                  height: 70,
                  border: '1px dashed rgba(91,141,239,.6)',
                  borderRadius: '50%',
                  animation: 'office-scan 4s linear infinite',
                }}
              />
            )}
          </div>

          {CREW.map((a) => {
            const mood = moods[a.name.toLowerCase()] || moods[a.id] || 'idle'
            const pos = meeting && mood !== 'idle' ? a.meet : a.desk
            const m = getMascot(a.mascot)
            const bubble = bubbles[a.name.toLowerCase()] || bubbles[a.id]
            const on = focus === a.id
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setFocus(a.id === focus ? null : a.id)}
                title={`${a.name} · ${a.job}`}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  transition: 'left .85s cubic-bezier(.22,1,.36,1), top .85s cubic-bezier(.22,1,.36,1)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  zIndex: on ? 6 : 3,
                }}
              >
                <Monitor mood={mood} />
                <BloubEngineAvatar
                  size={compact ? 52 : 62}
                  crop={118}
                  ink={m.ink}
                  paper={m.paper}
                  shapeId={m.shape}
                  botState={POSE[mood]}
                  live
                  fps={mood === 'idle' ? 16 : 32}
                />
                <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 650, marginTop: 2 }}>{a.name}</div>
                <div style={{ color: mood === 'idle' ? 'var(--text-faint)' : 'var(--accent)', fontSize: 11 }}>
                  {mood === 'idle' ? a.job : mood}
                </div>
                {bubble && mood !== 'idle' && (
                  <div
                    className="hive-write"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: '100%',
                      transform: 'translateX(-50%)',
                      width: 180,
                      background: '#1b1914',
                      border: '1px solid var(--accent-dim)',
                      color: 'var(--text)',
                      fontSize: 12,
                      lineHeight: 1.4,
                      padding: '8px 10px',
                      borderRadius: 10,
                      textAlign: 'left',
                      boxShadow: '0 8px 20px rgba(0,0,0,.4)',
                    }}
                  >
                    {bubble}
                    {(mood === 'thinking' || mood === 'coding' || mood === 'talking') && (
                      <span style={{ display: 'inline-block', width: 7, height: 12, marginLeft: 4, background: 'var(--accent)', animation: 'office-type .7s steps(1) infinite', verticalAlign: 'text-bottom' }} />
                    )}
                  </div>
                )}
              </button>
            )
          })}

          {!compact && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void sendTask()
              }}
              style={{
                position: 'absolute',
                left: '6%',
                right: '6%',
                bottom: 12,
                display: 'flex',
                gap: 8,
                zIndex: 8,
              }}
            >
              <input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Give the floor a task — they walk, search, type, and talk it out"
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
              <button
                type="submit"
                disabled={busy}
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-fg)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
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
                  Search lab on the left. Talk table in the middle. Dev desks with live PCs on the right. Review at the back. Agents walk when a task starts.
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
