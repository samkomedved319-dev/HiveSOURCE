import { ipcMain } from 'electron'
import { performWebSearch } from './search-service'
import {
  nvidiaNimKey,
  userLlmKey,
  detectProvider,
  anthropicKey,
  type LlmProvider,
} from './keys'
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
import { isTrivialChat } from './chat-intent'

export const FREE_MODELS = HIVE_FREE_MODELS
export const DEFAULT_FREE_MODEL = FREE_GLM

function stripThink(text: string) {
  let t = String(text || '')
  const end = t.lastIndexOf('</think>')
  if (end >= 0) t = t.slice(end + 8)
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, '')
  return t.trim()
}

function extractAssistantText(rawMsg: any): string {
  if (!rawMsg) return ''
  const parts: string[] = []
  const push = (v: unknown) => {
    if (typeof v === 'string' && v.trim()) parts.push(v.trim())
  }
  const c = rawMsg.content
  if (typeof c === 'string') push(c)
  else if (Array.isArray(c)) {
    for (const p of c) {
      if (typeof p === 'string') push(p)
      else if (p && typeof p === 'object') push((p as any).text || (p as any).content)
    }
  }
  if (!parts.length) {
    push(rawMsg.reasoning_content)
    push(rawMsg.reasoning)
  }
  return stripThink(parts.join('\n'))
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
  thinking?: boolean
}

async function queryAnthropic(messages: ChatMessage[], key: string) {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n')
  const rest = messages.filter((m) => m.role !== 'system')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 900,
      system: system || undefined,
      messages: rest.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    return { ok: false as const, error: `[anthropic] ${res.status}: ${err.slice(0, 280)}` }
  }
  const data = (await res.json()) as { content?: { type: string; text?: string }[] }
  const text = (data.content || []).map((p) => p.text || '').join('\n').trim()
  if (!text) return { ok: false as const, error: '[anthropic] empty reply' }
  return { ok: true as const, content: text, model: 'claude-sonnet-4' }
}

async function queryOpenAICompat(
  url: string,
  key: string,
  model: string,
  body: Record<string, unknown>
) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': 'https://hivetools.pro/hive/',
      'X-Title': 'Hive Desktop',
    },
    body: JSON.stringify({ ...body, model }),
  })
  const errText = res.ok ? '' : await res.text()
  return { res, errText }
}

