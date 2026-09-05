import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
// @ts-ignore
import HexMascot from '../../companion/hex-mascot'
import BloubMascot from './BloubMascot'
import { getKitPose, getKitAccent } from './mascotKit'

export interface HexCompanionProps {
  state?: 'idle' | 'thinking' | 'searching' | 'coding' | 'working' | 'done' | 'error' | 'sleep'
  face?: 'happy' | 'excited' | 'cool' | 'love' | 'wink' | 'surprised' | 'sad' | 'sleepy' | 'think' | 'neutral'
  speech?: string | null
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  onWave?: () => void
  onPoke?: () => void
  onPet?: () => void
  sound?: boolean
  calm?: boolean
  autoSleep?: number
}

export interface HexCompanionRef {
  wave: () => void
  say: (text: string) => void
  setState: (st: string) => void
  setFace: (face: string) => void
  engine: any
}

const HexCompanion = forwardRef<HexCompanionRef, HexCompanionProps>(function HexCompanion(
  {
    state = 'idle',
    face,
    speech,
    width = 240,
    height = 200,
    className = '',
    style,
    onWave,
    onPoke,
    onPet,
    sound = false,
    calm = false,
    // Grok companion is always-on: no auto-sleep unless a caller opts in.
    autoSleep = 0,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<any>(null)
  const prevSpeechRef = useRef<string | null>(null)
  // Static SVG poster: shown only if the canvas engine fails to paint
  // (mount throw or blank pixels after grace period). Guarantees the
  // widget never renders as an empty box.
  const [showPoster, setShowPoster] = useState(false)

  useImperativeHandle(ref, () => ({
    wave: () => engineRef.current?.wave(),
    say: (text: string) => engineRef.current?.say(text),
    setState: (st: string) => engineRef.current?.setState(st),
    setFace: (f: string) => engineRef.current?.setFace(f),
    // Live getter: the engine mounts async, so a captured value would stay null.
    get engine() {
      return engineRef.current
    },
  }))

  useEffect(() => {
    HexMascot.setSound(sound)
  }, [sound])

  useEffect(() => {
    if (!containerRef.current) return

    let engine: any = null
    let alive = true
    let timer: ReturnType<typeof setTimeout> | null = null

    try {
      engine = HexMascot.mount(containerRef.current, {
        w: width,
        h: height,
        autoSleep,
        calm,
      })
      engineRef.current = engine

      if (onWave) {
        engine.on('wave', onWave)
      }
      if (onPoke) {
        engine.on('poke', onPoke)
      }

      // Blank-canvas watchdog: if the engine runs but paints nothing
      // visible (dead RAF, lost context, GPU hiccup), fall back to the
      // static SVG poster instead of an empty box.
      timer = setTimeout(() => {
        if (!alive || !engine) return
        let painted = (engine.frames || 0) > 0
        try {
          const cv = engine.cnv
          const ctx = engine.ctx
          if (painted && ctx && cv && typeof ctx.getImageData === 'function' && cv.width > 0 && cv.height > 0) {
            const d = ctx.getImageData(0, 0, cv.width, cv.height).data
            painted = false
            for (let i = 3; i < d.length; i += 16) {
              if (d[i] > 4) {
                painted = true
                break
              }
            }
          }
        } catch {
          // Unreadable canvas (mock ctx, tainted buffer) — trust the frame counter.
        }
        if (!painted && alive) {
          try {
            engine.destroy()
          } catch {}
          if (engineRef.current === engine) engineRef.current = null
          setShowPoster(true)
        }
      }, 1200)
    } catch {
      setShowPoster(true)
    }

    return () => {
      alive = false
      if (timer) clearTimeout(timer)
      if (engine) {
        try {
          engine.destroy()
        } catch {}
      }
      if (engineRef.current === engine) engineRef.current = null
    }
  }, [width, height, calm, autoSleep])

  useEffect(() => {
    if (engineRef.current && state) {
      engineRef.current.setState(state)
    }
  }, [state])

  useEffect(() => {
    if (engineRef.current && face) {
      engineRef.current.setFace(face)
    }
  }, [face])

  useEffect(() => {
    if (engineRef.current && speech && speech !== prevSpeechRef.current) {
      engineRef.current.say(speech)
      prevSpeechRef.current = speech
    }
  }, [speech])

  if (showPoster) {
    return (
      <div
        className={`hex-companion-host hex-companion-poster ${className}`}
        style={{
          width,
          height,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          ...style,
        }}
        title="Mascot (static mode)"
      >
        <BloubMascot pose={getKitPose(state)} accent={getKitAccent(state)} size={Math.min(width, height)} />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`hex-companion-host ${className}`}
      style={{
        width,
        height,
        position: 'relative',
        userSelect: 'none',
        ...style,
      }}
    />
  )
})

export default HexCompanion
