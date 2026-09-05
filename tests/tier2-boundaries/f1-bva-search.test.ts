import { describe, it, expect, setTierContext } from '../harness'
import { performWebSearch } from '../../src/main/search-service'
import { setupDOMEnvironment } from '../mocks/dom-env'

setupDOMEnvironment()
setTierContext('tier2', 'F1: BVA Search Backend')

describe('Tier 2 — F1: Boundary & Corner Cases (Web Search)', () => {
  it('f1-b01: empty query returns ok:false with informative error message', async () => {
    const resEmpty = await performWebSearch('')
    expect(resEmpty.ok).toBe(false)
    expect(resEmpty.citations.length).toBe(0)
    expect(resEmpty.error).toBe('Query cannot be empty.')

    const resWhitespace = await performWebSearch('   \t\n  ')
    expect(resWhitespace.ok).toBe(false)
    expect(resWhitespace.citations.length).toBe(0)
  })

  it('f1-b02: ultra-long query (2500+ characters) is handled without crashing or buffer overflow', async () => {
    const longQuery = 'quantum computing '.repeat(150)
    expect(longQuery.length).toBeGreaterThan(2500)
    const result = await performWebSearch(longQuery)
    expect(result).toBeDefined()
    expect(typeof result.ok).toBe('boolean')
    expect(Array.isArray(result.citations)).toBe(true)
  })

  it('f1-b03: special characters (SQL injection, regex symbols, HTML tags, unicode) execute safely', async () => {
    const adversarialQuery = "'; DROP TABLE users; -- <script>alert('xss')</script> [a-z]+ 🚀🐝"
    const result = await performWebSearch(adversarialQuery)
    expect(result).toBeDefined()
    expect(result.query).toBe(adversarialQuery)
    expect(Array.isArray(result.citations)).toBe(true)
  })

  it('f1-b04: query with zero web matches across all engines returns clean failure contract', async () => {
    const nonsenseQuery = 'xyzzy_nonexistent_gibberish_string_9876543210_quantum'
    const result = await performWebSearch(nonsenseQuery)
    expect(result).toBeDefined()
    expect(Array.isArray(result.citations)).toBe(true)
    if (!result.ok) {
      expect(result.error).toBeDefined()
    }
  })

  it('f1-b05: null/undefined query input coerced safely without throwing unhandled exceptions', async () => {
    // @ts-ignore
    const resNull = await performWebSearch(null)
    expect(resNull.ok).toBe(false)
    // @ts-ignore
    const resUndefined = await performWebSearch(undefined)
    expect(resUndefined.ok).toBe(false)
  })
})
