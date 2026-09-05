import React, { useState } from 'react'
import { useAgentStore } from '../../stores/agentStore'
import BloubEngineAvatar from '../mascot/BloubEngineAvatar'
import { getMascot } from '../mascot/mascotLibrary'
import { PREMADE_BOTS } from '../bots/botLibrary'
import CloudComputerPanel from './CloudComputerPanel'
import type { SwarmStatus } from '../chat/SwarmStrip'
import type { StateId } from '../../bot/states'

const CORE: { name: string; mascot: string; job: string }[] = [
  { name: 'Scout', mascot: 'bloub-blue', job: 'research' },
  { name: 'Hive', mascot: 'bloub-gold', job: 'answer' },
  { name: 'Pulse', mascot: 'bloub-rose', job: 'check' },
  { name: 'Critic', mascot: 'bloub-violet', job: 'review' },
]

const POSE: Record<SwarmStatus, StateId> = {
  idle: 'idle',
  searching: 'orbit',
  thinking: 'thinking',
  arguing: 'thinking',
  done: 'idle',
  error: 'alert',
}

export default function CrewPanel({
  status,
  onClose,
}: {
  status: Record<string, SwarmStatus>
  onClose: () => void
}) {
  const { agents, addAgent } = useAgentStore()
  const [tab, setTab] = useState<'crew' | 'desk'>('crew')
  const [picker, setPicker] = useState(false)

  const addFromLibrary = (id: string) => {
    const lib = PREMADE_BOTS.find((b) => b.id === id)
    if (!lib) return
    if (agents.some((a) => a.name.split(' ')[0] === lib.name)) return
    addAgent({ ...lib, id: `agent-${lib.name.toLowerCase()}-${Date.now()}`, createdAt: Date.now() })
  }

  return (
    <aside
      style={{
        width: 280,
        height: '100%',
        borderLeft: '1px solid var(--border-soft)',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px 8px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>HiveBox</div>
        <button type="button" onClick={() => setTab('crew')} style={tabBtn(tab === 'crew')}>Crew</button>
        <button type="button" onClick={() => setTab('desk')} style={tabBtn(tab === 'desk')}>Desk</button>
        <button type="button" onClick={onClose} title="Close panel" style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>

      {tab === 'desk' ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <CloudComputerPanel onClose={onClose} />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 10 }}>
            Core crew — they work together on Hive chats. Add more below.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CORE.map((a) => {
              const st = (status[a.name] || 'idle') as SwarmStatus
              const m = getMascot(a.mascot)
              return (
                <div key={a.name} style={{ background: 'var(--panel)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                  <BloubEngineAvatar size={52} crop={118} ink={m.ink} paper={m.paper} shapeId={m.shape} botState={POSE[st]} live fps={st === 'idle' ? 16 : 28} />
                  <div style={{ fontSize: 12, fontWeight: 650, marginTop: 4 }}>{a.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{st === 'idle' ? a.job : st}</div>
                </div>
              )
            })}
          </div>

          <div style={{ fontSize: 11, fontWeight: 650, margin: '16px 0 8px' }}>Sub-agents</div>
          {agents.filter((a) => !a.isCeo).map((a) => {
            const m = getMascot(a.avatar)
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <BloubEngineAvatar size={28} crop={118} live={false} ink={m.ink} paper={m.paper} shapeId={m.shape} botState="idle" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{a.name.split('(')[0].trim()}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{a.roleTitle}</div>
                </div>
              </div>
            )
          })}

          <button
            type="button"
            onClick={() => setPicker((v) => !v)}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '8px',
              borderRadius: 10,
              border: '1px dashed var(--border)',
              background: 'transparent',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            + Add sub-agent
          </button>
          {picker && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PREMADE_BOTS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => addFromLibrary(b.id)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border-soft)',
                    background: 'var(--panel)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 650 }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{b.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}

function tabBtn(on: boolean): React.CSSProperties {
  return {
    background: on ? 'var(--panel-2)' : 'transparent',
    border: on ? '1px solid var(--border)' : '1px solid transparent',
    color: on ? 'var(--text)' : 'var(--text-faint)',
    borderRadius: 8,
    padding: '3px 8px',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}
