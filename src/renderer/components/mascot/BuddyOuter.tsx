import { useEffect, useState } from 'react'
import BloubEngineAvatar from './BloubEngineAvatar'
import { BUDDY_PHASE_EVENT, getBuddyColor, getBuddyPhaseState, useBuddyColor, type BuddyLivePhase } from './CursorBuddy'

/**
 * BuddyOuter — the system-wide buddy window page (loaded as `?overlay=buddy`
 * in a transparent, click-through, always-on-top Electron window that trails
 * the global cursor). Same live engine, same phases, same ink as the in-app
 * buddy; the main process owns position + visibility.
 */
export default function BuddyOuter() {
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
    let off: (() => void) | undefined
    try {
      off = window.electronAPI?.buddy?.onPhase?.((p: string) => {
        if (
          p === 'idle' || p === 'listening' || p === 'thinking' || p === 'clicking' ||
          p === 'typing' || p === 'running' || p === 'done' || p === 'error'
        ) {
          setPhase(p)
        }
      })
    } catch {}
    // Same-origin localStorage is shared with the main window; the color
    // hook already refreshes on storage events from Settings saves.
    setPhase('idle')
    return () => {
      window.removeEventListener(BUDDY_PHASE_EVENT, onPhase)
      try {
        off?.()
      } catch {}
    }
  }, [])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.55))',
      }}
    >
      <BloubEngineAvatar size={60} crop={122} botState={getBuddyPhaseState(phase)} ink={color || getBuddyColor()} fps={60} />
    </div>
  )
}
