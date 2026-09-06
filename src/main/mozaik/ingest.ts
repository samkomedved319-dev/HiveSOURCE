import { emitHiveEvent, emitHiveState } from './notify'
import { loadRoom, loadRooms, stashRoom } from './persist'
import { resolveRuntime, sendMessage } from './runtime'
import { isTrivialChat } from '../chat-intent'

let loaded = false

export function ingestUserMessage(
  text: string,
  opts?: { conversationId?: string; via?: 'local' | 'telegram'; telegramChatId?: string }
) {
  const message = String(text || '').trim()
  if (!message) throw new Error('Empty message')
  if (!loaded) {
    loadRooms()
    loaded = true
  }
  const runtime = resolveRuntime()
  const humanId = runtime.state.humanId
  if (!humanId) throw new Error('Human participant missing')

  const nextId = opts?.conversationId || 'default'
  if (runtime.state.conversationId && runtime.state.conversationId !== nextId) {
    stashRoom(runtime.state.conversationId, {
      transcript: runtime.state.transcript,
      citations: runtime.state.citations,
    })
    const room = loadRoom(nextId)
    runtime.state.transcript = room.transcript
    runtime.state.citations = room.citations
  }
  runtime.state.conversationId = nextId
  runtime.state.lastVia = opts?.via || 'local'
  runtime.state.lastTelegramChatId = opts?.telegramChatId || ''
  runtime.state.resetTurn(message)
  runtime.state.transcript.push({
    fromId: humanId,
    fromName: 'You',
    role: 'user',
    text: message,
    at: Date.now(),
  })
  stashRoom(nextId, { transcript: runtime.state.transcript, citations: runtime.state.citations })
  emitHiveState(runtime.state.snapshot())
  emitHiveEvent({
    type: 'message.sent',
    producerId: humanId,
    producerName: 'You',
    text: message,
    occurredAt: Date.now(),
  })
  if (isTrivialChat(message)) {
    runtime.state.mood = 'done'
    emitHiveState(runtime.state.snapshot())
    return
  }
  sendMessage(message, humanId)
}
