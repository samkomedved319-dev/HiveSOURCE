import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  show: () => ipcRenderer.send('window:show'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  telegram: {
    getMe: () => ipcRenderer.invoke('telegram:getMe'),
    getActiveChatId: () => ipcRenderer.invoke('telegram:getActiveChatId'),
    sendMessage: (chatId: string, text: string) => ipcRenderer.invoke('telegram:sendMessage', chatId, text),
    sendVoice: (chatId: string, text: string) => ipcRenderer.invoke('telegram:sendVoice', chatId, text),
    notifyDone: (chatId: string, summary: string, mode: 'call' | 'message') =>
      ipcRenderer.invoke('telegram:notifyDone', chatId, summary, mode),
    getCallTranscript: () => ipcRenderer.invoke('telegram:getCallTranscript'),
    clearCallTranscript: () => ipcRenderer.invoke('telegram:clearCallTranscript'),
    getAuthPin: () => ipcRenderer.invoke('telegram:getAuthPin'),
    generateAuthPin: () => ipcRenderer.invoke('telegram:generateAuthPin'),
    getUpdates: () => ipcRenderer.invoke('telegram:getUpdates'),
  },
  webrtc: {
    getToken: (room: string, identity: string) => ipcRenderer.invoke('webrtc:getToken', room, identity),
  },
  system: {
    exec: (command: string) => ipcRenderer.invoke('system:exec', command),
    openApp: (target: string) => ipcRenderer.invoke('system:openApp', target),
    getVersion: () => ipcRenderer.invoke('system:getVersion'),
  },
  cloud: {
    status: () => ipcRenderer.invoke('cloud:status'),
    exec: (command: string) => ipcRenderer.invoke('cloud:exec', command),
    swarm: (text: string) => ipcRenderer.invoke('cloud:swarm', text),
  },
  workspace: {
    pick: () => ipcRenderer.invoke('workspace:pick'),
    set: (folder: string) => ipcRenderer.invoke('workspace:set', folder),
    status: () => ipcRenderer.invoke('workspace:status'),
    list: (rel?: string) => ipcRenderer.invoke('workspace:list', rel),
    read: (rel: string) => ipcRenderer.invoke('workspace:read', rel),
    write: (rel: string, content: string) => ipcRenderer.invoke('workspace:write', rel, content),
  },
  buddy: {
    onSummon: (cb: () => void) => {
      const handler = () => cb()
      ipcRenderer.on('buddy:summon', handler)
      return () => ipcRenderer.removeListener('buddy:summon', handler)
    },
    click: (x: number, y: number) => ipcRenderer.invoke('system:click', x, y),
    type: (text: string) => ipcRenderer.invoke('system:type', text),
    setOuterEnabled: (on: boolean) => ipcRenderer.send('buddy:setOuterEnabled', on),
    phase: (p: string) => ipcRenderer.send('buddy:phase', p),
    notchHide: () => ipcRenderer.send('buddy:notch-hide'),
    onPhase: (cb: (p: string) => void) => {
      const handler = (_e: unknown, p: string) => cb(p)
      ipcRenderer.on('buddy:phase', handler)
      return () => ipcRenderer.removeListener('buddy:phase', handler)
    },
    onNotchMode: (cb: (m: string) => void) => {
      const handler = (_e: unknown, m: string) => cb(m)
      ipcRenderer.on('buddy:notch-mode', handler)
      return () => ipcRenderer.removeListener('buddy:notch-mode', handler)
    },
  },
  shortcuts: {
    setGlobal: (next: { hivebox?: string; buddy?: string }) => ipcRenderer.send('shortcuts:set', next),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },
  tts: {
    speak: (text: string) => ipcRenderer.invoke('tts:speak', text),
  },
  search: {
    query: (query: string) => ipcRenderer.invoke('search:query', query),
  },
  ai: {
    chat: (messages: { role: string; content: string }[], model?: string, options?: { webSearch?: boolean }) =>
      ipcRenderer.invoke('ai:chat', messages, model, options),
    models: () => ipcRenderer.invoke('ai:models'),
  },
  keys: {
    set: (next: Record<string, string>) => ipcRenderer.invoke('keys:set', next),
    status: () => ipcRenderer.invoke('keys:status'),
  },
  mem0: {
    search: (query: string) => ipcRenderer.invoke('mem0:search', query),
    add: (messages: { role: string; content: string }[]) => ipcRenderer.invoke('mem0:add', messages),
    status: () => ipcRenderer.invoke('mem0:status'),
  },
  auth: {
    openWebLogin: () => ipcRenderer.send('auth:openWeb'),
    onSession: (cb: (tokens: { access_token: string; refresh_token: string }) => void) => {
      const handler = (_e: unknown, tokens: { access_token: string; refresh_token: string }) => cb(tokens)
      ipcRenderer.on('auth:session', handler)
      return () => ipcRenderer.removeListener('auth:session', handler)
    },
  },
  hive: {
    send: (text: string, conversationId?: string) => ipcRenderer.invoke('hive:send', text, conversationId),
    status: () => ipcRenderer.invoke('hive:status'),
    decide: (id: string, ok: boolean) => ipcRenderer.invoke('hive:decide', id, ok),
    onEvent: (cb: (ev: HiveSwarmEvent) => void) => {
      const handler = (_e: unknown, ev: HiveSwarmEvent) => cb(ev)
      ipcRenderer.on('hive:event', handler)
      return () => ipcRenderer.removeListener('hive:event', handler)
    },
    onState: (cb: (state: HiveSwarmState) => void) => {
      const handler = (_e: unknown, state: HiveSwarmState) => cb(state)
      ipcRenderer.on('hive:state', handler)
      return () => ipcRenderer.removeListener('hive:state', handler)
    },
  },
})

type HiveSwarmEvent = {
  type: string
  producerId: string
  producerName: string
  text?: string
  occurredAt: number
  approvalId?: string
  tool?: string
  args?: unknown
}

type HiveSwarmState = {
  mood: string
  citations?: { url: string; title: string; content?: string; domain?: string }[]
  ids?: Record<string, string>
}
