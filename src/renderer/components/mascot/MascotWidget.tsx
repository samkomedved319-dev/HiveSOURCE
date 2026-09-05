import React, { useState, useRef, useEffect } from 'react'
import HexCompanion, { HexCompanionRef } from './HexCompanion'
import { grokPersonality, GrokCommentary } from '../../companion/grokPersonality'

export interface MascotWidgetProps {
  state?: 'idle' | 'thinking' | 'searching' | 'coding' | 'working' | 'done' | 'error' | 'sleep'
  face?: 'happy' | 'excited' | 'cool' | 'love' | 'wink' | 'surprised' | 'sad' | 'sleepy' | 'think' | 'neutral'
  speech?: string | null
  onStateChange?: (st: 'idle' | 'thinking' | 'searching' | 'coding' | 'working' | 'done' | 'error' | 'sleep') => void
  onSpeechChange?: (text: string | null) => void
  onFaceChange?: (face: any) => void
  className?: string
  style?: React.CSSProperties
}

export default function MascotWidget({
  state = 'idle',
  face,
  speech,
  onStateChange,
  onSpeechChange,
  onFaceChange,
  className = '',
  style,
}: MascotWidgetProps) {
  const companionRef = useRef<HexCompanionRef>(null)
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem('hive_mascot_minimized') === 'true'
  })
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('hive_mascot_sound') !== 'false'
  })
  const [isHovered, setIsHovered] = useState(false)

  // Floating position offset (draggable)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    localStorage.setItem('hive_mascot_minimized', String(isMinimized))
  }, [isMinimized])

  useEffect(() => {
    localStorage.setItem('hive_mascot_sound', String(soundEnabled))
  }, [soundEnabled])

  const handleSoundToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSoundEnabled((prev) => !prev)
  }

  const handleMinimizeToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMinimized((prev) => !prev)
  }

  const handleWave = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    companionRef.current?.wave()
    const com = grokPersonality.onWave()
    applyCommentary(com)
  }

  const handlePoke = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const engine = companionRef.current?.engine
    if (engine) {
      engine._poke(engine.pos.x, engine.pos.y)
    }
    const com = grokPersonality.onPoke()
    applyCommentary(com)
  }

  const handlePet = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const engine = companionRef.current?.engine
    if (engine) {
      engine.pet = 1.3
      engine.setFace('love')
    }
    const com = grokPersonality.onPet()
    applyCommentary(com)
  }

  const applyCommentary = (com: GrokCommentary) => {
    onSpeechChange?.(com.speech)
    if (com.face) onFaceChange?.(com.face)
    if (com.state) onStateChange?.(com.state)
  }

  // Header drag logic
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return
    isDraggingRef.current = true
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    })
  }

  const handlePointerUp = () => {
    isDraggingRef.current = false
  }

  // State badge styling — Grok monochrome: white idle, Grok blue for searching
  const getStateInfo = () => {
    switch (state) {
      case 'searching':
        return { label: 'RADAR SCAN', color: '#38BDF8', icon: '📡' }
      case 'coding':
        return { label: 'COMPILING', color: '#10B981', icon: '⚡' }
      case 'thinking':
        return { label: 'THINKING', color: '#60A5FA', icon: '🧠' }
      case 'working':
        return { label: 'WORKING', color: '#F59E0B', icon: '⚙️' }
      case 'done':
        return { label: 'VICTORY', color: '#34D399', icon: '🎉' }
      case 'error':
        return { label: 'GLITCH', color: '#EF4444', icon: '⚠️' }
      case 'sleep':
        return { label: 'DOZING', color: '#9CA3AF', icon: '💤' }
      default:
        return { label: 'GROK HEX', color: '#FAFAFA', icon: '⬣' }
    }
  }

  const stateInfo = getStateInfo()

  return (
    <div
      className={`mascot-widget-root ${className}`}
      style={{
        position: 'absolute',
        // Grok layout rule: the prompt bar is sacred and never covered.
        // ChatInput is ~150px tall (padding + composer), so dock the widget
        // fully above it instead of overlapping the composer like before.
        bottom: 168,
        right: 20,
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        userSelect: 'none',
        pointerEvents: 'auto',
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Minimized Floating Pill */}
      {isMinimized ? (
        <button
          onClick={handleMinimizeToggle}
          title="Open Grok Hex Companion"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 20,
            background: 'rgba(20, 21, 26, 0.92)',
            border: `1px solid ${stateInfo.color}40`,
            boxShadow: `0 4px 18px rgba(0,0,0,0.5), 0 0 12px ${stateInfo.color}25`,
            color: '#EDEDED',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: 14 }}>{stateInfo.icon}</span>
          <span style={{ color: stateInfo.color }}>Hex</span>
          <span
            style={{
              fontSize: 10,
              padding: '1px 5px',
              borderRadius: 4,
              background: `${stateInfo.color}20`,
              color: stateInfo.color,
            }}
          >
            {stateInfo.label}
          </span>
        </button>
      ) : (
        /* Full Companion Container */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Quick Action Toolbar (appears on hover or when state is active) */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: 172,
              padding: '3px 8px',
              borderRadius: '8px 8px 0 0',
              background: 'rgba(15, 16, 20, 0.88)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderBottom: 'none',
              backdropFilter: 'blur(8px)',
              cursor: 'grab',
              // Grok companion keeps its status pill always legible — never
              // fade the toolbar away while idle.
              opacity: isHovered || state !== 'idle' ? 1 : 0.85,
              transition: 'opacity 0.2s ease',
            }}
          >
            {/* Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11 }}>{stateInfo.icon}</span>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: stateInfo.color,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {stateInfo.label}
              </span>
            </div>

            {/* Quick Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Sound Toggle */}
              <button
                onClick={handleSoundToggle}
                title={soundEnabled ? 'Mute Mascot Sound' : 'Enable Mascot Sound'}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  padding: '2px',
                  color: soundEnabled ? '#FAFAFA' : '#6B7280',
                }}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>

              {/* Poke */}
              <button
                onClick={handlePoke}
                title="Poke Hex"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  padding: '2px',
                }}
              >
                👉
              </button>

              {/* Pet */}
              <button
                onClick={handlePet}
                title="Pet Hex"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  padding: '2px',
                }}
              >
                💖
              </button>

              {/* Wave */}
              <button
                onClick={handleWave}
                title="Wave to Hex"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  padding: '2px',
                }}
              >
                👋
              </button>

              {/* Minimize */}
              <button
                onClick={handleMinimizeToggle}
                title="Minimize Mascot"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 10,
                  color: '#9CA3AF',
                  padding: '2px 4px',
                }}
              >
                ─
              </button>
            </div>
          </div>

          {/* Hex Mascot 2D Canvas Mount */}
          <div
            style={{
              position: 'relative',
              width: 172,
              height: 145,
              borderRadius: '0 0 8px 8px',
              background: 'radial-gradient(ellipse at bottom, rgba(255,255,255,0.05) 0%, rgba(10,10,12,0.4) 75%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'visible',
            }}
          >
            <HexCompanion
              ref={companionRef}
              state={state}
              face={face}
              speech={speech}
              width={172}
              height={145}
              sound={soundEnabled}
              // Grok companion mode is always-on: never doze off mid-chat.
              autoSleep={0}
              onWave={() => {
                const com = grokPersonality.onWave()
                applyCommentary(com)
              }}
              onPoke={() => {
                const com = grokPersonality.onPoke()
                applyCommentary(com)
              }}
              onPet={() => {
                const com = grokPersonality.onPet()
                applyCommentary(com)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
