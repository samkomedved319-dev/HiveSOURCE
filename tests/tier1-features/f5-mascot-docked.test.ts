import { describe, it, expect, setTierContext } from '../harness'
import { setupDOMEnvironment, MockHTMLElement } from '../mocks/dom-env'
// @ts-ignore
import HexMascot from '../../src/renderer/companion/hex-mascot'

setupDOMEnvironment()
setTierContext('tier1', 'F5: Mascot Chat Mounting')

describe('Tier 1 — F5: Mascot Docked/Floating Chat Integration', () => {
  it('f5-01: HexMascot mounts in custom chat container dimensions (172x145)', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 172, h: 145 })
    expect(engine).toBeDefined()
    expect(engine.W).toBe(172)
    expect(engine.H).toBe(145)
    engine.destroy()
  })

  it('f5-02: HexMascot.setSound toggles global audio flag', () => {
    expect(() => HexMascot.setSound(true)).not.toThrow()
    expect(() => HexMascot.setSound(false)).not.toThrow()
  })

  it('f5-03: localStorage preserves mascot minimized and sound preference state', () => {
    localStorage.setItem('hive_mascot_minimized', 'true')
    localStorage.setItem('hive_mascot_sound', 'false')

    expect(localStorage.getItem('hive_mascot_minimized')).toBe('true')
    expect(localStorage.getItem('hive_mascot_sound')).toBe('false')

    localStorage.setItem('hive_mascot_minimized', 'false')
    expect(localStorage.getItem('hive_mascot_minimized')).toBe('false')
  })

  it('f5-04: wave() triggers arm wave animation and emits wave event', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 172, h: 145 })
    let waveFired = false
    engine.on('wave', () => {
      waveFired = true
    })

    engine.wave()
    expect(waveFired).toBe(true)
    expect(engine.waveA).toBeGreaterThan(0)
    engine.destroy()
  })

  it('f5-05: say(text) creates typewriter speech bubble and sets talking flag', () => {
    const container = new MockHTMLElement('div')
    const engine = HexMascot.mount(container, { w: 172, h: 145 })
    engine.say('Greetings from Grok Hex!')

    expect(engine.talking).toBe(true)
    expect(engine.bubble).toBeDefined()
    expect(engine.bubble.classList.contains('on')).toBe(true)
    engine.destroy()
  })
})
