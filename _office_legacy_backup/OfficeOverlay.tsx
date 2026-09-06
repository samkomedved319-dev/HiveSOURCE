import React, { useEffect, useRef, useState, Component, type ReactNode, lazy, Suspense } from 'react'
import { FLOOR_CREW, moodFromEvent, type AgentMood } from './crew'
import type { HiveSwarmEvent } from '../../types'
import { useAgentStore } from '../../stores/agentStore'
import { useChatStore } from '../../stores/chatStore'
import { emitTitleChat } from '../../chatTitle'
import IsometricFloor from './IsometricFloor'

const Office3D = lazy(() => import('./Office3D'))

// Check if WebGL is supported in the current environment.
// Runs once on mount — never blocks the default 2D floor.
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as unknown as WebGLRenderingContext | null)
    if (gl) {
      // Best-effort cleanup of the probe context.
      try {
        const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')
        ext?.loseContext()
      } catch {}
      return true
    }
    return false
  } catch {
    return false
  }
}

// Error boundary to catch any 3D crash cleanly without black screen.
// NOTE: errors *inside* <Canvas> (react-three-fiber reconciler) do NOT
// propagate here — Office3D has its own inner boundary for that case.
// This one guards the lazy-load / outer DOM layer only.
interface ErrorBoundaryProps {
  fallback: ReactNode
  children: ReactNode
  resetKey?: string | number
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

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ hasError: false })
    }
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

