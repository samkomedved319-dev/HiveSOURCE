import { BrowserWindow, ipcMain } from 'electron'
import { emitHiveEvent, emitHiveState, setHiveEmitter } from './notify'
import { resolveRuntime, sendMessage } from './runtime'

let getWindow: () => BrowserWindow | null = () => null

export function registerHiveBridge(getMain: () => BrowserWindow | null) {
  getWindow = getMain
  setHiveEmitter((channel, payload) => {
    const win = getWindow()
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
  })

  ipcMain.handle('hive:send', async (_e, text: string) => {
    const message = String(text || '').trim()
    if (!message) return { ok: false, error: 'Empty message' }
    try {
      const runtime = resolveRuntime()
      const humanId = runtime.state.humanId
      if (!humanId) return { ok: false, error: 'Human participant missing' }
      runtime.state.resetTurn(message)
      runtime.state.transcript.push({
        fromId: humanId,
        fromName: 'You',
        role: 'user',
        text: message,
        at: Date.now(),
      })
      emitHiveState(runtime.state.snapshot())
      emitHiveEvent({
        type: 'message.sent',
        producerId: humanId,
        producerName: 'You',
        text: message,
        occurredAt: Date.now(),
      })
      sendMessage(message, humanId)
      return { ok: true }
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Hive swarm failed'
      emitHiveEvent({
        type: 'hive.error',
        producerId: 'runtime',
        producerName: 'Hive',
        text: error,
        occurredAt: Date.now(),
      })
      return { ok: false, error }
    }
  })

  ipcMain.handle('hive:status', async () => {
    try {
      return { ok: true, state: resolveRuntime().state.snapshot() }
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : 'Runtime down' }
    }
  })
}
