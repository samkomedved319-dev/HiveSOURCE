import {
  defineRuntime,
  OpenAIChatCompletions,
  RuntimeState,
  type InferenceRunnerConfig,
} from '@mozaik-ai/core'
import type { SearchCitation } from '../search-service'
import { openRouterKey, mozaikCloudBase, mozaikCloudKey, openRouterBase } from '../keys'
import { FREE_GLM } from '../hive-free'

export type HiveMood = 'idle' | 'searching' | 'thinking' | 'arguing' | 'done' | 'error'

export type HiveTranscriptItem = {
  fromId: string
  fromName: string
  role: string
  text: string
  at: number
}

export class HiveState extends RuntimeState {
  goal?: string
  transcript: HiveTranscriptItem[] = []
  citations: SearchCitation[] = []
  mood: HiveMood = 'idle'
  lastUserMessage?: string
  humanId = ''
  scoutId = ''
  hiveId = ''
  criticId = ''
  operatorId = ''
  pulseId = ''
  sentryId = ''
  buddyId = ''
  voiceId = ''
  hiveRevisedFromScout = false
  hiveRevisedFromCritic = false
  voiceSpoken = false
  conversationId = 'default'
  lastVia: 'local' | 'telegram' = 'local'
  lastTelegramChatId = ''

  resetTurn(userText: string) {
    this.lastUserMessage = userText
    this.goal = userText
    this.hiveRevisedFromScout = false
    this.hiveRevisedFromCritic = false
    this.voiceSpoken = false
    this.mood = 'thinking'
  }

  snapshot() {
    return {
      goal: this.goal,
      mood: this.mood,
      lastUserMessage: this.lastUserMessage,
      conversationId: this.conversationId,
      transcript: this.transcript.slice(-48),
      citations: this.citations,
      ids: {
        human: this.humanId,
        scout: this.scoutId,
        hive: this.hiveId,
        critic: this.criticId,
        operator: this.operatorId,
        pulse: this.pulseId,
      },
    }
  }
}

const CONTEXT_TYPES = [
  'user_message',
  'system_message',
  'developer_message',
  'function_call',
  'function_call_output',
  'model_message',
]

function openRouterSpec(name: string) {
  return {
    name,
    provider: 'openrouter',
    supportsReasoningEffort: false,
    supportedReasoningEfforts: [] as string[],
    supportsStreaming: true,
    contextWindowSize: 128000,
    supportedContextItemTypes: CONTEXT_TYPES,
    maxOutputTokens: 1400,
    supportsFunctionCalling: true,
    supportsStructuredOutput: false,
  }
}

export const HIVE_MODEL = FREE_GLM

export const {
  initializeRuntime,
  resolveRuntime,
  resolveParticipant,
  join,
  leave,
  sendMessage,
  sendEvent,
  runLoop,
} = defineRuntime<HiveState>()

export function startMozaikRuntime() {
  const cloudBase = mozaikCloudBase()
  const cloudKey = mozaikCloudKey()
  const apiKey = cloudKey || openRouterKey()
  const baseURL = cloudBase || openRouterBase()
  if (apiKey && !process.env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = apiKey
  if (!process.env.OPENAI_BASE_URL) process.env.OPENAI_BASE_URL = baseURL
  process.env.MOZAIK_TELEMETRY = process.env.MOZAIK_TELEMETRY || '0'

  const endpoint = new OpenAIChatCompletions(undefined, {
    baseURL,
    apiKey,
    extraBody: {
      max_tokens: 1400,
    },
  })

  const models: NonNullable<InferenceRunnerConfig['supportedModels']> = [
    HIVE_MODEL,
    FREE_GLM,
  ].map((name) => ({ endpoint, specification: openRouterSpec(name) }))

  initializeRuntime({
    state: new HiveState(),
    inferenceRunnerConfig: { supportedModels: models },
  })
}

export function inferenceInputFor(agent: { getMemory: () => { getContext: () => any }; getTools: () => any[] }) {
  return {
    model: HIVE_MODEL,
    streaming: true,
    maxOutputTokens: 900,
    context: agent.getMemory().getContext(),
    tools: agent.getTools(),
  }
}

