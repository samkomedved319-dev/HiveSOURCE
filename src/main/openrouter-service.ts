import { ipcMain } from 'electron'
import { performWebSearch } from './search-service'

const API_KEY = process.env.OPENROUTER_API_KEY || ''
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Strictly free, verified high-performance OpenRouter AI models
export const FREE_MODELS = [
  'minimax/minimax-m3:free',
  'nvidia/nemotron-3.5-lightning:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'inclusionai/ling-3.0-flash-fin:free',
  'dots-studio/dots-3-note-preview:free',
  'liquid/lfm-2.5-2.6b:free',
]

export const DEFAULT_FREE_MODEL = FREE_MODELS[0]

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface SearchCitation {
  url: string
  title: string
  content?: string
  domain?: string
}

export interface ChatOptions {
  webSearch?: boolean
}

export async function queryAIModel(
  messages: ChatMessage[],
  modelChoice?: string,
  options?: ChatOptions
): Promise<{ ok: boolean; content?: string; error?: string; model?: string; citations?: SearchCitation[] }> {
  // Always restrict strictly to FREE models
  const requestedModel = modelChoice && modelChoice.includes(':free') ? modelChoice : DEFAULT_FREE_MODEL
  const modelsToTry = [requestedModel, ...FREE_MODELS.filter((m) => m !== requestedModel)]

  let activeMessages = [...messages]
  let fallbackCitations: SearchCitation[] | undefined = undefined

  // If webSearch is requested, check if we should prepare search fallback context
  let tryWebPlugin = !!options?.webSearch
  if (options?.webSearch) {
    const userQuery = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
    if (userQuery) {
      // Pre-fetch reliable fallback citations in parallel or for 402 recovery
      try {
        const fallbackRes = await performWebSearch(userQuery)
        if (fallbackRes.ok && fallbackRes.citations.length > 0) {
          fallbackCitations = fallbackRes.citations
        }
      } catch {}
    }
  }

  const requestBody: any = {
    messages: activeMessages,
    max_tokens: 1400,
    temperature: 0.65,
  }

  if (tryWebPlugin) {
    requestBody.plugins = [{ id: 'web', max_results: 5 }]
  }

  let lastError = ''
  for (const m of modelsToTry) {
    try {
      requestBody.model = m
      let res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'HTTP-Referer': 'https://hive.app',
          'X-Title': 'Hive Desktop',
        },
        body: JSON.stringify(requestBody),
      })

      // If OpenRouter rejects web plugin (e.g. 402 insufficient credits for plugin),
      // seamlessly retry using standard free model with injected fallback search context!
      if (!res.ok && res.status === 402 && tryWebPlugin && fallbackCitations && fallbackCitations.length > 0) {
        tryWebPlugin = false
        delete requestBody.plugins

        const contextSnippet = fallbackCitations
          .map((c, i) => `[Source ${i + 1}]: ${c.title} (${c.url})\n${c.content}`)
          .join('\n\n')

        const groundedMessages = [
          ...activeMessages.slice(0, -1),
          {
            role: 'system' as const,
            content: `[Verified Live Web Search Context]:\n${contextSnippet}\n\nSynthesize an informative, razor-sharp Grok-style answer answering the user's inquiry based on these verified facts.`,
          },
          activeMessages[activeMessages.length - 1],
        ]

        requestBody.messages = groundedMessages
        res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
            'HTTP-Referer': 'https://hive.app',
            'X-Title': 'Hive Desktop',
          },
          body: JSON.stringify(requestBody),
        })
      }

      if (res.ok) {
        const data = (await res.json()) as any
        const rawMsg = data.choices?.[0]?.message
        const content = rawMsg?.content
        if (content && content.trim().length > 0) {
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

          // Use parsed citations or fallback citations
          const finalCitations =
            citations.length > 0 ? citations : fallbackCitations && fallbackCitations.length > 0 ? fallbackCitations : undefined

          return {
            ok: true,
            content: content.trim(),
            citations: finalCitations,
            model: m,
          }
        }
      } else {
        const errText = await res.text()
        lastError = `[${m}] ${res.status}: ${errText}`
      }
    } catch (err: any) {
      lastError = err.message
    }
  }

  // If all OpenRouter models fail but we have fallback search citations, return the synthesized search summary!
  if (fallbackCitations && fallbackCitations.length > 0) {
    const summary = fallbackCitations.map((c) => `• **${c.title}**: ${c.content}`).join('\n\n')
    return {
      ok: true,
      content: `Here is what I found from live web retrieval:\n\n${summary}`,
      citations: fallbackCitations,
      model: 'web-search-fallback',
    }
  }

  return {
    ok: false,
    error: lastError || 'Free AI models are momentarily busy. Please retry in a few seconds.',
  }
}

export function registerOpenRouterHandlers() {
  ipcMain.handle(
    'ai:chat',
    async (_e, messages: ChatMessage[], model?: string, options?: ChatOptions) => {
      return queryAIModel(messages, model, options)
    }
  )

  ipcMain.handle('ai:models', async () => {
    return {
      ok: true,
      models: FREE_MODELS.map((id) => ({
        id,
        name: id.replace(':free', '').split('/')[1]?.toUpperCase() || id,
      })),
    }
  })
}
