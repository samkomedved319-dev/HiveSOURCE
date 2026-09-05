import { useEffect, useState } from 'react'
import BuddyOverlay from '../chat/BuddyOverlay'
import BloubEngineAvatar from './BloubEngineAvatar'
import {
  BUDDY_PHASE_EVENT,
  getBuddyColor,
  getBuddyPhaseState,
  useBuddyColor,
  type BuddyLivePhase,
} from './CursorBuddy'

/**
 * BuddyNotch — the Dynamic-Island page (`?overlay=notch`).
 * The main process morphs the window pill <-> panel and pushes
 * `buddy:notch-mode`; this page swaps the mini island for the full panel.
 * Hotkey pops it, Esc / click-away / gutter click dismisses it.
 */
export default function BuddyNotch() {
  const [mode, setMode] = useState<'pill' | 'full'>('pill')
  const [phase, setPhase] = useState<BuddyLivePhase>('idle')
  const color = useBuddyColor()

  useEffect(() => {
    document.body.style.background = 'transparent'
    document.body.style.overflow = 'hidden'
    const onPhase = (e: Event) => {
      const p = (e as CustomEvent<BuddyLivePhase>).detail
      if (p) setPhase(p)
    }
    window.addEventListener(BUDDY_PHASE_EVENT, onPhase)
    let offPhase: (() => void) | undefined
    let offMode: (() => void) | undefined
    try {
      offPhase = window.electronAPI?.buddy?.onPhase?.((p: string) => {
        if (
          p === 'idle' || p === 'listening' || p === 'thinking' || p === 'clicking' ||
          p === 'typing' || p === 'running' || p === 'done' || p === 'error'
        ) {
          setPhase(p)
        }
      })
      offMode = window.electronAPI?.buddy?.onNotchMode?.((m: string) => {
        setMode(m === 'full' ? 'full' : 'pill')
      })
    } catch {}
    return () => {
      window.removeEventListener(BUDDY_PHASE_EVENT, onPhase)
      try {
        offPhase?.()
        offMode?.()
      } catch {}
    }
  }, [])

  const hide = () => {
    try {
      window.electronAPI?.buddy?.notchHide?.()
    } catch {}
  }

  if (mode === 'pill') {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#000000',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 23,
            padding: '6px 16px 6px 8px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            animation: 'rise .2s var(--ease) forwards',
          }}
        >
          <BloubEngineAvatar size={30} crop={120} botState={getBuddyPhaseState(phase)} ink={color || getBuddyColor()} fps={60} />
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: phase === 'idle' ? '#F08A24' : '#F04438',
              animation: 'pulse 1.1s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, color: '#E7E9EA', whiteSpace: 'nowrap' }}>
            {phase === 'idle' ? 'Hive Buddy' : phase === 'listening' ? 'Listening…' : phase === 'thinking' ? 'Thinking…' : phase === 'clicking' ? 'Clicking…' : phase === 'typing' ? 'Typing…' : phase === 'running' ? 'Running…' : phase === 'done' ? 'Done' : 'Glitch…'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: 'transparent',
        padding: 8,
        boxSizing: 'border-box',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) hide()
      }}
    >
      <BuddyOverlay embedded startOpen onClose={hide} />
    </div>
  )
}
