import { describe, it, expect, setTierContext } from '../harness'
import { setupDOMEnvironment, MockHTMLElement } from '../mocks/dom-env'
// @ts-ignore
import HexMascot from '../../src/renderer/companion/hex-mascot'

setupDOMEnvironment()
setTierContext('tier1', 'F6: Physics & Speech Flaps')

describe('Tier 1 — F6: Interactive Physics & Speech Flaps', () => {
  it('f6-01: softbody jelly rim contains 26 perimeter vertices', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })
    expect(engine.N).toBe(26)
    expect(Array.isArray(engine.rim)).toBe(true)
    expect(engine.rim.length).toBe(26)
    engine.destroy()
  })

  it('f6-02: _poke(x, y) applies radial velocity impulse to softbody rim vertices', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })

    engine._poke(engine.pos.x, engine.pos.y)

    expect(engine.pokeT).toBeGreaterThan(0)
    expect(Array.isArray(engine.rimV)).toBe(true)
    expect(engine.rimV.some((v: number) => v !== 0)).toBe(true)
    engine.destroy()
  })

  it('f6-03: petting interaction activates happy arc eyes and maximum blush overlay', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })
    engine.pokeT = 0
    engine.pet = 0.8 // pet > 0.35 threshold

    const fp = engine.faceParams()
    expect(fp.eyes).toBe('arc')
    expect(fp.blush).toBe(1)
    engine.destroy()
  })

  it('f6-04: softbody spring integration conserves numerical stability under _loop()', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })

    // Simulate velocity displacement
    engine.vel.x = 2.5
    engine.vel.y = -3.0

    // Step physics forward 10 cycles
    for (let i = 0; i < 10; i++) {
      engine._loop(performance.now() + i * 16)
    }

    expect(Number.isFinite(engine.pos.x)).toBe(true)
    expect(Number.isFinite(engine.pos.y)).toBe(true)
    expect(Number.isFinite(engine.vel.x)).toBe(true)
    expect(Number.isFinite(engine.vel.y)).toBe(true)
    for (const r of engine.rim) {
      expect(Number.isFinite(r)).toBe(true)
    }
    engine.destroy()
  })

  it('f6-05: typewriter speech bubble animates and concludes with bubble placement', async () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })
    engine.say('Hive AI')

    expect(engine.talking).toBe(true)
    expect(engine.btext).toBeDefined()

    // Wait for typewriter progression
    await new Promise((r) => setTimeout(r, 120))
    expect(engine.btext.textContent.length).toBeGreaterThan(0)
    engine.destroy()
  })
})
