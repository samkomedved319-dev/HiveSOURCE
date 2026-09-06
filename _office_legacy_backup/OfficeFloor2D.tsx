import React, { useEffect, useRef } from 'react'
import { FLOOR_CREW, type AgentMood } from './crew'

export default function OfficeFloor2D({
  moods,
  meeting,
}: {
  moods: Record<string, AgentMood>
  meeting: boolean
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  // Keep the RAF loop mounted once; read latest moods/meeting via refs so
  // every swarm event doesn't tear down and restart the canvas (flicker).
  const moodsRef = useRef(moods)
  const meetingRef = useRef(meeting)
  moodsRef.current = moods
  meetingRef.current = meeting

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const t0 = performance.now()

    const desks = FLOOR_CREW.map((a, i) => ({
      a,
      col: i % 3,
      row: Math.floor(i / 3),
    }))

    const draw = (now: number) => {
      const w = canvas.clientWidth || 800
      const h = canvas.clientHeight || 400
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr)
        canvas.height = Math.floor(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = '#F2C14E'
      ctx.fillRect(0, 0, w, h)

      const t = (now - t0) / 1000
      const ox = w / 2
      const oy = h * 0.22
      const tile = Math.min(w, h) * 0.055

      const iso = (gx: number, gy: number) => ({
        x: ox + (gx - gy) * tile * 1.7,
        y: oy + (gx + gy) * tile * 0.85,
      })

      ctx.fillStyle = '#c9a66b'
      ctx.beginPath()
      const a = iso(-0.5, -0.5)
      const b = iso(8.5, -0.5)
      const c = iso(8.5, 6.5)
      const d = iso(-0.5, 6.5)
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.lineTo(c.x, c.y)
      ctx.lineTo(d.x, d.y)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#8a6a3a'
      ctx.lineWidth = 6
      ctx.stroke()

      const meet = iso(4, 0.4)
      const isMeeting = meetingRef.current
      const liveMoods = moodsRef.current
      ctx.fillStyle = isMeeting ? '#111' : '#3d3428'
      ctx.fillRect(meet.x - 70, meet.y - 22, 140, 44)
      ctx.fillStyle = '#F2C14E'
      ctx.font = 'bold 13px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(isMeeting ? 'MEETING' : 'GLASS ROOM', meet.x, meet.y + 5)

      desks.forEach(({ a: agent, col, row }) => {
        const mood = liveMoods[agent.id] || liveMoods[agent.name.toLowerCase()] || 'idle'
        const live = isMeeting || mood !== 'idle'
        const gx = live && isMeeting ? 3 + col * 0.7 : 0.6 + col * 2.6
        const gy = live && isMeeting ? 0.8 + row * 0.6 : 2.2 + row * 2.2
        const p = iso(gx, gy)
        const bob = live ? Math.sin(t * 8 + col) * 4 : 0

        ctx.fillStyle = '#6b5340'
        ctx.fillRect(p.x - 42, p.y - 8, 84, 28)
        ctx.fillStyle = '#111'
        ctx.fillRect(p.x - 28, p.y - 28, 56, 16)
        ctx.strokeStyle = agent.color
        ctx.lineWidth = 3
        ctx.strokeRect(p.x - 28, p.y - 28, 56, 16)

        ctx.beginPath()
        ctx.arc(p.x, p.y + 18 + bob, 11, 0, Math.PI * 2)
        ctx.fillStyle = agent.color
        ctx.fill()

        ctx.fillStyle = '#1a1712'
        ctx.font = 'bold 12px system-ui'
        ctx.fillText(agent.name, p.x, p.y + 42)
      })

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', background: '#F2C14E' }}
    />
  )
}
