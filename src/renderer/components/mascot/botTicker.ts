/**
 * Shared animation ticker for live engine avatars.
 * One rAF loop drives every mounted avatar, so a long chat with dozens of
 * avatars never spawns dozens of loops. The loop lives only while at least
 * one avatar is subscribed.
 */

export type BotTickCallback = (wallSeconds: number, dtSeconds: number) => void

const subscribers = new Set<BotTickCallback>()
let raf = 0
let last = 0

function loop(ms: number) {
  if (subscribers.size === 0) {
    raf = 0
    last = 0
    return
  }
  // Bounded delta: a hidden-then-reshown tab resumes without jumping ahead.
  const dt = last ? Math.min((ms - last) / 1000, 0.064) : 0
  last = ms
  const now = ms / 1000
  subscribers.forEach((cb) => {
    try {
      cb(now, dt)
    } catch (err) {
      // One misbehaving avatar must never kill the shared loop.
      console.error('[botTicker] avatar tick failed', err)
    }
  })
  raf = requestAnimationFrame(loop)
}

export function subscribeBotTicker(cb: BotTickCallback): () => void {
  subscribers.add(cb)
  if (!raf) raf = requestAnimationFrame(loop)
  return () => {
    subscribers.delete(cb)
    if (subscribers.size === 0 && raf) {
      cancelAnimationFrame(raf)
      raf = 0
      last = 0
    }
  }
}
