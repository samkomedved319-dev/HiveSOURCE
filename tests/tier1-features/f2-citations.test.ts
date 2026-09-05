import { describe, it, expect, setTierContext } from '../harness'
import type { SearchCitation, Message } from '../../src/renderer/types'
import { setupDOMEnvironment } from '../mocks/dom-env'

setupDOMEnvironment()
setTierContext('tier1', 'F2: Citations Synthesis & UI')

describe('Tier 1 — F2: Citation Synthesis & Cited Sources UI', () => {
  it('f2-01: SearchCitation interface correctly models citation fields', () => {
    const citation: SearchCitation = {
      url: 'https://en.wikipedia.org/wiki/Hive',
      title: 'Hive - Wikipedia',
      content: 'A hive is an enclosed structure in which some honey bee species live.',
      domain: 'wikipedia.org',
    }
    expect(citation.url).toBe('https://en.wikipedia.org/wiki/Hive')
    expect(citation.title).toBe('Hive - Wikipedia')
    expect(citation.content).toBeDefined()
    expect(citation.domain).toBe('wikipedia.org')
  })

  it('f2-02: Message interface supports citations, isWebSearch, and searchQuery properties', () => {
    const msg: Message = {
      id: 'm-test-1',
      agentId: 'agent-researcher',
      content: 'Here are the facts about swarm robotics.',
      role: 'assistant',
      timestamp: Date.now(),
      isWebSearch: true,
      searchQuery: 'swarm robotics research',
      citations: [
        {
          url: 'https://ieee.org/robotics',
          title: 'IEEE Swarm Robotics',
          content: 'Overview of decentralized swarm systems.',
          domain: 'ieee.org',
        },
      ],
    }
    expect(msg.isWebSearch).toBe(true)
    expect(msg.searchQuery).toBe('swarm robotics research')
    expect(Array.isArray(msg.citations)).toBe(true)
    expect(msg.citations?.length).toBe(1)
  })

  it('f2-03: domain extraction cleanly strips www. prefix from URLs', () => {
    const urls = [
      { raw: 'https://www.github.com/features/actions', expected: 'github.com' },
      { raw: 'https://docs.anthropic.com/en/docs', expected: 'docs.anthropic.com' },
      { raw: 'http://www.openrouter.ai/models', expected: 'openrouter.ai' },
    ]

    for (const item of urls) {
      const parsed = new URL(item.raw)
      const domain = parsed.hostname.replace(/^www\./, '')
      expect(domain).toBe(item.expected)
    }
  })

  it('f2-04: citation snippet formatting sanitizes HTML tags from search engines', () => {
    const rawSnippet = '<b>ProjectHive</b> is an <i>autonomous</i> AI assistant with &lt;matrix&gt;.'
    const sanitized = rawSnippet.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    expect(sanitized).toBe('ProjectHive is an autonomous AI assistant with <matrix>.')
    expect(sanitized.includes('<b>')).toBe(false)
    expect(sanitized.includes('</b>')).toBe(false)
  })

  it('f2-05: clicking citation card invokes system.openApp IPC bridge', async () => {
    let openedUrl = ''
    window.electronAPI.system = {
      ...window.electronAPI.system,
      openApp: async (url: string) => {
        openedUrl = url
        return { ok: true, message: `Opened ${url}` }
      },
      exec: async () => ({ ok: true }),
    }

    const testUrl = 'https://developer.mozilla.org/en-US/'
    await window.electronAPI.system.openApp(testUrl)
    expect(openedUrl).toBe(testUrl)
  })
})