export default function OfficeOverlay({ onClose }: { onClose: () => void }) {
  const [moods, setMoods] = useState<Record<string, AgentMood>>({})
  const [meeting, setMeeting] = useState(false)
  const [task, setTask] = useState('')
  const [busy, setBusy] = useState(false)
  // Default is ALWAYS the DOM isometric floor — pure DOM/CSS, can never be black.
  // 3D (WebGL) is strictly opt-in via the Claw3D button and renders as an
  // overlay on top; the 2D floor stays mounted underneath until 3D proves ready.
  const [viewMode, setViewMode] = useState<'3d' | 'iso'>('iso')
  const [webglOk, setWebglOk] = useState<boolean | null>(null)
  const [threeReady, setThreeReady] = useState(false)
  const [threeError, setThreeError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)
  const speaker = useRef('Hive')
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { activeAgent, agents, setActiveAgent } = useAgentStore()
  const addMessage = useChatStore((s) => s.addMessage)
  const thread = useChatStore((s) => (activeAgent ? s.messages[activeAgent.id] : []) || [])

  // Auto-scroll chat history
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [thread])

  // Probe WebGL once on mount so the Claw3D button can be disabled early
  // with a clear tooltip instead of going black on click.
  useEffect(() => {
    try {
      setWebglOk(checkWebGLSupport())
    } catch {
      setWebglOk(false)
    }
  }, [])

  // If the GPU context is lost at any point, drop back to the 2D floor
  // instead of leaving a black canvas on screen.
  useEffect(() => {
    const handleContextLost = (e: Event) => {
      e.preventDefault()
      console.warn('[Office] WebGL context lost; falling back to isometric floor')
      setThreeReady(false)
      setThreeError('Graphics context was lost — back on the 2D floor.')
      setViewMode('iso')
    }
    const canvasHandler = (e: Event) => handleContextLost(e)
    window.addEventListener('webglcontextlost', canvasHandler)
    return () => {
      window.removeEventListener('webglcontextlost', canvasHandler)
      if (loadTimer.current) clearTimeout(loadTimer.current)
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

  const failThree = (msg: string) => {
    console.warn('[Office] 3D disabled:', msg)
    setThreeError(msg)
    setThreeReady(false)
    if (loadTimer.current) clearTimeout(loadTimer.current)
    // Keep the 2D floor visible underneath; drop the overlay after a beat
    // so the user sees the reason instead of a flash of black.
    window.setTimeout(() => setViewMode('iso'), 1800)
  }

  const requestThree = () => {
    const ok = webglOk ?? checkWebGLSupport()
    setWebglOk(ok)
    if (!ok) {
      setThreeError('WebGL is not available in this window — staying on the 2D floor.')
      setViewMode('iso')
      return
    }
    setThreeError(null)
    setThreeReady(false)
    setRetryKey((k) => k + 1)
    setViewMode('3d')
    if (loadTimer.current) clearTimeout(loadTimer.current)
    // Safety net: if the 3D scene never reports a real first frame
    // (missing GLBs, driver hiccup), fall back instead of staying black.
    loadTimer.current = setTimeout(() => {
      setThreeReady((ready) => {
        if (!ready) {
          failThree('3D is taking too long to start — back on the 2D floor.')
        }
        return ready
      })
    }, 10000)
  }

  const handleThreeReady = () => {
    if (loadTimer.current) clearTimeout(loadTimer.current)
    setThreeError(null)
    setThreeReady(true)
  }

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

  const showThreeLayer = viewMode === '3d' && webglOk !== false

  const renderFloor = () => {
    return (
      <>
        {/* Base layer: pure DOM isometric floor. Always mounted, never black. */}
        <IsometricFloor moods={moods} meeting={meeting} />
        {showThreeLayer && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              // Keep the 2D floor visible until 3D has rendered a real frame.
              opacity: threeReady ? 1 : 0,
              pointerEvents: threeReady ? 'auto' : 'none',
              background: '#c9a66b',
              transition: 'opacity 350ms ease',
            }}
          >
            <WebGLErrorBoundary
              resetKey={retryKey}
              onError={() => failThree('3D failed to load — back on the 2D floor.')}
              fallback={null}
            >
              <Suspense fallback={null}>
                <Office3D
                  key={retryKey}
                  moods={moods}
                  meeting={meeting}
                  onReady={handleThreeReady}
                  onError={(msg) => failThree(msg)}
                />
              </Suspense>
            </WebGLErrorBoundary>
          </div>
        )}
        {/* Loading / error veil: sits above the 2D floor, never a black screen. */}
        {showThreeLayer && !threeReady && (
          <div
            style={{
              position: 'absolute',
              left: 12,
              right: 12,
              bottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                background: 'rgba(13,11,9,0.92)',
                border: `1px solid ${threeError ? '#f87171' : 'rgba(242,193,78,0.4)'}`,
                color: threeError ? '#fecaca' : '#F2C14E',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              {threeError || 'Starting Claw3D… (2D floor stays visible until ready)'}
            </div>
          </div>
        )}
      </>
    )
  }

  // NOTE: rendered inline in the App layout (no createPortal). A fixed-position
  // portal to document.body breaks when an ancestor has transform/filter and
  // leaves an empty (dark) grid cell behind — which reads as "black screen".
  // Inline flex layout always has a real height from the parent.
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        height: '100%',
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
              {meeting ? '● Swarm Task Running' : threeReady && viewMode === '3d' ? '● Live 3D' : '● 2D Floor'}
            </span>
          </div>
        </div>

        {/* View Switcher: Claw3D vs Isometric Floor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={requestThree}
            disabled={webglOk === false}
            style={
              viewMode === '3d' && threeReady
                ? activeSwitchBtn
                : webglOk === false
                  ? { ...switchBtn, opacity: 0.45, cursor: 'not-allowed' }
                  : switchBtn
            }
            title={
              webglOk === false
                ? 'WebGL is unavailable here — 2D floor only'
                : 'Load Claw3D furniture (WebGL, opt-in)'
            }
          >
            Claw3D
          </button>
          <button
            type="button"
            onClick={() => {
              if (loadTimer.current) clearTimeout(loadTimer.current)
              setViewMode('iso')
              setThreeReady(false)
              setThreeError(null)
            }}
            style={viewMode === 'iso' || !threeReady ? activeSwitchBtn : switchBtn}
          >
            Floor
          </button>
        </div>
      </div>

      {/* Main Scene / Isometric Office Floor (Never black screen) */}
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
