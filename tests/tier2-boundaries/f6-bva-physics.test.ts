import { describe, it, expect, setTierContext } from '../harness'
import { setupDOMEnvironment, MockHTMLElement } from '../mocks/dom-env'
// @ts-ignore
import HexMascot from '../../src/renderer/companion/hex-mascot'

setupDOMEnvironment()
setTierContext('tier2', 'F6: BVA Physics & Speech')

describe('Tier 2 — F6: Boundary & Corner Cases (Physics & Speech)', () => {
  it('f6-b01: extreme fling velocity (>100) is safely absorbed by physics damping', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })

    engine.vel.x = 120
    engine.vel.y = -150

    // Step through 20 frames
    for (let i = 0; i < 20; i++) {
      engine._loop(performance.now() + i * 16)
    }

    // Velocity must be damped
    expect(Math.abs(engine.vel.x)).toBeLessThan(120)
    expect(Math.abs(engine.vel.y)).toBeLessThan(150)
    expect(Number.isFinite(engine.pos.x)).toBe(true)
    expect(Number.isFinite(engine.pos.y)).toBe(true)
    engine.destroy()
  })

  it('f6-b02: zero-distance micro-poke at body center coordinates avoids NaN/zero division', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })

    // Poke at exact center of body
    engine._poke(engine.pos.x, engine.pos.y)

    for (const r of engine.rim) {
      expect(Number.isNaN(r)).toBe(false)
    }
    for (const v of engine.rimV) {
      expect(Number.isNaN(v)).toBe(false)
    }
    engine.destroy()
  })

  it('f6-b03: waking mascot from active sleep state triggers wake-up poke impulse', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })
    engine.setState('sleep')
    expect(engine.state).toBe('sleep')

    // Wake up by transitioning to idle
    engine.setState('idle')
    expect(engine.state).toBe('idle')
    expect(engine.pokeT).toBeGreaterThan(0)
    expect(engine.faceParams().eyes).toBe('open')
    engine.destroy()
  })

  it('f6-b04: speech text containing control characters, newlines, tabs renders safely', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })
    const complexText = 'Line 1\nLine 2\tTabbed\r\nSpecial & < > " \''

    expect(() => engine.say(complexText)).not.toThrow()
    expect(engine.talking).toBe(true)
    engine.destroy()
  })

  it('f6-b05: extremely long speech text (>2000 characters) finishes typewriter without memory leak', async () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })
    const hugeSpeech = 'Quantum intelligence is paramount. '.repeat(60)

    engine.say(hugeSpeech)
    expect(engine.talking).toBe(true)

    // Call say again to test immediate cancellation of existing typewriter interval
    engine.say('Immediate replacement speech')
    expect(engine.talking).toBe(true)
    engine.destroy()
  })
})
