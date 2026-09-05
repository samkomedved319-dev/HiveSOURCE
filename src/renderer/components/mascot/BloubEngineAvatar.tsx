import { useEffect, useId, useRef, useState } from 'react'
import { NOTIF_BLUE, type DotRender } from '../../bot/decor'
import { BotEngine, type BotFrame } from '../../bot/engine'
import { mixHex } from '../../bot/skins'
import { DEMI_VIEWBOX, RAYON } from '../../bot/repere'
import type { StateId } from '../../bot/states'
import { SHAPE_BY_ID, type ShapeId } from '../../bot/skins'
import { subscribeBotTicker } from './botTicker'

/**
 * BloubEngineAvatar — the live Bloub engine rendered in React.
 * A React port of the BloubBot view: the same pure `sample(t)` engine drives
 * the same SVG recipe (eyes as mask holes, back/front orbit halves, depth
 * particles, notification pastille), advanced by one shared rAF ticker so any
 * number of mounted avatars costs a single loop.
 *
 * Gaze follow (cursor tracking with inertia) mirrors the reference behavior.
 */

interface BloubEngineAvatarProps {
  size?: number
  className?: string
  /** Engine state: idle, thinking, wink, wide, alert, notify, exclaim, sleep, ... */
  botState?: StateId
  /** Eyes track the cursor. Off for message rows (like frozen thumbnails). */
  follow?: boolean
  /** Half-side of the viewBox. 158 = full orbit margin; ~120 = tight face crop. */
  crop?: number
  /** Backing color showing through the eye holes. Omit for true holes. */
  paper?: string
  /** Body ink. Defaults to the measured rest black. */
  ink?: string
  /** Sampling rate. Hero/buddy surfaces run 60; message rows stay at 30. */
  fps?: number
  live?: boolean
  /** Bloub customizer shape (cercle, hexagone, goutte, …). */
  shapeId?: ShapeId | string
}

const DEFAULT_INK = '#F08A24'
const YAW_MAX = 16
const PITCH_BASE = 10
const PITCH_MAX = 13

const clamp1 = (v: number) => Math.max(-1, Math.min(1, v))

