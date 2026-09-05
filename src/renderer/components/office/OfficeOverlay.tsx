import React, { useEffect, useRef, useState, Component, type ReactNode, lazy, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { FLOOR_CREW, moodFromEvent, type AgentMood } from './crew'
import type { HiveSwarmEvent } from '../../types'
import { useAgentStore } from '../../stores/agentStore'
import { useChatStore } from '../../stores/chatStore'
import { emitTitleChat } from '../../chatTitle'
import IsometricFloor from './IsometricFloor'

const Office3D = lazy(() => import('./Office3D'))

// Check if WebGL is supported in the current environment
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return Boolean(gl)
  } catch {
    return false
  }
}

// Error boundary to catch any Canvas or WebGL crash cleanly without black screen
interface ErrorBoundaryProps {
  fallback: ReactNode
  children: ReactNode
  onError?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('[Office] WebGL ErrorBoundary caught error:', error)
    this.props.onError?.()
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function pickSpeaker(task: string) {
  const t = task.toLowerCase()
  if (/\b(search|web|find|news|who is|what is|lookup)\b/.test(t)) return 'Scout'
  if (/\b(code|fix|build|bug|file|repo|script)\b/.test(t)) return 'Apollo'
  if (/\b(review|critique|wrong|ship)\b/.test(t)) return 'Critic'
  if (/\b(risk|assume|pulse|check)\b/.test(t)) return 'Pulse'
  if (/\b(intel|athena)\b/.test(t)) return 'Athena'
  return 'Hive'
}

function readable(raw: string) {
  let t = raw.replace(/\r/g, '')
  t = t.replace(/```[\s\S]*?```/g, (b) => b.replace(/^```\w*\n?/, '').replace(/```$/, '').trim())
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
  t = t.replace(/`([^`]+)`/g, '$1').replace(/^\s*[-*]\s+/gm, '• ').trim()
  if (t.length > 900) t = t.slice(0, 900) + '…'
  return t
}

export default function OfficeOverlay({ onClose }: { onClose: () => void }) {
  const [moods, setMoods] = useState<Record<string, AgentMood>>({})
  const [meeting, setMeeting] = useState(false)
  const [task, setTask] = useState('')
  const [busy, setBusy] = useState(false)
  const [viewMode, setViewMode] = useState<'3d' | 'iso'>('iso')
  const [webglAvailable, setWebglAvailable] = useState<boolean>(() => checkWebGLSupport())
  const [live3d, setLive3d] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const speaker = useRef('Hive')
  const { activeAgent, agents, setActiveAgent } = useAgentStore()
  const addMessage = useChatStore((s) => s.addMessage)
  const thread = useChatStore((s) => (activeAgent ? s.messages[activeAgent.id] : []) || [])

  // Auto-scroll chat history
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [thread])

  useEffect(() => {
    if (!webglAvailable) return
    const t = window.setTimeout(() => setViewMode('3d'), 400)
    return () => window.clearTimeout(t)
  }, [webglAvailable])
  useEffect(() => {
    const handleContextLost = (e: Event) => {
      e.preventDefault()
      console.warn('[Office] WebGL context lost; falling back to isometric floor')
      setWebglAvailable(false)
    }
    window.addEventListener('webglcontextlost', handleContextLost)
    return () => {
      window.removeEventListener('webglcontextlost', handleContextLost)
    }
  }, [])

  // Listen to swarm events
  useEffect(() => {
    const off = window.electronAPI?.hive?.onEvent?.((ev: HiveSwarmEvent) => {
      const who = ev.producerName || 'Hive'
      setMoods((p) => ({ ...p, [who.toLowerCase()]: moodFromEvent(ev) }))
      if (ev.type === 'inference.started' || ev.type === 'function_call.started') setMeeting(true)
      if (ev.type === 'model.answer') window.setTimeout(() => setMeeting(false), 2400)
    })
    return () => {
      try {
        off?.()
      } catch {}
    }
  }, [])

  // Send task from Office: updates chat store and emits TITLE_EVENT to title sidebar conversation
  const send = async () => {
    const t = task.trim()
    if (!t || busy) return

    // Ensure active agent
    let currentAgent = activeAgent
    if (!currentAgent && agents.length > 0) {
      currentAgent = agents.find((a) => a.isCeo) || agents[0]
      setActiveAgent(currentAgent)
    }
    const agentId = currentAgent?.id
    if (!agentId) return

    setBusy(true)
    setTask('')
    setMeeting(true)
    speaker.current = pickSpeaker(t)

    // Append user message
    addMessage(agentId, {
      id: `m-${Date.now()}`,
      agentId,
      content: t,
      role: 'user',
      timestamp: Date.now(),
      type: 'text',
      via: 'local',
    })

    // Emit title event so the chat thread in the sidebar auto-titles ChatGPT-style
    emitTitleChat(t)

    try {
      void window.electronAPI?.hive?.send?.(t, 'office')
      const res = await window.electronAPI?.ai?.chat?.(
        [
          { role: 'system', content: `You are ${speaker.current} at the Hive office. Reply as that one person. Short, useful.` },
          { role: 'user', content: t },
        ],
        undefined,
        { webSearch: speaker.current === 'Scout' }
      )
      const reply = res?.content || `${speaker.current}: On it.`
      addMessage(agentId, {
        id: `m-${Date.now()}`,
        agentId,
        content: reply,
        role: 'assistant',
        timestamp: Date.now(),
        type: 'text',
        via: 'local',
      })
    } catch {
      addMessage(agentId, {
        id: `m-${Date.now()}`,
        agentId,
        content: `${speaker.current}: Working on "${t}" across the floor.`,
        role: 'assistant',
        timestamp: Date.now(),
        type: 'text',
        via: 'local',
      })
    } finally {
      setBusy(false)
      window.setTimeout(() => setMeeting(false), 3000)
    }
  }

  const renderFloor = () => {
    return (
      <>
        <IsometricFloor moods={moods} meeting={meeting} />
        {webglAvailable && viewMode === '3d' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: live3d ? 1 : 0,
              pointerEvents: live3d ? 'auto' : 'none',
              background: '#c9a66b',
            }}
          >
            <WebGLErrorBoundary
              onError={() => setWebglAvailable(false)}
              fallback={null}
            >
              <Suspense fallback={null}>
                <Office3D moods={moods} meeting={meeting} onReady={() => setLive3d(true)} />
              </Suspense>
            </WebGLErrorBoundary>
          </div>
        )}
      </>
    )
  }

  const ui = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        display: 'flex',
        flexDirection: 'column',
        background: '#F2C14E',
        color: '#111',
        fontFamily: 'inherit',
        overflow: 'hidden',
      }}
    >
      {/* Office Header Toolbar */}
      <div
        style={{
          height: 56,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: '#0d0b09',
          borderBottom: '1px solid rgba(242, 193, 78, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Gold BACK TO CHAT button that always works */}
          <button type="button" onClick={onClose} style={goldBtn}>
            ← BACK TO CHAT
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 900, letterSpacing: '.06em', color: '#F2C14E', fontSize: 15 }}>
              HIVE OFFICE
            </span>
            <span
              style={{
                fontSize: 11,
                color: meeting ? '#F2C14E' : '#73c991',
                background: 'rgba(255,255,255,0.06)',
                padding: '2px 8px',
                borderRadius: 99,
                fontWeight: 600,
              }}
            >
              {meeting ? '● Swarm Task Running' : '● Live 3D'}
            </span>
          </div>
        </div>

        {/* View Switcher: Claw3D vs Isometric Floor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            disabled={!webglAvailable}
            style={viewMode === '3d' && webglAvailable ? activeSwitchBtn : switchBtn}
            title={webglAvailable ? '3D ClawOffice (Three.js)' : 'WebGL not supported on this device'}
          >
            Claw3D
          </button>
          <button
            type="button"
            onClick={() => setViewMode('iso')}
            style={viewMode === 'iso' || !webglAvailable ? activeSwitchBtn : switchBtn}
          >
            Isometric Floor
          </button>
        </div>
      </div>

      {/* Main 3D Scene / Isometric Office Floor (Never black screen) */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 280,
          background: '#F2C14E',
          overflow: 'hidden',
        }}
      >
        {renderFloor()}
      </div>

      {/* Bottom Chat Section (Connected to same chat store & sidebar conversation) */}
      <div
        style={{
          height: 220,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#0d0b09',
          borderTop: '2px solid rgba(242, 193, 78, 0.25)',
        }}
      >
        {/* Messages transcript */}
        <div ref={scroller} style={{ flex: 1, overflow: 'auto', padding: '12px 18px' }}>
          {thread.length === 0 && (
            <div style={{ color: '#8c7d6b', fontSize: 13, padding: '10px 0' }}>
              Connected to main Chat. Enter a command or query to task the floor agents.
            </div>
          )}
          {thread.map((row) => {
            const isUser = row.role === 'user'
            const who = isUser ? 'You' : row.botName || 'Hive'
            const color = FLOOR_CREW.find((a) => a.name.toLowerCase() === who.toLowerCase())?.color || '#F2C14E'

            return (
              <div key={row.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: isUser ? '#F2C14E' : color, marginBottom: 2 }}>
                  {who}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.45, color: '#e8ded0', whiteSpace: 'pre-wrap' }}>
                  {row.content}
                </div>
              </div>
            )
          })}
        </div>

        {/* Input prompt */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
          style={{
            display: 'flex',
            gap: 10,
            padding: '10px 16px 14px',
            background: '#120f0c',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Task the office floor (e.g. 'Scout research competitor APIs', 'Apollo fix the bug')..."
            style={{
              flex: 1,
              background: '#1b1713',
              border: '1px solid rgba(242, 193, 78, 0.25)',
              color: '#fff',
              borderRadius: 8,
              padding: '10px 14px',
              fontFamily: 'inherit',
              fontSize: 13.5,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={busy || !task.trim()}
            style={{
              ...goldBtn,
              opacity: busy || !task.trim() ? 0.6 : 1,
              cursor: busy || !task.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? 'Working…' : 'Send Task'}
          </button>
        </form>
      </div>
    </div>
  )

  return createPortal(ui, document.body)
}

const goldBtn: React.CSSProperties = {
  background: '#F2C14E',
  color: '#111',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontWeight: 800,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '.02em',
  boxShadow: '0 2px 8px rgba(242, 193, 78, 0.25)',
  transition: 'transform 0.15s ease, background 0.15s ease',
}

const switchBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  color: '#a89d8f',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '6px 12px',
  fontWeight: 700,
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const activeSwitchBtn: React.CSSProperties = {
  background: 'rgba(242, 193, 78, 0.15)',
  color: '#F2C14E',
  border: '1px solid #F2C14E',
  borderRadius: 8,
  padding: '6px 12px',
  fontWeight: 800,
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
