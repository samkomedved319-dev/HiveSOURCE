import React, { useState } from 'react'
import { useAgentStore } from '../../stores/agentStore'
import type { Agent } from '../../types'
import BloubEngineAvatar from '../mascot/BloubEngineAvatar'
import MascotPicker from '../mascot/MascotPicker'
import { DEFAULT_MASCOT_ID, getMascot } from '../mascot/mascotLibrary'

interface BotsPanelProps {
  onBack: () => void
  onSelectAgent: (agent: Agent) => void
}

/**
 * BotsPanel — the bot roster lives in the main column (where chat lives),
 * not in a floating modal. Pick a bot to chat live, create new workers,
 * or remove the ones you outgrew. The Hive CEO can never be removed.
 */
export default function BotsPanel({ onBack, onSelectAgent }: BotsPanelProps) {
  const { agents, activeAgent, setActiveAgent, addAgent, removeAgent, updateAgent } = useAgentStore()
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [avatar, setAvatar] = useState(DEFAULT_MASCOT_ID)
  const [editMascotFor, setEditMascotFor] = useState<string | null>(null)

  const handleCreate = () => {
    if (!name.trim()) return
    const bot: Agent = {
      id: `agent-custom-${Date.now()}`,
      name: name.trim(),
      description: roleTitle.trim() || 'Specialized worker',
      systemPrompt:
        systemPrompt.trim() ||
        'You are a specialized autonomous AI worker reporting to Hive CEO. You provide concise, production-ready output with zero fluff.',
      avatar,
      roleTitle: roleTitle.trim() || 'Specialized Worker',
      isCeo: false,
      model: 'minimax/minimax-m3:free',
      mode: 'auto',
      createdAt: Date.now(),
    }
    addAgent(bot)
    setIsCreating(false)
    setName('')
    setRoleTitle('')
    setSystemPrompt('')
    setAvatar(DEFAULT_MASCOT_ID)
  }

  const handleChat = (agent: Agent) => {
    setActiveAgent(agent)
    onSelectAgent(agent)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flex: 1,
        minWidth: 0,
        background: 'var(--bg)',
        overflowY: 'auto',
      }}
    >
      <div style={{ width: '100%', maxWidth: 768, margin: '0 auto', padding: '28px 20px 48px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <button
            type="button"
            onClick={onBack}
            title="Back to chat"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-soft)',
              borderRadius: 8,
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontSize: 14,
              padding: '5px 10px',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
          >
            ← Chat
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            AI Workers & Bots
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '0 0 20px 0' }}>
          {agents.length} bot{agents.length === 1 ? '' : 's'} on the roster. Pick one to chat live.
        </p>

        {/* Roster */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {agents.map((agent) => {
            const active = agent.id === activeAgent?.id
            return (
              <React.Fragment key={agent.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: 'var(--panel)',
                  border: active ? '1px solid var(--accent-dim)' : '1px solid var(--border-soft)',
                  borderRadius: 12,
                  padding: '14px 16px',
                }}
              >
                <button
                  type="button"
                  title="Change mascot"
                  onClick={() => setEditMascotFor(editMascotFor === agent.id ? null : agent.id)}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    padding: 0,
                  }}
                >
                  <BloubEngineAvatar
                    size={40}
                    crop={118}
                    live={false}
                    ink={getMascot(agent.avatar).ink}
                    paper={getMascot(agent.avatar).paper}
                    botState={getMascot(agent.avatar).pose}
                    shapeId={getMascot(agent.avatar).shape}
                  />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{agent.name}</span>
                    {active && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#0D0E11',
                          background: 'var(--accent)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Live
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {agent.roleTitle || agent.description || 'Specialized worker'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChat(agent)}
                  style={{
                    background: active ? 'var(--panel-2)' : 'var(--accent)',
                    border: active ? '1px solid var(--border)' : 'none',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: active ? 'var(--text-dim)' : '#0D0E11',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    flexShrink: 0,
                  }}
                >
                  {active ? 'Chatting' : 'Chat live'}
                </button>
                {!agent.isCeo && (
                  <button
                    type="button"
                    onClick={() => removeAgent(agent.id)}
                    title={`Remove ${agent.name}`}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-faint)',
                      cursor: 'pointer',
                      fontSize: 13,
                      padding: 4,
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}
                  >
                    ✕
                  </button>
                )}
              </div>
              {editMascotFor === agent.id && (
                <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                  <MascotPicker
                    value={agent.avatar || DEFAULT_MASCOT_ID}
                    onChange={(id) => {
                      updateAgent(agent.id, { avatar: id })
                      setEditMascotFor(null)
                    }}
                  />
                </div>
              )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Create */}
        {!isCreating ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            style={{
              marginTop: 14,
              width: '100%',
              background: 'transparent',
              border: '1px dashed var(--border)',
              borderRadius: 12,
              padding: '12px',
              fontSize: 13,
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
          >
            + New worker bot
          </button>
        ) : (
          <div
            style={{
              marginTop: 14,
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>New worker bot</div>
            <MascotPicker value={avatar} onChange={setAvatar} />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bot name — e.g. Atlas (QA Analyst)"
              style={{
                background: 'var(--panel-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 12px',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Role title — e.g. QA Analyst"
              style={{
                background: 'var(--panel-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 12px',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="System instructions (optional)"
              rows={3}
              style={{
                background: 'var(--panel-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 12px',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'none',
                lineHeight: 1.5,
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '7px 14px',
                  fontSize: 12.5,
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!name.trim()}
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 16px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#0D0E11',
                  cursor: name.trim() ? 'pointer' : 'default',
                  opacity: name.trim() ? 1 : 0.5,
                  fontFamily: 'inherit',
                }}
              >
                Create bot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
