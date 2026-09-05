import React, { useEffect, useMemo, useState } from 'react'
import BloubEngineAvatar from '../mascot/BloubEngineAvatar'
import { getMascot } from '../mascot/mascotLibrary'
import type { StateId } from '../../bot/states'
import type { HiveSwarmEvent } from '../../types'

type AgentMood = 'idle' | 'thinking' | 'searching' | 'talking' | 'done'

type DeskAgent = {
  id: string
  name: string
  mascot: string
  job: string
  desk: { x: number; y: number }
  meet: { x: number; y: number }
}

const CREW: DeskAgent[] = [
  { id: 'scout', name: 'Scout', mascot: 'bloub-blue', job: 'research', desk: { x: 14, y: 38 }, meet: { x: 42, y: 52 } },
  { id: 'hive', name: 'Hive', mascot: 'bloub-gold', job: 'answer', desk: { x: 42, y: 28 }, meet: { x: 50, y: 48 } },
  { id: 'pulse', name: 'Pulse', mascot: 'bloub-rose', job: 'check', desk: { x: 70, y: 38 }, meet: { x: 58, y: 52 } },
  { id: 'critic', name: 'Critic', mascot: 'bloub-violet', job: 'review', desk: { x: 78, y: 62 }, meet: { x: 54, y: 60 } },
  { id: 'apollo', name: 'Apollo', mascot: 'bloub-orange', job: 'code', desk: { x: 22, y: 64 }, meet: { x: 46, y: 60 } },
  { id: 'athena', name: 'Athena', mascot: 'bloub-blue', job: 'intel', desk: { x: 8, y: 58 }, meet: { x: 40, y: 58 } },
]

const POSE: Record<AgentMood, StateId> = {
  idle: 'idle',
  thinking: 'thinking',
  searching: 'orbit',
  talking: 'exclaim',
  done: 'idle',
}

function moodFromEvent(ev: HiveSwarmEvent): AgentMood {
  if (ev.type === 'function_call.started') return 'searching'
  if (ev.type === 'inference.started' || ev.type === 'inference.stream') return 'thinking'
  if (ev.type === 'model.answer') return 'talking'
  return 'idle'
}

