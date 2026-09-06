import React, { useState } from 'react'
import { useAgentStore } from '../../stores/agentStore'
import type { Agent } from '../../types'
import BloubEngineAvatar from '../mascot/BloubEngineAvatar'
import MascotPicker from '../mascot/MascotPicker'
import { DEFAULT_MASCOT_ID, getMascot, resolveAgentMascotId } from '../mascot/mascotLibrary'
import { PREMADE_BOTS } from './botLibrary'

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
  const [asLoop, setAsLoop] = useState(false)
  const [loopGoal, setLoopGoal] = useState('')
  const [loopEveryMs, setLoopEveryMs] = useState(120_000)

  const handleCreate = () => {
    if (!name.trim()) return
    const bot: Agent = {
      id: `agent-custom-${Date.now()}`,
      name: name.trim(),
      description: asLoop ? loopGoal.trim() || 'Loop agent' : roleTitle.trim() || 'Specialized worker',
      systemPrompt:
        systemPrompt.trim() ||
        (asLoop
          ? 'You are a Hive loop agent. Each tick: one short status on your goal. No swarm. No fluff.'
          : 'You are a specialized autonomous AI worker reporting to Hive CEO. You provide concise, production-ready output with zero fluff.'),
      avatar,
      roleTitle: asLoop ? 'Loop agent' : roleTitle.trim() || 'Specialized Worker',
      isCeo: false,
      model: 'z-ai/glm-5.3-free',
      mode: 'fast',
      createdAt: Date.now(),
      kind: asLoop ? 'loop' : 'chat',
      looping: false,
      loopEveryMs: asLoop ? loopEveryMs : undefined,
      loopGoal: asLoop ? loopGoal.trim() : undefined,
    }
    addAgent(bot)
    setIsCreating(false)
    setName('')
    setRoleTitle('')
    setSystemPrompt('')
    setAvatar(DEFAULT_MASCOT_ID)
    setAsLoop(false)
    setLoopGoal('')
    setLoopEveryMs(120_000)
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
          {agents.length} bot{agents.length === 1 ? '' : 's'} on the roster. Chat is one mind. Loop agents you create here — they only run when you press Start.
        </p>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 650, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 8 }}>
            Premade by Hive
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {PREMADE_BOTS.map((b) => {
              const already = agents.some((a) => a.name.split(' ')[0] === b.name)
              return (
                <button
                  key={b.id}
                  type="button"
                  disabled={already}
                  onClick={() => {
                    if (already) return
                    addAgent({ ...b, id: `agent-${b.name.toLowerCase()}-${Date.now()}`, createdAt: Date.now() })
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--border-soft)',
                    background: 'var(--panel)',
                    color: 'var(--text)',
                    cursor: already ? 'default' : 'pointer',
                    opacity: already ? 0.5 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 650 }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{b.roleTitle}</div>
                </button>
              )
            })}
          </div>
        </div>

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
                    ink={getMascot(resolveAgentMascotId(agent)).ink}
                    paper={getMascot(resolveAgentMascotId(agent)).paper}
                    botState="idle"
                    shapeId={getMascot(resolveAgentMascotId(agent)).shape}
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
                    {agent.kind === 'loop' && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: agent.looping ? '#0D0E11' : 'var(--text-dim)',
                          background: agent.looping ? 'var(--accent)' : 'var(--panel-2)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {agent.looping ? 'Looping' : 'Loop'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {agent.roleTitle || agent.description || 'Specialized worker'}
                    {agent.kind === 'loop' ? ` · every ${Math.round((agent.loopEveryMs || 120000) / 60000)}m` : ''}
                  </div>
                </div>
                {agent.kind === 'loop' && (
                  <button
                    type="button"
                    onClick={() => updateAgent(agent.id, { looping: !agent.looping })}
                    style={{
                      background: agent.looping ? 'transparent' : 'var(--accent)',
                      border: agent.looping ? '1px solid var(--border)' : 'none',
                      borderRadius: 8,
                      padding: '7px 12px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: agent.looping ? 'var(--text-dim)' : '#0D0E11',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      flexShrink: 0,
                    }}
                  >
                    {agent.looping ? 'Pause' : 'Start'}
                  </button>
                )}
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
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            type="button"
            onClick={() => {
              setAsLoop(false)
              setIsCreating(true)
            }}
            style={{
              flex: 1,
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
          <button
            type="button"
            onClick={() => {
              setAsLoop(true)
              setIsCreating(true)
            }}
            style={{
              flex: 1,
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
            + New loop agent
          </button>
          </div>
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
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{asLoop ? 'New loop agent' : 'New worker bot'}</div>
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
            {asLoop && (
              <>
                <textarea
                  value={loopGoal}
                  onChange={(e) => setLoopGoal(e.target.value)}
                  placeholder="Loop goal — e.g. Watch this repo for bugs and report one line"
                  rows={2}
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
                <select
                  value={loopEveryMs}
                  onChange={(e) => setLoopEveryMs(Number(e.target.value))}
                  style={{
                    background: 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                  }}
                >
                  <option value={120000}>Every 2 minutes</option>
                  <option value={300000}>Every 5 minutes</option>
                  <option value={900000}>Every 15 minutes</option>
                </select>
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                  Loop agents stay off until you press Start. They never run on “hey?”.
                </div>
              </>
            )}
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
                Create {asLoop ? 'loop agent' : 'bot'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
