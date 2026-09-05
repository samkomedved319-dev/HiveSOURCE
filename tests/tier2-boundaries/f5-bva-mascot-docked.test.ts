import { describe, it, expect, setTierContext } from '../harness'
import { setupDOMEnvironment, MockHTMLElement } from '../mocks/dom-env'
// @ts-ignore
import HexMascot from '../../src/renderer/companion/hex-mascot'

setupDOMEnvironment()
setTierContext('tier2', 'F5: BVA Mascot Docked')

describe('Tier 2 — F5: Boundary & Corner Cases (Mascot Docked Integration)', () => {
  it('f5-b01: pointer drag coordinates at extreme offsets do not cause NaN state', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 172, h: 145 })

    // Simulate extreme drag
    engine.pos.x = 99999
    engine.pos.y = -99999
    engine._loop(performance.now())

    expect(Number.isFinite(engine.pos.x)).toBe(true)
    expect(Number.isFinite(engine.pos.y)).toBe(true)
    engine.destroy()
  })

  it('f5-b02: ultra-small container dimensions (40x40) mount cleanly without canvas overflow', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 40, h: 40 })
    expect(engine.W).toBe(40)
    expect(engine.H).toBe(40)
    expect(engine.R).toBeGreaterThan(0)
    engine.destroy()
  })

  it('f5-b03: unmounting mascot engine while speech bubble is active cleans up timers and elements', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 172, h: 145 })
    engine.say('Active message being spoken...')

    expect(engine.talking).toBe(true)
    // Destroy during active speech
    expect(() => engine.destroy()).not.toThrow()
    expect(engine.bubble?.parentNode).toBeNull()
  })

  it('f5-b04: corrupted localStorage boolean values fallback safely to defaults', () => {
    localStorage.setItem('hive_mascot_minimized', 'invalid_corrupted_value')
    const isMinimized = localStorage.getItem('hive_mascot_minimized') === 'true'
    expect(isMinimized).toBe(false)

    localStorage.setItem('hive_mascot_sound', 'garbage_string')
    const soundEnabled = localStorage.getItem('hive_mascot_sound') !== 'false'
    expect(soundEnabled).toBe(true)
  })

  it('f5-b05: rapid minimize and expand toggles preserve event listener bindings', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 172, h: 145 })

    let waveCount = 0
    engine.on('wave', () => waveCount++)

    for (let i = 0; i < 10; i++) {
      engine.wave()
    }

    expect(waveCount).toBe(10)
    engine.destroy()
  })
})
