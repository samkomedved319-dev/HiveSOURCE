import React, { useState } from 'react'
import { useAgentStore } from '../../stores/agentStore'
import type { Agent } from '../../types'
import { FREE_GLM } from '../../lib/freeModels'

/** Always-visible loop strip in main chat. Create, start, pause without leaving chat. */
export default function LoopAgentsBar() {
  const { agents, addAgent, updateAgent } = useAgentStore()
  const loops = agents.filter((a) => a.kind === 'loop')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')

  const create = () => {
    if (!name.trim() || !goal.trim()) return
    const bot: Agent = {
      id: `agent-loop-${Date.now()}`,
      name: name.trim(),
      description: goal.trim(),
      systemPrompt: 'You are a Hive loop agent. Each tick: one short status on your goal. No swarm. No fluff.',
      avatar: 'bloub-gold',
      roleTitle: 'Loop agent',
      isCeo: false,
      model: FREE_GLM,
      mode: 'fast',
      createdAt: Date.now(),
      kind: 'loop',
      looping: true,
      loopEveryMs: 120_000,
      loopGoal: goal.trim(),
    }
    addAgent(bot)
    setName('')
    setGoal('')
    setOpen(false)
  }

  return (
    <div
      style={{
        flexShrink: 0,
        borderBottom: '1px solid var(--border-soft)',
        background: 'var(--panel)',
        padding: '8px 14px 10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: loops.length ? 8 : 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
          Loop agents
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          {loops.filter((a) => a.looping).length} running
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            marginLeft: 'auto',
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            border: 'none',
            borderRadius: 999,
            padding: '5px 12px',
            fontSize: 12,
            fontWeight: 650,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {open ? 'Close' : 'New loop'}
        </button>
      </div>
      {loops.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {loops.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--panel-2)',
                border: a.looping ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 999,
                padding: '4px 4px 4px 12px',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{a.name}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-faint)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.loopGoal}
              </span>
              <button
                type="button"
                onClick={() => updateAgent(a.id, { looping: !a.looping })}
                style={{
                  background: a.looping ? 'transparent' : 'var(--accent)',
                  color: a.looping ? 'var(--text-dim)' : 'var(--accent-fg)',
                  border: a.looping ? '1px solid var(--border)' : 'none',
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 11.5,
                  fontWeight: 650,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {a.looping ? 'Pause' : 'Start'}
              </button>
            </div>
          ))}
        </div>
      )}
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, marginTop: 10 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name — Scout, Watcher…"
            style={{
              background: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '8px 10px',
              color: 'var(--text)',
              fontSize: 12.5,
              fontFamily: 'inherit',
            }}
          />
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Goal — what should it keep doing?"
            style={{
              background: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '8px 10px',
              color: 'var(--text)',
              fontSize: 12.5,
              fontFamily: 'inherit',
            }}
          />
          <button
            type="button"
            onClick={create}
            disabled={!name.trim() || !goal.trim()}
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-fg)',
              border: 'none',
              borderRadius: 10,
              padding: '8px 14px',
              fontWeight: 650,
              fontSize: 12.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Create + Start
          </button>
        </div>
      )}
    </div>
  )
}