export default function BloubEngineAvatar({
  size = 38,
  className = '',
  botState = 'idle',
  follow = false,
  crop = DEMI_VIEWBOX,
  paper,
  ink = DEFAULT_INK,
  fps = 30,
  live = true,
  shapeId,
}: BloubEngineAvatarProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const maskId = `bea-mask-${uid}`
  const svgRef = useRef<SVGSVGElement | null>(null)
  const engineRef = useRef<BotEngine | null>(null)
  if (!engineRef.current) {
    const radii = SHAPE_BY_ID.get(shapeId || 'cercle')?.radii || null
    engineRef.current = new BotEngine(RAYON, botState, radii, null)
  }
  const clockRef = useRef(0)
  const lastSampleRef = useRef(-1)
  const [frame, setFrame] = useState<BotFrame>(() => engineRef.current!.sample(0))

  // Engine state transitions (dated on the avatar's own clock).
  useEffect(() => {
    engineRef.current?.setState(botState, clockRef.current)
  }, [botState])

  useEffect(() => {
    const radii = SHAPE_BY_ID.get(shapeId || 'cercle')?.radii || null
    engineRef.current?.setShape(radii, clockRef.current)
  }, [shapeId])

  // Static avatars sample one frozen frame and skip the ticker entirely.
  useEffect(() => {
    if (!live) {
      try {
        engineRef.current?.setState(botState, 0)
        if (engineRef.current) setFrame(engineRef.current.sample(0))
      } catch {}
    }
  }, [live, botState])

  // Shared-ticker sampling, throttled per avatar.
  useEffect(() => {
    if (!live) return
    const engine = engineRef.current!
    const minStep = 1 / Math.max(1, fps)
    return subscribeBotTicker((_now, dt) => {
      clockRef.current += dt
      if (clockRef.current - lastSampleRef.current < minStep) return
      lastSampleRef.current = clockRef.current
      setFrame(engine.sample(clockRef.current))
    })
  }, [fps, live])

  // Cursor gaze tracking with engine-side inertia.
  useEffect(() => {
    if (!follow) return
    const engine = engineRef.current!
    let aiming = false

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const box = svgRef.current?.getBoundingClientRect()
      if (!box || box.width === 0 || box.height === 0) return
      const halfW = Math.max(1, window.innerWidth / 2)
      const halfH = Math.max(1, window.innerHeight / 2)
      const nx = clamp1((e.clientX - (box.left + box.width / 2)) / halfW)
      const ny = clamp1((e.clientY - (box.top + box.height / 2)) / halfH)
      engine.setLook(
        { yaw: nx * YAW_MAX, pitch: PITCH_BASE - ny * PITCH_MAX, mix: 1, spin: 0, wander: 0 },
        clockRef.current
      )
      aiming = true
    }
    const onLeave = () => {
      if (!aiming) return
      engine.setLook(null, clockRef.current)
      aiming = false
    }

    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      onLeave()
    }
  }, [follow])

  const dotFill = (dot: DotRender) =>
    dot.color ?? (dot.depth === undefined || !paper ? ink : mixHex(paper, ink, dot.depth))

  const vb = crop

  return (
    <div className={className} style={{ width: size, height: size, flexShrink: 0 }} role="img" aria-label="Hive avatar">
      <svg ref={svgRef} width={size} height={size} viewBox={`${-vb} ${-vb} ${vb * 2} ${vb * 2}`} className="block">
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x={-vb} y={-vb} width={vb * 2} height={vb * 2}>
            <path d={frame.bodyPath} fill="#fff" />
            {frame.eyes.map((eye, i) => (
              <path key={i} d={eye.d} transform={eye.matrix} opacity={eye.alpha} fill="#000" />
            ))}
            {frame.notch && <circle cx={frame.notch.x} cy={frame.notch.y} r={frame.notch.r} fill="#000" />}
          </mask>
          {frame.arcs.map((arc) => (
            <linearGradient
              key={arc.id}
              id={`${uid}-${arc.id}`}
              gradientUnits="userSpaceOnUse"
              x1={arc.grad.x1}
              y1={arc.grad.y1}
              x2={arc.grad.x2}
              y2={arc.grad.y2}
            >
              {arc.grad.stops.map((c, i) => (
                <stop key={i} offset={i / (arc.grad.stops.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
          ))}
        </defs>

        {/* back half of orbits: drawn first, occluded by the body */}
        <g fill="none" strokeLinecap="round">
          {frame.arcs.map((arc) => (
            <path
              key={`b${arc.id}`}
              d={arc.back}
              stroke={`url(#${uid}-${arc.id})`}
              strokeWidth={arc.width}
              opacity={arc.opacity}
            />
          ))}
        </g>

        {frame.dotsBehind && (
          <g>
            {frame.dots.map((dot, i) =>
              dot.d ? (
                <path
                  key={`pb${i}`}
                  d={dot.d}
                  transform={`translate(${dot.x} ${dot.y}) rotate(${dot.rot ?? 0}) scale(${RAYON})`}
                  fill={dotFill(dot)}
                  opacity={dot.opacity}
                />
              ) : (
                <circle key={`pb${i}`} cx={dot.x} cy={dot.y} r={dot.r} fill={dotFill(dot)} opacity={dot.opacity} />
              )
            )}
          </g>
        )}

        <g opacity={frame.bodyAlpha}>
          {paper && <path d={frame.bodyPath} fill={paper} />}
          <g mask={`url(#${maskId})`}>
            <rect x={-vb} y={-vb} width={vb * 2} height={vb * 2} fill={ink} />
          </g>
        </g>

        {!frame.dotsBehind && (
          <g>
            {frame.dots.map((dot, i) =>
              dot.d ? (
                <path
                  key={`pf${i}`}
                  d={dot.d}
                  transform={`translate(${dot.x} ${dot.y}) rotate(${dot.rot ?? 0}) scale(${RAYON})`}
                  fill={dotFill(dot)}
                  opacity={dot.opacity}
                />
              ) : (
                <circle key={`pf${i}`} cx={dot.x} cy={dot.y} r={dot.r} fill={dotFill(dot)} opacity={dot.opacity} />
              )
            )}
          </g>
        )}

        {frame.notif && <circle cx={frame.notif.x} cy={frame.notif.y} r={frame.notif.r} fill={NOTIF_BLUE} />}

        {/* front half of orbits */}
        <g fill="none" strokeLinecap="round">
          {frame.arcs.map((arc) => (
            <path
              key={`f${arc.id}`}
              d={arc.front}
              stroke={`url(#${uid}-${arc.id})`}
              strokeWidth={arc.width}
              opacity={arc.opacity}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
