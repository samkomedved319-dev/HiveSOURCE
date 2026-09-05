import React from 'react'
import { FLOOR_CREW, type AgentMood, type FloorAgent } from './crew'

interface IsometricFloorProps {
  moods: Record<string, AgentMood>
  meeting: boolean
  onSelectAgent?: (agent: FloorAgent) => void
}

export default function IsometricFloor({ moods, meeting, onSelectAgent }: IsometricFloorProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'auto',
        background: '#F2C14E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        userSelect: 'none',
      }}
    >
      {/* Isometric Floor Board Container */}
      <div
        style={{
          position: 'relative',
          width: 860,
          minHeight: 520,
          background: 'linear-gradient(135deg, #b8864d 0%, #8c5d2e 50%, #68411a 100%)',
          borderRadius: 24,
          boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 2px 6px rgba(255,255,255,0.2)',
          border: '8px solid #3d2611',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Wood floor tile plank pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 2px, transparent 2px, transparent 60px), repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 20px)',
            pointerEvents: 'none',
          }}
        />

        {/* Header / Meeting glass room banner */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            background: meeting ? 'rgba(242, 193, 78, 0.2)' : 'rgba(20, 16, 12, 0.65)',
            border: `2px solid ${meeting ? '#F2C14E' : 'rgba(255,255,255,0.1)'}`,
            backdropFilter: 'blur(8px)',
            borderRadius: 14,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: meeting ? '#F2C14E' : '#4ade80',
                boxShadow: `0 0 10px ${meeting ? '#F2C14E' : '#4ade80'}`,
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 800, letterSpacing: '.06em', fontSize: 13, textTransform: 'uppercase' }}>
              {meeting ? 'Team Meeting Active — Swarm In Progress' : 'Hive Floor — Agents At Work'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            6 Desks · Claw3D Isometric Floor
          </div>
        </div>

        {/* Desks Grid (2 rows x 3 columns) */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            flex: 1,
          }}
        >
          {FLOOR_CREW.map((agent) => {
            const mood = moods[agent.id] || moods[agent.name.toLowerCase()] || 'idle'
            const isWorking = meeting || mood !== 'idle'

            return (
              <div
                key={agent.id}
                onClick={() => onSelectAgent?.(agent)}
                style={{
                  position: 'relative',
                  background: 'rgba(24, 20, 16, 0.82)',
                  borderRadius: 16,
                  border: `2px solid ${isWorking ? agent.color : 'rgba(255,255,255,0.12)'}`,
                  boxShadow: isWorking
                    ? `0 0 20px ${agent.color}40, 0 12px 24px rgba(0,0,0,0.4)`
                    : '0 8px 20px rgba(0,0,0,0.3)',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'all 0.25s ease',
                  cursor: onSelectAgent ? 'pointer' : 'default',
                }}
              >
                {/* Desk Top / Monitor Visual */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 8,
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Agent Avatar Circle */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: agent.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#111',
                        fontWeight: 900,
                        fontSize: 16,
                        boxShadow: `0 0 12px ${agent.color}80`,
                        border: '2px solid #fff',
                      }}
                    >
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{agent.name}</div>
                      <div style={{ color: agent.color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                        {agent.job}
                      </div>
                    </div>
                  </div>

                  {/* Mood Status Pill */}
                  <span
                    style={{
                      background: isWorking ? `${agent.color}25` : 'rgba(255,255,255,0.06)',
                      color: isWorking ? agent.color : '#a89d8f',
                      border: `1px solid ${isWorking ? agent.color : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 99,
                      padding: '3px 9px',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'capitalize',
                    }}
                  >
                    {isWorking ? mood : 'at desk'}
                  </span>
                </div>

                {/* Desk Workstation Graphic */}
                <div
                  style={{
                    background: '#382a1d',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid #4d3a28',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Mini computer screen */}
                    <div
                      style={{
                        width: 24,
                        height: 18,
                        background: isWorking ? '#0284c7' : '#1e293b',
                        borderRadius: 3,
                        border: '2px solid #64748b',
                        boxShadow: isWorking ? '0 0 8px #38bdf8' : 'none',
                      }}
                    />
                    <span style={{ fontSize: 11, color: '#e2d4be', fontWeight: 600 }}>
                      Workstation {agent.name}
                    </span>
                  </div>

                  {/* Typing / Activity Indicator */}
                  {isWorking && (
                    <div style={{ display: 'flex', gap: 3 }}>
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: agent.color,
                        }}
                      />
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: agent.color,
                        }}
                      />
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: agent.color,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Round Meeting Table & Break Lounge at bottom */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            background: 'rgba(20, 16, 12, 0.7)',
            borderRadius: 14,
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 12,
            color: '#c4b396',
          }}
        >
          <span>🛋 Lounge Sofa & Coffee Station</span>
          <span style={{ color: '#F2C14E', fontWeight: 700 }}>● Conference Round Table</span>
          <span>🪴 Office Plants</span>
        </div>
      </div>
    </div>
  )
}
