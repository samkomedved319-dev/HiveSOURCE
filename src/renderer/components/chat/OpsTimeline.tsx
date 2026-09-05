import React from 'react'
import type { HiveSwarmEvent } from '../../types'

const COLOR: Record<string, string> = {
  Scout: '#5B8DEF',
  Hive: '#F2C14E',
  Pulse: '#FB7185',
  Critic: '#C084FC',
  Operator: '#34D399',
  Sentry: '#F97316',
}

export default function OpsTimeline({ events }: { events: HiveSwarmEvent[] }) {
  if (!events.length) return null
  const t0 = events[0].occurredAt
  const live = events.filter((e) =>
    ['inference.started', 'function_call.started', 'model.answer', 'interception.started', 'hive.approve'].includes(e.type)
  ).slice(-12)

  return (
    <div
      style={{
        margin: '8px 16px 0',
        border: '1px solid var(--border-soft)',
        borderRadius: 10,
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.015)',
        fontFamily: "'JetBrains Mono', monospace",
        maxHeight: 88,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div style={{ color: 'var(--text-faint)', marginBottom: 6, fontWeight: 600, letterSpacing: 0.4 }}>
        LIVE OPS · overlapping runLoops
      </div>
      {live.map((e, i) => (
        <div key={`${e.occurredAt}-${i}`} style={{ display: 'flex', gap: 8, color: 'var(--text-dim)', lineHeight: 1.7 }}>
          <span style={{ width: 52, color: 'var(--text-faint)' }}>+{Math.max(0, e.occurredAt - t0)}ms</span>
          <span style={{ width: 72, color: COLOR[e.producerName] || 'var(--accent)', fontWeight: 650 }}>
            {e.producerName}
          </span>
          <span>{e.type.replace('inference.started', 'runLoop').replace('function_call.started', 'tool')}</span>
          {e.text && e.type !== 'inference.stream' && (
            <span style={{ opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.text.slice(0, 72)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
