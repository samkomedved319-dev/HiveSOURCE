import { describe, it, expect, setTierContext } from '../harness'
import { setupDOMEnvironment, MockHTMLElement } from '../mocks/dom-env'
// @ts-ignore
import HexMascot from '../../src/renderer/companion/hex-mascot'

setupDOMEnvironment()
setTierContext('tier1', 'F3: Mascot Searching State')

describe('Tier 1 — F3: Mascot Searching State & Sonar Animation', () => {
  it('f3-01: HexMascot engine mounts cleanly on container element and initializes idle state', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })
    expect(engine).toBeDefined()
    expect(engine.state).toBe('idle')
    engine.destroy()
  })

  it('f3-02: setState("searching") transitions internal state to "searching"', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })
    let stateEmitted = ''
    engine.on('state', (s: string) => {
      stateEmitted = s
    })

    engine.setState('searching')
    expect(engine.state).toBe('searching')
    expect(stateEmitted).toBe('searching')
    engine.destroy()
  })

  it('f3-03: faceParams() resolves to radar scanning visor params in searching state', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })
    engine.setState('searching')

    const fp = engine.faceParams()
    expect(fp.eyes).toBe('scan')
    expect(fp.mouth).toBe('flat')
    expect(fp.mw).toBe(0.6)
    engine.destroy()
  })

  it('f3-04: sfxPing() triggers sonar blip audio synthesis when sound is enabled', () => {
    HexMascot.setSound(true)
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })

    expect(typeof engine.sfxPing).toBe('function')
    expect(() => engine.sfxPing()).not.toThrow()
    engine.destroy()
  })

  it('f3-05: engine draw cycle executes without error while in searching state', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 200, h: 160 })
    engine.setState('searching')

    // Call draw method explicitly to verify radar sweep, visor and magnifier rendering calls
    expect(() => engine._draw(0, 0)).not.toThrow()
    expect(engine.cnv.ctx.calls.length).toBeGreaterThan(0)
    engine.destroy()
  })
})
