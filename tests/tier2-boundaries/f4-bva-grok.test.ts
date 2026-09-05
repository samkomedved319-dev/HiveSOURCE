import { describe, it, expect, setTierContext } from '../harness'
import { grokPersonality } from '../../src/renderer/companion/grokPersonality'

setTierContext('tier2', 'F4: BVA Grok Personality')

describe('Tier 2 — F4: Boundary & Corner Cases (Grok Bot Personality)', () => {
  it('f4-b01: empty string passed to onQuery returns thinking commentary without throwing', () => {
    const com = grokPersonality.onQuery('')
    expect(com).toBeDefined()
    expect(com.state).toBe('thinking')
    expect(typeof com.speech).toBe('string')
    expect(com.speech.length).toBeGreaterThan(0)
  })

  it('f4-b02: emoji and unicode symbols handled cleanly in onQuery', () => {
    const com = grokPersonality.onQuery('🔍 🐝 🚀 search the quantum web')
    expect(com.state).toBe('searching')
    expect(com.face).toBe('cool')
    expect(com.speech.length).toBeGreaterThan(0)
  })

  it('f4-b03: extremely long query in onSearchStart is safely truncated with ellipsis', () => {
    const hugeQuery = 'massive query topic '.repeat(50)
    const com = grokPersonality.onSearchStart(hugeQuery)
    expect(com.state).toBe('searching')
    expect(com.speech.includes('...')).toBe(true)
    // Cleaned query should be truncated to ~28 chars
    expect(com.speech.length).toBeLessThan(hugeQuery.length)
  })

  it('f4-b04: repeated identical error messages to onError return valid error commentary with truncated preview', () => {
    const err = 'Fatal exception: Connection reset by peer in remote gateway cluster at 0xDEADBEEF'
    const com1 = grokPersonality.onError(err)
    const com2 = grokPersonality.onError(err)
    expect(com1.state).toBe('error')
    expect(com2.state).toBe('error')
    expect(com1.speech.length).toBeGreaterThan(10)
    expect(com2.speech.length).toBeGreaterThan(10)
  })

  it('f4-b05: onQuery handles null, undefined, or missing parameters safely', () => {
    // @ts-ignore
    const comNull = grokPersonality.onQuery(null)
    expect(comNull.state).toBe('thinking')
    // @ts-ignore
    const comUndef = grokPersonality.onQuery(undefined)
    expect(comUndef.state).toBe('thinking')
  })
})
