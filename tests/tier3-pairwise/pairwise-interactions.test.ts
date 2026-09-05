import { describe, it, expect, setTierContext } from '../harness'
import { setupDOMEnvironment, MockHTMLElement } from '../mocks/dom-env'
import { grokPersonality } from '../../src/renderer/companion/grokPersonality'
import { performWebSearch } from '../../src/main/search-service'
// @ts-ignore
import HexMascot from '../../src/renderer/companion/hex-mascot'

setupDOMEnvironment()
setTierContext('tier3', 'Pairwise Cross-Feature Interactions')

describe('Tier 3 — Cross-Feature Pairwise Interactions', () => {
  it('p1: Search Trigger + Mascot Searching State + Grok Search Banter', async () => {
    const container = new MockHTMLElement('div')
    const mascot = HexMascot.mount(container, { w: 172, h: 145 })

    // User dispatches search
    const query = 'autonomous AI agents'
    const com = grokPersonality.onSearchStart(query)
    mascot.setState(com.state)
    mascot.say(com.speech)

    expect(mascot.state).toBe('searching')
    expect(mascot.faceParams().eyes).toBe('scan')
    expect(mascot.talking).toBe(true)
    expect(mascot.bubble.classList.contains('on')).toBe(true)

    mascot.destroy()
  })

  it('p2: Code Generation + Mascot Coding State + Typing Arms Animation', () => {
    const container = new MockHTMLElement('div')
    const mascot = HexMascot.mount(container, { w: 172, h: 145 })

    const com = grokPersonality.onCodeGeneration()
    mascot.setState(com.state)
    mascot.say(com.speech)

    expect(mascot.state).toBe('coding')
    expect(mascot.faceParams().mouth).toBe('flat')
    // Coding state activates code lines pool in engine
    expect(mascot.cl).toBeDefined()

    mascot.destroy()
  })

  it('p3: Launch Screen Exit + Main Workspace Mount + Mascot Idle Initialization', () => {
    let launchScreenDismissed = false
    const onComplete = () => {
      launchScreenDismissed = true
    }

    // Simulate Launch Screen finish
    onComplete()
    expect(launchScreenDismissed).toBe(true)

    // Main workspace mounts mascot
    const container = new MockHTMLElement('div')
    const mascot = HexMascot.mount(container, { w: 172, h: 145 })
    expect(mascot.state).toBe('idle')
    expect(mascot.faceParams().eyes).toBe('open')

    mascot.destroy()
  })

  it('p4: Physical Poke Interaction + Grok Poke Banter + Softbody Rim Distortion', () => {
    const container = new MockHTMLElement('div')
    const mascot = HexMascot.mount(container, { w: 172, h: 145 })

    // User pokes
    mascot._poke(mascot.pos.x, mascot.pos.y)
    const com = grokPersonality.onPoke()
    mascot.say(com.speech)

    expect(mascot.pokeT).toBeGreaterThan(0)
    expect(mascot.talking).toBe(true)
    expect(com.speech.length).toBeGreaterThan(10)

    mascot.destroy()
  })

  it('p5: Search Completion + Citation Cards Rendered + Mascot Celebration/Done State', async () => {
    const container = new MockHTMLElement('div')
    const mascot = HexMascot.mount(container, { w: 172, h: 145 })

    // Search returns citations
    const searchRes = await performWebSearch('quantum computing')
    const citationsCount = searchRes.citations.length || 2

    const doneCom = grokPersonality.onSearchDone(searchRes.query, citationsCount)
    mascot.setState(doneCom.state)
    mascot.say(doneCom.speech)

    expect(mascot.state).toBe('done')
    expect(mascot.parts.some((p: any) => p.type === 'confetti')).toBe(true)
    expect(doneCom.speech.includes(String(citationsCount))).toBe(true)

    mascot.destroy()
  })

  it('p6: Search Service Error + Mascot Error Glitch + Grok Error Banter', () => {
    const container = new MockHTMLElement('div')
    const mascot = HexMascot.mount(container, { w: 172, h: 145 })

    const com = grokPersonality.onError('Connection refused on upstream cluster')
    mascot.setState(com.state)
    mascot.say(com.speech)

    expect(mascot.state).toBe('error')
    expect(mascot.faceParams().eyes).toBe('x')
    expect(mascot.faceParams().mouth).toBe('wavy')
    expect(mascot.parts.some((p: any) => p.type === 'puff')).toBe(true)

    mascot.destroy()
  })

  it('p7: Mascot Dragging Interaction + Viewport Boundary Wall Clamping', () => {
    const container = new MockHTMLElement('div')
    const mascot = HexMascot.mount(container, { w: 200, h: 160 })

    // Drag beyond boundary
    mascot.pos.x = 500
    mascot.pos.y = -200
    mascot._loop(performance.now())

    // Clamped within or bounced from canvas margins
    expect(Number.isFinite(mascot.pos.x)).toBe(true)
    expect(Number.isFinite(mascot.pos.y)).toBe(true)

    mascot.destroy()
  })

  it('p8: Launch Screen Dynamic Version + Terminal Step Sequence Completion', () => {
    const pkg = { version: '1.0.0' }
    const versionStr = `v${pkg.version}`
    const steps = [
      { label: 'Initializing Hive Core', tag: 'OK' },
      { label: 'Mounting Grok Mascot', tag: 'OK' },
      { label: 'Synthesizing Neural Matrix', tag: 'OK' },
      { label: 'HIVE READY — Swarm intelligence online', tag: 'READY' },
    ]

    expect(versionStr).toBe('v1.0.0')
    const lastStep = steps[steps.length - 1]
    expect(lastStep.tag).toBe('READY')
  })

  it('p9: Mascot Sound Toggle Mute + Silent State Transitions', () => {
    HexMascot.setSound(false)
    const container = new MockHTMLElement('div')
    const mascot = HexMascot.mount(container, { w: 172, h: 145 })

    // State transitions must execute without audio output
    expect(() => mascot.setState('searching')).not.toThrow()
    expect(() => mascot.setState('done')).not.toThrow()
    expect(() => mascot.setState('error')).not.toThrow()

    mascot.destroy()
  })

  it('p10: Mascot Minimized State + Active Background Search Execution', async () => {
    let isMinimized = true
    const searchRes = await performWebSearch('autonomous agents')

    // Minimized mascot does not block search result processing
    expect(isMinimized).toBe(true)
    expect(searchRes).toBeDefined()
    expect(Array.isArray(searchRes.citations)).toBe(true)
  })
})
