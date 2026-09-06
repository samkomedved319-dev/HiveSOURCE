import { ipcMain } from 'electron'
import { performWebSearch } from './search-service'
import { openRouterKey, nvidiaNimKey, isHiveFreeKey, openRouterBase } from './keys'
import { recallForPrompt, rememberTurn } from './mem0-service'
import {
  HIVE_FREE_KEY,
  TOKENROUTER_BASES,
  HIVE_FREE_MODELS,
  FREE_GLM,
  assertFreeQuota,
  consumeFreeQuota,
  estimateTokens,
} from './hive-free'

export const FREE_MODELS = HIVE_FREE_MODELS
export const DEFAULT_FREE_MODEL = FREE_GLM

export const NIM_MODELS = [
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'nvidia/llama-3.1-nemotron-nano-8b-v1',
  'meta/llama-3.1-8b-instruct',
  'google/gemma-2-9b-it',
]

function isExhausted(status: number, body: string) {
  if ([401, 402, 403, 429, 503].includes(status)) return true
  const t = body.toLowerCase()
  return t.includes('rate') || t.includes('quota') || t.includes('credit') || t.includes('insufficient') || t.includes('used up') || t.includes('limit')
}

async function queryNim(
  messages: ChatMessage[]
): Promise<{ ok: boolean; content?: string; error?: string; model?: string }> {
  const key = nvidiaNimKey()
  if (!key) return { ok: false, error: 'NVIDIA NIM key missing' }
  let last = ''
  for (const model of NIM_MODELS) {
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ model, messages, max_tokens: 1200, temperature: 0.6 }),
      })
      if (res.ok) {
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
        const content = data?.choices?.[0]?.message?.content
        if (content?.trim()) return { ok: true, content: content.trim(), model: `nim:${model}` }
      } else {
        last = `[nim ${model}] ${res.status}: ${(await res.text()).slice(0, 200)}`
        if (!isExhausted(res.status, last)) continue
      }
    } catch (e: any) {
      last = e.message
    }
  }
  return { ok: false, error: last || 'NVIDIA NIM exhausted' }
}

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
  const API_KEY = openRouterKey()
  const nimKey = nvidiaNimKey()
  const usingFree = isHiveFreeKey()
  if (!API_KEY && !nimKey) {
    return {
      ok: false,
      error:
        'Hive Free is not ready. Restart the app, or paste your own key in Settings → Models.',
    }
  }

  if (usingFree) {
    const est = estimateTokens(JSON.stringify(messages)) + 400
    const gate = assertFreeQuota(est)
    if (!gate.ok) return { ok: false, error: gate.error }
  }

  if (!API_KEY && nimKey) {
    const nim = await queryNim(messages)
    if (nim.ok && nim.content) {
      const userQ = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
      void rememberTurn(userQ, nim.content)
    }
    return nim
  }

  // Hive Free: GLM 5.3 + Nemotron Nano Reasoning (TokenRouter)
  const requestedModel = modelChoice && FREE_MODELS.includes(modelChoice) ? modelChoice : DEFAULT_FREE_MODEL
  const modelsToTry = [requestedModel, ...FREE_MODELS.filter((m) => m !== requestedModel)]

  const chatUrls: string[] = []
  const seen = new Set<string>()
  const pushUrl = (u: string) => {
    if (!seen.has(u)) {
      seen.add(u)
      chatUrls.push(u)
    }
  }
  if (usingFree || API_KEY === HIVE_FREE_KEY) {
    for (const b of TOKENROUTER_BASES) pushUrl(`${b}/chat/completions`)
  }
  pushUrl(`${openRouterBase()}/chat/completions`)
  pushUrl('https://openrouter.ai/api/v1/chat/completions')

  let activeMessages = [...messages]
  const recalled = await recallForPrompt(
    [...messages].reverse().find((m) => m.role === 'user')?.content || 'preferences'
  )
  if (recalled) {
    activeMessages = [
      {
        role: 'system',
        content: `Memories about this user (Mem0):\n${recalled}\nUse them when relevant. Do not invent extra personal facts.`,
      },
      ...activeMessages,
    ]
  }
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
    requestBody.model = m
    for (const url of chatUrls) {
    try {
      let res = await fetch(url, {
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
        res = await fetch(url, {
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
          const userQ = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
          void rememberTurn(userQ, String(content))
          if (usingFree) {
            const used =
              Number(data.usage?.total_tokens) ||
              estimateTokens(JSON.stringify(messages)) + estimateTokens(String(content))
            consumeFreeQuota(used)
          }
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
        if (!isExhausted(res.status, errText)) continue
      }
    } catch (err: any) {
      lastError = err.message
    }
    }
  }

  const nim = await queryNim(activeMessages)
  if (nim.ok && nim.content) {
    const userQ = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
    void rememberTurn(userQ, nim.content)
    return { ...nim, citations: fallbackCitations }
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