export default function HiveOffice({ onBack }: { onBack: () => void }) {
  const [moods, setMoods] = useState<Record<string, AgentMood>>({})
  const [bubbles, setBubbles] = useState<Record<string, string>>({})
  const [log, setLog] = useState<{ t: number; who: string; text: string }[]>([])
  const [focus, setFocus] = useState<string | null>(null)
  const [meeting, setMeeting] = useState(false)

  useEffect(() => {
    const off = window.electronAPI?.hive?.onEvent?.((ev: HiveSwarmEvent) => {
      const who = ev.producerName || 'Hive'
      const key = who.toLowerCase()
      setMoods((p) => ({ ...p, [key]: moodFromEvent(ev) }))
      if (ev.text && (ev.type === 'model.answer' || ev.type === 'inference.stream')) {
        const snippet = ev.text.slice(0, 90)
        setBubbles((p) => ({ ...p, [key]: snippet }))
        if (ev.type === 'model.answer') {
          setLog((p) => [{ t: Date.now(), who, text: snippet }, ...p].slice(0, 24))
        }
      }
      if (ev.type === 'inference.started') setMeeting(true)
      if (ev.type === 'model.answer' && who === 'Hive') {
        window.setTimeout(() => setMeeting(false), 1800)
      }
    })
    return () => {
      try {
        off?.()
      } catch {}
    }
  }, [])

  const live = useMemo(() => Object.values(moods).some((m) => m !== 'idle' && m !== 'done'), [moods])

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', background: '#0b0c0e', overflow: 'hidden' }}>
      <div style={{ height: 52, borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
        <button type="button" onClick={onBack} style={{ background: 'transparent', border: '1px solid var(--border-soft)', color: 'var(--text-dim)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Chat
        </button>
        <div style={{ fontWeight: 700, letterSpacing: '.04em' }}>HIVE OFFICE</div>
        <div style={{ fontSize: 12, color: live ? 'var(--accent)' : 'var(--text-faint)' }}>
          {live ? 'live floor · agents moving' : 'floor idle · waiting on a task'}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>desks · talk · cloud wall</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 280px', overflow: 'hidden' }}>
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(ellipse at 50% 0%, rgba(242,193,78,0.14), transparent 55%),
                linear-gradient(180deg, #14120e 0%, #0b0c0e 70%)
              `,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '8%',
              right: '8%',
              top: '18%',
              bottom: '10%',
              border: '1px solid rgba(242,193,78,0.18)',
              background: `
                repeating-linear-gradient(90deg, transparent 0 47px, rgba(242,193,78,0.05) 47px 48px),
                repeating-linear-gradient(0deg, transparent 0 47px, rgba(242,193,78,0.05) 47px 48px),
                linear-gradient(180deg, #1a1814, #12110e)
              `,
              boxShadow: '0 40px 80px rgba(0,0,0,.45), inset 0 0 80px rgba(242,193,78,0.04)',
              transform: 'perspective(1200px) rotateX(18deg)',
              transformOrigin: 'center top',
              borderRadius: 8,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '28%',
              right: '28%',
              top: '8%',
              height: 88,
              border: '1px solid rgba(242,193,78,0.25)',
              background: '#111',
              borderRadius: 6,
              overflow: 'hidden',
              boxShadow: '0 0 24px rgba(242,193,78,0.15)',
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--accent)', padding: '6px 10px', letterSpacing: '.12em' }}>CLOUD WALL</div>
            <div style={{ padding: '0 10px', fontSize: 12, color: '#cfc8b8', fontFamily: 'IBM Plex Mono, monospace' }}>
              {(log[0]?.who || 'Hive')} · {log[0]?.text || 'waiting for a concurrent run…'}
            </div>
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
                title={a.name}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  transition: 'left .9s cubic-bezier(.22,1,.36,1), top .9s cubic-bezier(.22,1,.36,1)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  zIndex: on ? 5 : 2,
                }}
              >
                <div
                  style={{
                    width: 86,
                    height: 54,
                    margin: '0 auto 4px',
                    background: 'rgba(20,18,14,.9)',
                    border: `1px solid ${on ? 'var(--accent)' : 'rgba(242,193,78,0.22)'}`,
                    borderRadius: 8,
                    boxShadow: '0 10px 18px rgba(0,0,0,.35)',
                  }}
                />
                <BloubEngineAvatar
                  size={64}
                  crop={118}
                  ink={m.ink}
                  paper={m.paper}
                  shapeId={m.shape}
                  botState={POSE[mood]}
                  live
                  fps={mood === 'idle' ? 16 : 32}
                />
                <div style={{ color: 'var(--text)', fontSize: 12, fontWeight: 650, marginTop: 2 }}>{a.name}</div>
                <div style={{ color: mood === 'idle' ? 'var(--text-faint)' : 'var(--accent)', fontSize: 10 }}>{mood === 'idle' ? a.job : mood}</div>
                {bubble && mood !== 'idle' && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: '100%',
                      transform: 'translateX(-50%)',
                      width: 160,
                      background: '#1b1914',
                      border: '1px solid var(--accent-dim)',
                      color: 'var(--text)',
                      fontSize: 11,
                      padding: '6px 8px',
                      borderRadius: 8,
                      textAlign: 'left',
                      boxShadow: '0 8px 20px rgba(0,0,0,.4)',
                    }}
                  >
                    {bubble}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div style={{ borderLeft: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', minHeight: 0, background: '#101114' }}>
          <div style={{ padding: 14, fontSize: 12, fontWeight: 700, letterSpacing: '.06em', color: 'var(--text-dim)' }}>FLOOR LOG</div>
          <div style={{ flex: 1, overflow: 'auto', padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {log.length === 0 && (
              <div style={{ color: 'var(--text-faint)', fontSize: 12.5, lineHeight: 1.5 }}>
                Send a message in chat. Scout, Hive, Pulse and Critic walk to the table and talk here — live, not a queue.
              </div>
            )}
            {log.map((row) => (
              <div key={row.t + row.who} style={{ fontSize: 12, borderBottom: '1px solid var(--border-soft)', paddingBottom: 8 }}>
                <div style={{ color: 'var(--accent)', fontWeight: 650 }}>{row.who}</div>
                <div style={{ color: 'var(--text-dim)', marginTop: 3 }}>{row.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