export async function queryAIModel(
  messages: ChatMessage[],
  modelChoice?: string,
  options?: ChatOptions
): Promise<{ ok: boolean; content?: string; error?: string; model?: string; citations?: SearchCitation[] }> {
  const provider: LlmProvider = detectProvider()
  const userKey = userLlmKey()
  const requestedModel = FREE_MODELS.includes(modelChoice || '') ? FREE_GLM : FREE_GLM
  const hiveFree = provider === 'hive-free'

  if (hiveFree) {
    const est = estimateTokens(JSON.stringify(messages)) + 400
    const gate = assertFreeQuota(est)
    if (!gate.ok) return { ok: false, error: gate.error }
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
  const trivial = isTrivialChat(lastUser)
  const recalled = trivial ? '' : await recallForPrompt(lastUser || 'preferences')
  let activeMessages = [...messages]
  if (recalled) {
    activeMessages = [
      {
        role: 'system',
        content: `Memories about this user (Mem0):\n${recalled}\nUse them when relevant. Do not invent extra personal facts. Do not dump the whole list unless asked.`,
      },
      ...activeMessages,
    ]
  }

  let fallbackCitations: SearchCitation[] | undefined
  if (options?.webSearch) {
    try {
      const fallbackRes = await performWebSearch(lastUser)
      if (fallbackRes.ok && fallbackRes.citations.length > 0) {
        fallbackCitations = fallbackRes.citations
        activeMessages = [
          {
            role: 'system',
            content: `[Verified Live Web Search Context]:\n${fallbackRes.citations
              .map((c, i) => `[Source ${i + 1}]: ${c.title} (${c.url})\n${c.content}`)
              .join('\n\n')}\n\nAnswer from these facts. Cite sources.`,
          },
          ...activeMessages,
        ]
      }
    } catch {}
  }

  const thinkOn = Boolean(options?.thinking) && !trivial
  const requestBody: any = {
    messages: activeMessages,
    max_tokens: trivial ? 120 : thinkOn ? 1600 : 900,
    temperature: trivial ? 0.4 : 0.65,
  }
  if (!thinkOn) {
    requestBody.thinking = { type: 'disabled' }
    requestBody.enable_thinking = false
  }

  if (provider === 'anthropic') {
    const key = anthropicKey() || userKey
    if (!key) return { ok: false, error: 'Anthropic key missing. Paste sk-ant-… in Settings → Models.' }
    const out = await queryAnthropic(activeMessages, key)
    if (out.ok) {
      void rememberTurn(lastUser, out.content)
      return { ...out, citations: fallbackCitations }
    }
    return out
  }

  if (provider === 'openai') {
    const key = userKey
    const { res, errText } = await queryOpenAICompat(
      'https://api.openai.com/v1/chat/completions',
      key,
      'gpt-4o-mini',
      { messages: activeMessages, max_tokens: requestBody.max_tokens, temperature: requestBody.temperature }
    )
    if (!res.ok) return { ok: false, error: `[openai] ${res.status}: ${errText.slice(0, 280)}` }
    const data = (await res.json()) as any
    const content = extractAssistantText(data.choices?.[0]?.message)
    if (!content) return { ok: false, error: '[openai] empty reply' }
    void rememberTurn(lastUser, content)
    return { ok: true, content, model: 'gpt-4o-mini', citations: fallbackCitations }
  }

  if (provider === 'openrouter') {
    const key = userKey
    const models = ['z-ai/glm-5.3', 'z-ai/glm-5.3-free', 'openai/gpt-4o-mini']
    let lastError = ''
    for (const m of models) {
      const { res, errText } = await queryOpenAICompat(
        'https://openrouter.ai/api/v1/chat/completions',
        key,
        m,
        requestBody
      )
      if (res.ok) {
        const data = (await res.json()) as any
        const content = extractAssistantText(data.choices?.[0]?.message)
        if (content) {
          void rememberTurn(lastUser, content)
          return { ok: true, content, model: m, citations: fallbackCitations }
        }
        lastError = `[${m}] empty reply`
      } else {
        lastError = `[${m}] ${res.status}: ${errText.slice(0, 220)}`
        if (/credit|quota|402|403/.test(errText.toLowerCase() + String(res.status))) continue
      }
    }
    return {
      ok: false,
      error: lastError || 'OpenRouter key was rejected. Check credits or paste another key.',
    }
  }

  // Hive Free — GLM 5.3 only. Never Nemotron (zero credits).
  const API_KEY = HIVE_FREE_KEY
  if (!API_KEY) {
    return {
      ok: false,
      error: 'Hive Free is not ready. Paste your own OpenRouter, OpenAI, or Anthropic key in Settings → Models.',
    }
  }

  let lastError = ''
  for (const base of TOKENROUTER_BASES) {
    const url = `${base}/chat/completions`
    try {
      requestBody.model = requestedModel || DEFAULT_FREE_MODEL
      const { res, errText } = await queryOpenAICompat(url, API_KEY, requestBody.model, requestBody)
      if (res.ok) {
        const data = (await res.json()) as any
        const content = extractAssistantText(data.choices?.[0]?.message)
        if (content) {
          void rememberTurn(lastUser, content)
          const used =
            Number(data.usage?.total_tokens) ||
            estimateTokens(JSON.stringify(messages)) + estimateTokens(content)
          consumeFreeQuota(used)
          return { ok: true, content, model: requestBody.model, citations: fallbackCitations }
        }
        lastError = `[${requestBody.model}] empty reply`
      } else {
        lastError = `[${requestBody.model}] ${res.status}: ${errText}`
        const low = errText.toLowerCase()
        if (low.includes('credit') || low.includes('quota') || res.status === 402 || res.status === 403) {
          return {
            ok: false,
            error:
              'Hive Free ran out of provider credits for this model. Add your own OpenRouter, OpenAI, or Anthropic key in Settings → Models — you can, and you should if you want unlimited use.',
          }
        }
      }
    } catch (e: any) {
      lastError = e.message
    }
  }

  const nimKey = nvidiaNimKey()
  if (nimKey) {
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nimKey}` },
        body: JSON.stringify({
          model: 'meta/llama-3.1-8b-instruct',
          messages: activeMessages,
          max_tokens: 800,
          temperature: 0.6,
        }),
      })
      if (res.ok) {
        const data = (await res.json()) as any
        const content = extractAssistantText(data.choices?.[0]?.message)
        if (content) {
          void rememberTurn(lastUser, content)
          return { ok: true, content, model: 'nim:llama', citations: fallbackCitations }
        }
      }
    } catch {}
  }

  if (fallbackCitations?.length) {
    const summary = fallbackCitations.map((c) => `• **${c.title}**: ${c.content}`).join('\n\n')
    return { ok: true, content: `Here is what I found:\n\n${summary}`, citations: fallbackCitations, model: 'web' }
  }

  return {
    ok: false,
    error:
      lastError ||
      'Hive Free is busy. Retry, or paste your own OpenRouter / OpenAI / Anthropic key in Settings → Models.',
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
        name: 'GLM 5.3',
      })),
    }
  })
}
