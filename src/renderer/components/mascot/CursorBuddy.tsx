import { useEffect, useRef, useState } from 'react'
import BloubEngineAvatar from './BloubEngineAvatar'
import { subscribeBotTicker } from './botTicker'
import type { StateId } from '../../bot/states'
import { getBuddyMascotId, getMascot } from './mascotLibrary'

import { MODE_MODELS } from '../layout/TitleBar'

export const BUDDY_SETTINGS_EVENT = 'hive:buddy-settings'
export const BUDDY_PHASE_EVENT = 'hive:buddy-phase'
export type BuddyLivePhase = 'idle' | 'listening' | 'thinking' | 'clicking' | 'typing' | 'running' | 'done' | 'error'

const PHASE_STATE: Record<BuddyLivePhase, StateId> = {
  idle: 'idle',
  listening: 'wide',
  thinking: 'thinking',
  clicking: 'exclaim',
  typing: 'wide',
  running: 'orbit',
  done: 'idle',
  error: 'alert',
}

export function getBuddyPhaseState(phase: BuddyLivePhase): StateId {
  return PHASE_STATE[phase] ?? 'idle'
}

export const BUDDY_COLORS = [
  { hex: '#F2C14E', label: 'Hive Gold' },
  { hex: '#F08A24', label: 'Orange' },
  { hex: '#0a0a0c', label: 'Ink' },
  { hex: '#EDEDEF', label: 'Ghost' },
] as const

export function isBuddyEnabled(): boolean {
  try {
    return localStorage.getItem('hive_buddy_enabled') === 'true'
  } catch {
    return false
  }
}

export function getBuddySpeed(): 'fast' | 'auto' | 'no' {
  try {
    const raw = localStorage.getItem('hive_buddy_model') || 'auto'
    if (raw === 'fast' || raw === 'auto' || raw === 'no') return raw
    return 'auto'
  } catch {
    return 'auto'
  }
}

export function getBuddyModel(): string {
  const speed = getBuddySpeed()
  if (speed === 'no') return ''
  if (speed === 'fast') return MODE_MODELS.fast
  try {
    return localStorage.getItem('hive_model') || MODE_MODELS.auto
  } catch {
    return MODE_MODELS.auto
  }
}

export function getBuddyColor(): string {
  try {
    const stored = localStorage.getItem('hive_buddy_color')
    if (stored) return stored
    return getMascot(getBuddyMascotId()).ink
  } catch {
    return '#F08A24'
  }
}

/** Reactive buddy color — refreshes on Settings save. */
export function useBuddyColor(): string {
  const [color, setColor] = useState(getBuddyColor)
  useEffect(() => {
    const sync = () => setColor(getBuddyColor())
    window.addEventListener(BUDDY_SETTINGS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(BUDDY_SETTINGS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return color
}

/** Broadcast overlay phase so every buddy surface animates together. */
export function broadcastBuddyPhase(phase: BuddyLivePhase) {
  try {
    window.dispatchEvent(new CustomEvent(BUDDY_PHASE_EVENT, { detail: phase }))
  } catch {}
  try {
    window.electronAPI?.buddy?.phase?.(phase)
  } catch {}
}

/**
 * CursorBuddy — the Hive house avatar rides next to the cursor, trailing it
 * with a soft spring lag while its eyes track the pointer. Purely present:
 * click-through, lives under modals, toggled in Settings → General.
 */
export default function CursorBuddy() {
  const [enabled, setEnabled] = useState(isBuddyEnabled)
  const [mascotId, setMascotId] = useState(getBuddyMascotId)
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [livePhase, setLivePhase] = useState<BuddyLivePhase>('idle')
  const [clickPop, setClickPop] = useState(false)
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const color = useBuddyColor()
  const targetRef = useRef({ x: -100, y: -100 })
  const posRef = useRef({ x: -100, y: -100 })
  const visibleRef = useRef(false)
  // When Electron hosts the system-wide buddy window, it owns the cursor
  // follower and this in-app layer stands down (browser dev fallback stays).
  const hasOuter = typeof window.electronAPI?.buddy?.setOuterEnabled === 'function'

  useEffect(() => {
    const sync = () => {
      const on = isBuddyEnabled()
      setEnabled(on)
      setMascotId(getBuddyMascotId())
      if (hasOuter) {
        try {
          window.electronAPI?.buddy?.setOuterEnabled?.(on)
        } catch {}
      }
    }
    sync()
    window.addEventListener(BUDDY_SETTINGS_EVENT, sync)
    return () => window.removeEventListener(BUDDY_SETTINGS_EVENT, sync)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onPhase = (e: Event) => {
      const phase = (e as CustomEvent<BuddyLivePhase>).detail
      if (phase) setLivePhase(phase)
    }
    window.addEventListener(BUDDY_PHASE_EVENT, onPhase)
    return () => window.removeEventListener(BUDDY_PHASE_EVENT, onPhase)
  }, [])

  useEffect(() => {
    if (!enabled || hasOuter) return
    const onMove = (e: PointerEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY }
      // Guarded: pointermove fires constantly; only re-render on flip.
      if (!visibleRef.current) {
        visibleRef.current = true
        setVisible(true)
      }
    }
    // Click pop: the buddy reacts to your clicks with a quick exclaim morph.
    const onDown = () => {
      setClickPop(true)
      if (popTimer.current) clearTimeout(popTimer.current)
      popTimer.current = setTimeout(() => setClickPop(false), 550)
    }
    const onLeave = () => {
      visibleRef.current = false
      setVisible(false)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    document.addEventListener('pointerleave', onLeave)
    const unsubscribe = subscribeBotTicker((_now, dt) => {
      const t = targetRef.current
      const p = posRef.current
      // Teleport catch-up after jumps (monitor switch, fast fling).
      if (Math.hypot(t.x - p.x, t.y - p.y) > 600) {
        posRef.current = { ...t }
        setPos({ ...t })
        return
      }
      const k = dt <= 0 ? 1 : Math.min(1, dt * 10)
      const nx = p.x + (t.x - p.x) * k
      const ny = p.y + (t.y - p.y) * k
      // Skip sub-pixel re-renders: the compositor swim they caused read as jitter.
      if (Math.hypot(nx - p.x, ny - p.y) < 0.6) return
      if (Math.abs(nx - p.x) > 0.4 || Math.abs(ny - p.y) > 0.4) {
        posRef.current = { x: nx, y: ny }
        setPos({ x: nx, y: ny })
      }
    })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerleave', onLeave)
      if (popTimer.current) clearTimeout(popTimer.current)
      unsubscribe()
    }
  }, [enabled])

  if (!enabled || hasOuter || !visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x + 20,
        top: pos.y + 24,
        zIndex: 60,
        pointerEvents: 'none',
        filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.55))',
      }}
      aria-hidden
    >
      <BloubEngineAvatar
        size={46}
        crop={122}
        follow
        botState={clickPop ? 'exclaim' : PHASE_STATE[livePhase]}
        ink={getMascot(mascotId).ink}
        paper={getMascot(mascotId).paper}
        shapeId={getMascot(mascotId).shape}
        fps={60}
      />
    </div>
  )
}
