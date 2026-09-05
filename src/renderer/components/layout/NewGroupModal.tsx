import React, { useState } from 'react'
import { useAgentStore } from '../../stores/agentStore'

interface NewGroupModalProps {
  onClose: () => void
  onCreate: (name: string, agentIds: string[]) => void
}

export default function NewGroupModal({ onClose, onCreate }: NewGroupModalProps) {
  const agents = useAgentStore((s) => s.agents)
  const [name, setName] = useState('New group')
  const [selected, setSelected] = useState<string[]>(() => agents.slice(0, 2).map((a) => a.id))

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 18,
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 650, marginBottom: 12 }}>Add new group</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'var(--panel-2)',
            border: '1px solid var(--border-soft)',
            borderRadius: 8,
            padding: '8px 10px',
            color: 'var(--text)',
            marginBottom: 14,
            fontFamily: 'inherit',
          }}
        />
        <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 8 }}>
          Select which bots belong in this room
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
          {agents.map((agent) => {
            const on = selected.includes(agent.id)
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => toggle(agent.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 9,
                  border: on ? '1px solid var(--accent-dim)' : '1px solid var(--border-soft)',
                  background: on ? 'rgba(242,193,78,0.08)' : 'var(--panel-2)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 16 }}>{agent.avatar || '⬡'}</span>
                <span style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{agent.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{agent.roleTitle || agent.description}</div>
                </span>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    border: on ? 'none' : '1px solid var(--border)',
                    background: on ? 'var(--accent)' : 'transparent',
                  }}
                />
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button type="button" disabled={!name.trim() || selected.length === 0} onClick={() => onCreate(name.trim(), selected)} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--accent-fg)', cursor: 'pointer', fontWeight: 650, fontFamily: 'inherit', opacity: !name.trim() || selected.length === 0 ? 0.5 : 1 }}>Create group</button>
        </div>
      </div>
    </div>
  )
}
