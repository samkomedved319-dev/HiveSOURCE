import { ipcMain } from 'electron'

export interface SearchCitation {
  url: string
  title: string
  content?: string
  domain?: string
}

export interface SearchResult {
  ok: boolean
  query: string
  content: string
  citations: SearchCitation[]
  provider?: string
  error?: string
}

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const SEARCH_MODEL = 'minimax/minimax-m3:free'

/**
 * Perform OpenRouter Web Plugin search
 */
async function searchViaOpenRouter(query: string): Promise<SearchResult | null> {
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer': 'https://hive.app',
        'X-Title': 'Hive Desktop Search',
      },
      body: JSON.stringify({
        model: SEARCH_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are the Hive real-time Web Search engine. Perform live search and synthesize an accurate, concise, informative summary answering the query. Rely strictly on verified search findings.',
          },
          {
            role: 'user',
            content: `Perform live web search for: ${query}`,
          },
        ],
        max_tokens: 1200,
        temperature: 0.3,
        plugins: [{ id: 'web', max_results: 5 }],
      }),
    })

    if (!res.ok) return null

    const data = (await res.json()) as any
    const rawMsg = data.choices?.[0]?.message
    const content = rawMsg?.content?.trim()
    if (!content) return null

    const rawAnns = rawMsg.annotations || []
    const citations: SearchCitation[] = []

    for (const ann of rawAnns) {
      if (ann.type === 'url_citation' && ann.url_citation) {
        const u = ann.url_citation.url || ''
        let domain = ''
        try {
          domain = new URL(u).hostname.replace(/^www\./, '')
        } catch {
          domain = 'web'
        }
        citations.push({
          url: u,
          title: ann.url_citation.title || domain || 'Source',
          content: ann.url_citation.content || '',
          domain,
        })
      }
    }

    return {
      ok: true,
      query,
      content,
      citations,
      provider: 'openrouter-web',
    }
  } catch {
    return null
  }
}

/**
 * Fallback search via DuckDuckGo Instant Answer and HTML scraping
 */
async function searchViaDuckDuckGo(query: string): Promise<SearchResult | null> {
  const citations: SearchCitation[] = []
  let combinedSummary = ''

  // 1. Instant Answer API
  try {
    const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    const apiRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })

    if (apiRes.ok) {
      const data = (await apiRes.json()) as any
      if (data.AbstractText) {
        combinedSummary += `${data.AbstractText}\n\n`
        if (data.AbstractURL) {
          try {
            const domain = new URL(data.AbstractURL).hostname.replace(/^www\./, '')
            citations.push({
              url: data.AbstractURL,
              title: data.Heading || data.AbstractSource || domain,
              content: data.AbstractText,
              domain,
            })
          } catch {}
        }
      }

      // Related topics
      if (Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, 4)) {
          if (topic.Text && topic.FirstURL) {
            try {
              const domain = new URL(topic.FirstURL).hostname.replace(/^www\./, '')
              citations.push({
                url: topic.FirstURL,
                title: topic.Text.split(' - ')[0] || domain,
                content: topic.Text,
                domain,
              })
            } catch {}
          }
        }
      }
    }
  } catch {}

  // 2. DuckDuckGo HTML scraping if citations are sparse
  if (citations.length < 2) {
    try {
      const htmlUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
      const htmlRes = await fetch(htmlUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
      })

      if (htmlRes.ok) {
        const html = await htmlRes.text()
        // Regex extract result links and snippets
        const resultRegex = /<a class="result__url" href="([^"]+)">(?:[\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g
        let match: RegExpExecArray | null
        let count = 0

        while ((match = resultRegex.exec(html)) !== null && count < 4) {
          count++
          let rawUrl = match[1].trim()
          // Unwrap duckduckgo redirect URL /l/?uddg=
          if (rawUrl.includes('uddg=')) {
            const uddgMatch = rawUrl.match(/uddg=([^&]+)/)
            if (uddgMatch) {
              rawUrl = decodeURIComponent(uddgMatch[1])
            }
          }
          if (!rawUrl.startsWith('http')) {
            rawUrl = 'https://' + rawUrl
          }

          const snippet = match[2].replace(/<[^>]+>/g, '').trim()
          try {
            const domain = new URL(rawUrl).hostname.replace(/^www\./, '')
            citations.push({
              url: rawUrl,
              title: `${domain}: ${snippet.slice(0, 60)}...`,
              content: snippet,
              domain,
            })
            if (!combinedSummary) {
              combinedSummary += `${snippet}\n`
            }
          } catch {}
        }
      }
    } catch {}
  }

  if (citations.length > 0) {
    return {
      ok: true,
      query,
      content:
        combinedSummary.trim() ||
        `Retrieved ${citations.length} verified web sources for "${query}".`,
      citations,
      provider: 'duckduckgo',
    }
  }

  return null
}

/**
 * Fallback search via Wikipedia API
 */
async function searchViaWikipedia(query: string): Promise<SearchResult | null> {
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`
    const res = await fetch(wikiUrl, {
      headers: { 'User-Agent': 'HiveDesktop/1.0 (https://hive.app; info@hive.app)' },
    })

    if (!res.ok) return null

    const data = (await res.json()) as any
    const searchItems = data.query?.search
    if (!Array.isArray(searchItems) || searchItems.length === 0) return null

    const citations: SearchCitation[] = []
    let summary = ''

    for (const item of searchItems.slice(0, 4)) {
      const pageTitle = item.title
      const cleanSnippet = (item.snippet || '').replace(/<[^>]+>/g, '')
      const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`

      citations.push({
        url: pageUrl,
        title: pageTitle,
        content: cleanSnippet,
        domain: 'wikipedia.org',
      })

      if (!summary) {
        summary = `According to Wikipedia: ${cleanSnippet}`
      }
    }

    return {
      ok: true,
      query,
      content: summary || `Wikipedia entries found for "${query}".`,
      citations,
      provider: 'wikipedia',
    }
  } catch {
    return null
  }
}

/**
 * Main Web Search Dispatcher:
 * 1. OpenRouter Web Plugin (highest quality synthesis)
 * 2. DuckDuckGo Instant Answer / HTML Scraping fallback
 * 3. Wikipedia API fallback
 */
export async function performWebSearch(query: string): Promise<SearchResult> {
  const trimmed = (query || '').trim()
  if (!trimmed) {
    return {
      ok: false,
      query: '',
      content: 'Empty search query provided.',
      citations: [],
      error: 'Query cannot be empty.',
    }
  }

  // 1. Primary: OpenRouter Web Plugin
  const openRouterResult = await searchViaOpenRouter(trimmed)
  if (openRouterResult && openRouterResult.ok && openRouterResult.content) {
    return openRouterResult
  }

  // 2. Secondary: DuckDuckGo
  const ddgResult = await searchViaDuckDuckGo(trimmed)
  if (ddgResult && ddgResult.ok && ddgResult.citations.length > 0) {
    return ddgResult
  }

  // 3. Tertiary: Wikipedia
  const wikiResult = await searchViaWikipedia(trimmed)
  if (wikiResult && wikiResult.ok && wikiResult.citations.length > 0) {
    return wikiResult
  }

  return {
    ok: false,
    query: trimmed,
    content: `No web results found for "${trimmed}".`,
    citations: [],
    error: 'All search providers exhausted.',
  }
}

/**
 * Register Electron IPC Handler
 */
export function registerSearchHandlers() {
  ipcMain.handle('search:query', async (_e, query: string) => {
    return performWebSearch(query)
  })
}
