import { describe, it, expect, setTierContext } from '../harness'
import { grokPersonality, GrokPersonalityEngine, GrokCommentary } from '../../src/renderer/companion/grokPersonality'

setTierContext('tier1', 'F4: Grok Bot Personality')

describe('Tier 1 — F4: Grok Bot Personality & Banter Engine', () => {
  it('f4-01: grokPersonality implements all required GrokPersonalityEngine methods', () => {
    expect(typeof grokPersonality.onQuery).toBe('function')
    expect(typeof grokPersonality.onSearchStart).toBe('function')
    expect(typeof grokPersonality.onSearchDone).toBe('function')
    expect(typeof grokPersonality.onCodeGeneration).toBe('function')
    expect(typeof grokPersonality.onDone).toBe('function')
    expect(typeof grokPersonality.onError).toBe('function')
    expect(typeof grokPersonality.onPoke).toBe('function')
    expect(typeof grokPersonality.onPet).toBe('function')
    expect(typeof grokPersonality.onWave).toBe('function')
  })

  it('f4-02: onQuery identifies search intent and returns searching commentary with radar state', () => {
    const com = grokPersonality.onQuery('search quantum computing')
    expect(com.state).toBe('searching')
    expect(com.face).toBe('cool')
    expect(com.speech.length).toBeGreaterThan(15)
    expect(com.speech.includes('quantum computing')).toBe(true)
  })

  it('f4-03: onSearchDone acknowledges citation count with excited victory face', () => {
    const com = grokPersonality.onSearchDone('artificial neural networks', 4)
    expect(com.state).toBe('done')
    expect(com.face).toBe('excited')
    expect(com.speech.includes('4')).toBe(true)
  })

  it('f4-04: onCodeGeneration returns coding state with compiler banter and wink face', () => {
    const com = grokPersonality.onCodeGeneration()
    expect(com.state).toBe('coding')
    expect(com.face).toBe('wink')
    expect(com.speech.length).toBeGreaterThan(15)
  })

  it('f4-05: onError returns error state with sad face and graceful witty explanation', () => {
    const com = grokPersonality.onError('Network connection timeout')
    expect(com.state).toBe('error')
    expect(com.face).toBe('sad')
    expect(com.speech.length).toBeGreaterThan(15)
    expect(com.speech.includes('timeout')).toBe(true)
  })
})
