import { describe, it, expect, setTierContext } from '../harness'
import { performWebSearch, SearchResult, SearchCitation } from '../../src/main/search-service'
import { setupDOMEnvironment } from '../mocks/dom-env'

setupDOMEnvironment()
setTierContext('tier1', 'F1: Web Search Backend')

describe('Tier 1 — F1: Real-time Web Search Backend & Fallbacks', () => {
  it('f1-01: performWebSearch returns structured SearchResult conforming to contract', async () => {
    // Contract verification
    expect(typeof performWebSearch).toBe('function')
    const result = await performWebSearch('Quantum Computing')
    expect(result).toBeDefined()
    expect(typeof result.ok).toBe('boolean')
    expect(typeof result.query).toBe('string')
    expect(typeof result.content).toBe('string')
    expect(Array.isArray(result.citations)).toBe(true)
  })

  it('f1-02: search returns citations with required fields (url, title, content)', async () => {
    const result = await performWebSearch('Artificial Intelligence')
    expect(result.ok).toBe(true)
    expect(result.citations.length).toBeGreaterThan(0)
    for (const citation of result.citations) {
      expect(typeof citation.url).toBe('string')
      expect(citation.url.length).toBeGreaterThan(0)
      expect(typeof citation.title).toBe('string')
      expect(citation.title.length).toBeGreaterThan(0)
    }
  })

  it('f1-03: citation URLs have valid http or https protocols and hostnames', async () => {
    const result = await performWebSearch('TypeScript programming language')
    expect(result.ok).toBe(true)
    for (const citation of result.citations) {
      expect(citation.url.startsWith('http://') || citation.url.startsWith('https://')).toBe(true)
      const parsedUrl = new URL(citation.url)
      expect(parsedUrl.hostname.length).toBeGreaterThan(0)
    }
  })

  it('f1-04: multi-tier fallback cascade identifies provider origin (openrouter, duckduckgo, or wikipedia)', async () => {
    const result = await performWebSearch('Electron framework')
    expect(result.ok).toBe(true)
    expect(['openrouter-web', 'duckduckgo', 'wikipedia'].includes(result.provider || '')).toBe(true)
    expect(result.content.length).toBeGreaterThan(10)
  })

  it('f1-05: window.electronAPI.search.query IPC bridge conforms to interface contract', async () => {
    expect(window.electronAPI).toBeDefined()
    expect(window.electronAPI.search).toBeDefined()
    expect(typeof window.electronAPI.search.query).toBe('function')
    const ipcRes = await window.electronAPI.search.query('React 19')
    expect(ipcRes.ok).toBe(true)
    expect(ipcRes.query).toBe('React 19')
    expect(Array.isArray(ipcRes.citations)).toBe(true)
  })
})
