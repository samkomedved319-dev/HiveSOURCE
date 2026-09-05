import React from 'react'
import BloubEngineAvatar from '../mascot/BloubEngineAvatar'
import { getMascot } from '../mascot/mascotLibrary'
import type { StateId } from '../../bot/states'

export type SwarmStatus = 'idle' | 'searching' | 'thinking' | 'arguing' | 'done' | 'error'

const AGENTS: { name: string; mascot: string; job: string }[] = [
  { name: 'Scout', mascot: 'bloub-blue', job: 'research' },
  { name: 'Hive', mascot: 'bloub-gold', job: 'answer' },
  { name: 'Pulse', mascot: 'bloub-rose', job: 'check' },
  { name: 'Critic', mascot: 'bloub-violet', job: 'review' },
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
  idle: 'ready',
  searching: 'searching',
  thinking: 'thinking',
  arguing: 'reviewing',
  done: 'done',
  error: 'error',
}

export default function SwarmStrip({ status }: { status: Record<string, SwarmStatus> }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 22,
        padding: '10px 16px 6px',
        justifyContent: 'center',
        alignItems: 'flex-end',
        flexShrink: 0,
      }}
    >
      {AGENTS.map((a) => {
        const st = status[a.name] || 'idle'
        const m = getMascot(a.mascot)
        const busy = st !== 'idle'
        return (
          <div key={a.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 64, opacity: busy ? 1 : 0.78 }}>
            <BloubEngineAvatar
              size={48}
              crop={118}
              ink={m.ink}
              paper={m.paper}
              shapeId={m.shape}
              botState={POSE[st]}
              live
              fps={busy ? 30 : 18}
            />
            <span style={{ fontSize: 11, color: 'var(--text)', fontWeight: 650 }}>{a.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{busy ? LABEL[st] : a.job}</span>
          </div>
        )
      })}
    </div>
  )
}
