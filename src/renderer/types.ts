export interface Agent {
  id: string
  name: string
  systemPrompt: string
  description?: string
  avatar?: string
  model?: string
  mode?: 'fast' | 'auto' | 'heavy' | 'max'
  roleTitle?: string
  isCeo?: boolean
  createdAt?: number
}

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
  error?: string
  provider?: string
}

export interface Settings {
  theme: string
  apiKey: string
  apiProvider: string
  phoneNumber: string | null
  notifications: boolean
  autoStart: boolean
}

export interface Message {
  id: string
  agentId: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: number
  via?: 'local' | 'telegram' | 'voice'
  botName?: string
  botAvatar?: string
  botRole?: string
  type?: string
  isWebSearch?: boolean
  searchQuery?: string
  citations?: SearchCitation[]
}

export interface ElectronAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  show: () => void
  isMaximized: () => Promise<boolean>
  telegram: {
    getMe: () => Promise<any>
    getActiveChatId?: () => Promise<string>
    sendMessage: (chatId: string, text: string) => Promise<any>
    sendVoice: (chatId: string, text: string) => Promise<any>
    notifyDone?: (chatId: string, summary: string, mode: 'call' | 'message') => Promise<any>
    getCallTranscript?: () => Promise<{ role: string; content: string; timestamp: number }[]>
    clearCallTranscript?: () => Promise<void>
    getAuthPin?: () => Promise<string>
    generateAuthPin?: () => Promise<string>
    getUpdates: () => Promise<any>
  }
  webrtc?: {
    getToken: (room: string, identity: string) => Promise<{ token: string; url: string }>
  }
  system?: {
    exec: (command: string) => Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>
    openApp: (target: string) => Promise<{ ok: boolean; message?: string; error?: string }>
    getVersion?: () => Promise<string>
  }
  cloud?: {
    status: () => Promise<any>
    exec: (command: string) => Promise<any>
    swarm: (text: string) => Promise<any>
  }
  buddy?: {
    onSummon: (cb: () => void) => () => void
    click: (x: number, y: number) => Promise<{ ok: boolean; error?: string }>
    type: (text: string) => Promise<{ ok: boolean; error?: string }>
    setOuterEnabled?: (on: boolean) => void
    phase?: (p: string) => void
    notchHide?: () => void
    onPhase?: (cb: (p: string) => void) => () => void
    onNotchMode?: (cb: (m: string) => void) => () => void
  }
  app?: {
    getVersion?: () => Promise<string>
  }
  tts?: {
    speak: (text: string) => Promise<{ ok: boolean; dataUrl?: string; error?: string }>
  }
  search?: {
    query: (query: string) => Promise<SearchResult>
  }
  ai: {
    chat: (
      messages: { role: string; content: string }[],
      model?: string,
      options?: { webSearch?: boolean }
    ) => Promise<{
      ok: boolean
      content?: string
      citations?: SearchCitation[]
      model?: string
      error?: string
    }>
    models?: () => Promise<{
      ok: boolean
      models?: { id: string; name: string; context_length?: number }[]
      error?: string
    }>
  }
  auth?: {
    openWebLogin: () => void
    onSession: (cb: (tokens: { access_token: string; refresh_token: string }) => void) => () => void
  }
  hive?: {
    send: (text: string, conversationId?: string) => Promise<{ ok: boolean; error?: string }>
    status: () => Promise<{ ok: boolean; state?: HiveSwarmState; error?: string }>
    decide?: (id: string, ok: boolean) => Promise<{ ok: boolean }>
    onEvent: (cb: (ev: HiveSwarmEvent) => void) => () => void
    onState: (cb: (state: HiveSwarmState) => void) => () => void
  }
}

export type HiveSwarmEvent = {
  type: string
  producerId: string
  producerName: string
  text?: string
  occurredAt: number
  approvalId?: string
  tool?: string
  args?: unknown
}

export type HiveSwarmState = {
  mood?: string
  goal?: string
  lastUserMessage?: string
  citations?: SearchCitation[]
  transcript?: { fromId: string; fromName: string; role: string; text: string; at: number }[]
  ids?: { human?: string; scout?: string; hive?: string; critic?: string; operator?: string }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
