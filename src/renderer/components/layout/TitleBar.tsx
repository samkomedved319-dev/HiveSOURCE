import React, { useEffect, useState, useRef } from 'react'
import packageJson from '../../../../package.json'

export type ThinkingMode = 'fast' | 'auto' | 'heavy' | 'max'

export interface ModelOption {
  id: string
  label: string
}

export const MODE_MODELS: Record<ThinkingMode, string> = {
  fast: 'nvidia/nemotron-3.5-lightning:free',
  auto: 'minimax/minimax-m3:free',
  heavy: 'nvidia/nemotron-3-super-120b-a12b:free',
  max: 'nvidia/nemotron-3-ultra-550b-a55b:free',
}

export const THINKING_MODES: { id: ThinkingMode; label: string; badge: string; desc: string }[] = [
  { id: 'fast', label: 'Fast', badge: 'F', desc: 'Lowest latency answers' },
  { id: 'auto', label: 'Auto', badge: 'A', desc: 'Balanced — Hive picks the stack' },
  { id: 'heavy', label: 'Heavy', badge: 'H', desc: 'Deep multi-angle analysis' },
  { id: 'max', label: 'Max', badge: 'M', desc: 'Maximum reflection depth' },
]


interface TitleBarProps {
  currentMode: ThinkingMode
  onChangeMode: (mode: ThinkingMode) => void
  isCanvasOpen: boolean
  onToggleCanvas: () => void
  onShare?: () => void
  onNewChat?: () => void
  onOpenWorkers?: () => void
  isConvListOpen?: boolean
  onToggleSidebar?: () => void
  onFeedback?: () => void
  compact?: boolean
}

export default function TitleBar({
  currentMode = 'auto',
  onChangeMode,
  isCanvasOpen,
  onToggleCanvas,
  onShare,
  onNewChat,
  onOpenWorkers,
  isConvListOpen = true,
  onToggleSidebar,
  onFeedback,
  compact = false,
}: TitleBarProps) {
  const [showSelector, setShowSelector] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSelector(false)
      }
    }
    if (showSelector) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSelector])

  const activeModeObj = THINKING_MODES.find((m) => m.id === currentMode) || THINKING_MODES[1]

  return (
    <div
      style={{
        height: 52,
        borderBottom: '1px solid var(--border-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px 0 20px',
        WebkitAppRegion: 'drag',
        background: 'var(--bg)',
        userSelect: 'none',
        flexShrink: 0,
        position: 'relative',
      } as React.CSSProperties}
    >
      {/* Left / Model & Mode selector pill + Sidebar Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }} ref={dropdownRef}>
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isConvListOpen ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--border-soft)',
              background: 'var(--panel)',
              color: isConvListOpen ? 'var(--accent)' : 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              WebkitAppRegion: 'no-drag',
              transition: 'all .15s',
            } as React.CSSProperties}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--panel-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--panel)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowSelector((prev) => !prev)}
          title="Select mode"

          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--panel)',
            border: showSelector ? '1px solid var(--accent-dim)' : '1px solid var(--border-soft)',
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: 12.5,
            color: 'var(--text)',
            cursor: 'pointer',
            WebkitAppRegion: 'no-drag',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color .15s, background .15s',
          } as React.CSSProperties}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--panel-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--panel)')}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'inline-block',
              boxShadow: '0 0 0 3px color-mix(in oklab, var(--accent) 22%, transparent)',
            }}
          />
          <span style={{ fontWeight: 600 }}>{activeModeObj.label}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 2, color: 'var(--text-faint)' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {showSelector && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 6,
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px 14px',
              width: 320,
              zIndex: 200,
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
              WebkitAppRegion: 'no-drag',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            } as React.CSSProperties}
          >
            {/* Mode selection */}
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  color: 'var(--text-faint)',
                  marginBottom: 6,
                  paddingLeft: 4,
                }}
              >
                Thinking Mode
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {THINKING_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      onChangeMode(mode.id)
                      setShowSelector(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: 7,
                      border: 'none',
                      background: currentMode === mode.id ? 'var(--panel-2)' : 'transparent',
                      color: currentMode === mode.id ? 'var(--accent)' : 'var(--text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={(e) => {
                      if (currentMode !== mode.id) e.currentTarget.style.background = 'var(--panel-2)'
                    }}
                    onMouseLeave={(e) => {
                      if (currentMode !== mode.id) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div>
                        <div style={{ fontSize: 13, fontWeight: currentMode === mode.id ? 600 : 500 }}>
                          {mode.label}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{mode.desc}</div>
                    </div>
                    {currentMode === mode.id && <span style={{ fontSize: 12 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {onOpenWorkers && (
              <>
                <div style={{ height: 1, background: 'var(--border-soft)' }} />
                <button
                  type="button"
                  onClick={() => {
                    setShowSelector(false)
                    onOpenWorkers()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 10px',
                    borderRadius: 7,
                    border: '1px solid var(--border)',
                    background: 'var(--panel-2)',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(242,193,78,0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--panel-2)')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="4" width="16" height="16" rx="3" />
                    <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                    <circle cx="15" cy="10" r="1.5" fill="currentColor" />
                    <path d="M8 15h8" strokeLinecap="round" />
                  </svg>
                  Manage AI Workers & Bots →
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right / Actions & Windows Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
      >
        <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: "'JetBrains Mono', monospace" }}>
          v{packageJson.version}
        </span>
        {/* New chat */}
        {onNewChat && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onNewChat()
            }}
            title="New chat"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color .2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 20h9" strokeLinecap="round" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        )}
        {!compact && onFeedback && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onFeedback()
            }}
            title="Send feedback"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              WebkitAppRegion: 'no-drag',
            } as React.CSSProperties}
          >
            Feedback
          </button>
        )}
        {/* Share */}
        {!compact && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onShare?.()
          }}
          title="Share formatted conversation"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-faint)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color .2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 3.9M15.4 6.6L8.6 10.5" />
          </svg>
        </button>
        )}

        {!compact && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleCanvas()
          }}
          title="HiveBox — live cloud desk"
          style={{
            background: isCanvasOpen ? 'rgba(242,193,78,0.15)' : 'var(--panel)',
            border: isCanvasOpen ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
            color: isCanvasOpen ? 'var(--accent)' : 'var(--text-dim)',
            cursor: 'pointer',
            padding: '4px 10px',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            fontWeight: 600,
            transition: 'all .15s',
          }}
          onMouseEnter={(e) => {
            if (!isCanvasOpen) e.currentTarget.style.color = 'var(--text)'
          }}
          onMouseLeave={(e) => {
            if (!isCanvasOpen) e.currentTarget.style.color = 'var(--text-dim)'
          }}
        >
          <span style={{ fontSize: 13 }}>👑</span>
          <span>HiveBox</span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
        </button>
        )}
      </div>
    </div>
  )
}