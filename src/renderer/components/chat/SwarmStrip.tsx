import React from 'react'
import BloubEngineAvatar from '../mascot/BloubEngineAvatar'
import { getMascot } from '../mascot/mascotLibrary'
import type { StateId } from '../../bot/states'

export type SwarmStatus = 'idle' | 'searching' | 'thinking' | 'arguing' | 'done' | 'error'

const AGENTS: { name: string; mascot: string }[] = [
  { name: 'Scout', mascot: 'bloub-blue' },
  { name: 'Hive', mascot: 'bloub-gold' },
  { name: 'Pulse', mascot: 'bloub-rose' },
  { name: 'Critic', mascot: 'bloub-violet' },
]

const POSE: Record<SwarmStatus, StateId> = {
  idle: 'idle',
  searching: 'orbit',
  thinking: 'thinking',
  arguing: 'wink',
  done: 'exclaim',
  error: 'alert',
}

const LABEL: Record<SwarmStatus, string> = {
  idle: '',
  searching: 'searching',
  thinking: 'thinking',
  arguing: 'reviewing',
  done: 'done',
  error: 'error',
}

export default function SwarmStrip({ status }: { status: Record<string, SwarmStatus> }) {
  const busy = AGENTS.some((a) => {
    const st = status[a.name]
    return st && st !== 'idle'
  })
  if (!busy) return null

  return (
    <div
      style={{
        display: 'flex',
        gap: 18,
        padding: '8px 16px 4px',
        justifyContent: 'center',
        alignItems: 'flex-end',
        flexShrink: 0,
      }}
    >
      {AGENTS.map((a) => {
        const st = status[a.name] || 'idle'
        const m = getMascot(a.mascot)
        const live = st !== 'idle'
        return (
          <div key={a.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: live ? 1 : 0.35, minWidth: 56 }}>
            <BloubEngineAvatar
              size={44}
              crop={118}
              ink={m.ink}
              paper={m.paper}
              shapeId={m.shape}
              botState={POSE[st]}
              live={live}
              fps={30}
            />
            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>{a.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-faint)', height: 12 }}>{LABEL[st]}</span>
          </div>
        )
      })}
    </div>
  )
}
