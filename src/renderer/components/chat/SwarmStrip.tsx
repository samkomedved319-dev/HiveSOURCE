import React from 'react'

export type SwarmStatus = 'idle' | 'searching' | 'thinking' | 'arguing' | 'done' | 'error'

const AGENTS: { name: string; color: string }[] = [
  { name: 'Scout', color: '#5B8DEF' },
  { name: 'Hive', color: '#F2C14E' },
  { name: 'Pulse', color: '#FB7185' },
  { name: 'Critic', color: '#C084FC' },
]

const LABEL: Record<SwarmStatus, string> = {
  idle: 'idle',
  searching: 'searching\u2026',
  thinking: 'thinking\u2026',
  arguing: 'reviewing\u2026',
  done: 'done',
  error: 'error',
}

export default function SwarmStrip({ status }: { status: Record<string, SwarmStatus> }) {
  const liveCount = ['Scout', 'Hive', 'Pulse'].filter((n) => {
    const st = status[n]
    return st && st !== 'idle'
  }).length
  const overlap = liveCount >= 2
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '6px 16px 0',
        justifyContent: 'center',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {overlap && (
        <div style={{ fontSize: 10, color: '#F2C14E', fontWeight: 700, letterSpacing: 0.4 }}>
          {liveCount} AGENTS OVERLAPPING
        </div>
      )}
      {AGENTS.map((a) => {
        const st = status[a.name] || 'idle'
        const live = st !== 'idle' && st !== 'done'
        return (
          <div
            key={a.name}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              border: `1px solid ${a.color}33`,
              background: `${a.color}14`,
              color: a.color,
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: a.color,
                boxShadow: live ? `0 0 8px ${a.color}` : 'none',
              }}
            />
            {a.name}
            <span style={{ fontWeight: 500, opacity: 0.8 }}>{LABEL[st]}</span>
          </div>
        )
      })}
    </div>
  )
}
