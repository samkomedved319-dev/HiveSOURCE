import { create } from 'zustand'
import type { Message } from '../types'

interface ChatState {
  messages: Record<string, Message[]>
  isTyping: boolean
  getMessages: (agentId: string) => Message[]
  addMessage: (agentId: string, message: Message) => void
  upsertMessage: (agentId: string, message: Message) => void
  clearMessages: (agentId: string) => void
  setTyping: (typing: boolean) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  isTyping: false,
  getMessages: (agentId) => get().messages[agentId] ?? [],
  addMessage: (agentId, message) => set((s) => ({
    messages: {
      ...s.messages,
      [agentId]: [...(s.messages[agentId] ?? []), message],
    },
  })),
  upsertMessage: (agentId, message) => set((s) => {
    const list = s.messages[agentId] ?? []
    const i = list.findIndex((m) => m.id === message.id)
    if (i < 0) {
      return { messages: { ...s.messages, [agentId]: [...list, message] } }
    }
    const next = list.slice()
    next[i] = { ...next[i], ...message, content: message.content }
    return { messages: { ...s.messages, [agentId]: next } }
  }),
  clearMessages: (agentId) => set((s) => ({
    messages: {
      ...s.messages,
      [agentId]: [],
    },
  })),
  setTyping: (typing) => set({ isTyping: typing }),
}))
