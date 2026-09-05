import { describe, it, expect, setTierContext } from '../harness'
import { setupDOMEnvironment, MockHTMLElement } from '../mocks/dom-env'
// @ts-ignore
import HexMascot from '../../src/renderer/companion/hex-mascot'

setupDOMEnvironment()
setTierContext('tier2', 'F3: BVA Mascot Search')

describe('Tier 2 — F3: Boundary & Corner Cases (Mascot Searching State)', () => {
  it('f3-b01: rapid state toggling (50 transitions in rapid loop) maintains state stability', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })
    const states = ['idle', 'searching', 'thinking', 'coding', 'working', 'done', 'error', 'sleep']

    for (let i = 0; i < 50; i++) {
      engine.setState(states[i % states.length])
    }

    expect(states.includes(engine.state)).toBe(true)
    engine.destroy()
  })

  it('f3-b02: zero or minimal canvas dimensions mount without mathematical breakdown or division by zero', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 1, h: 1 })
    expect(engine).toBeDefined()
    expect(() => engine._loop(performance.now())).not.toThrow()
    engine.destroy()
  })

  it('f3-b03: repeated setState("searching") while already searching is idempotent', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })
    engine.setState('searching')
    const t0 = engine.stateT0

    // Re-apply same state
    engine.setState('searching')
    expect(engine.state).toBe('searching')
    expect(engine.stateT0).toBe(t0)
    engine.destroy()
  })

  it('f3-b04: audio context suspended/unsupported handled without unhandled exception', () => {
    // Force AudioContext close/suspended state
    const originalAC = (globalThis as any).AudioContext
    ;(globalThis as any).AudioContext = class SuspendedAC {
      public state = 'suspended'
      createOscillator() { throw new Error('AudioContext suspended') }
      createGain() { throw new Error('AudioContext suspended') }
    }

    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })
    // sfxPing should catch and handle audio errors gracefully
    expect(() => engine.setState('searching')).not.toThrow()
    engine.destroy()

    ;(globalThis as any).AudioContext = originalAC
  })

  it('f3-b05: waking up from sleep directly into searching state clears droop and applies scan face', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })
    engine.setState('sleep')
    expect(engine.state).toBe('sleep')

    engine.setState('searching')
    expect(engine.state).toBe('searching')
    expect(engine.pokeT).toBeGreaterThan(0)
    // Conclude wake-up impulse
    engine.pokeT = 0
    const fp = engine.faceParams()
    expect(fp.eyes).toBe('scan')
    expect(fp.droop).toBeUndefined()
    engine.destroy()
  })
})
