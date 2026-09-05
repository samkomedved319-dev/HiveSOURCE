import { BrowserWindow, ipcMain } from 'electron'
import { registerApprovalIpc } from './approvals'
import { ingestUserMessage } from './ingest'
import { emitHiveEvent, setHiveEmitter } from './notify'
import { resolveRuntime } from './runtime'

let getWindow: () => BrowserWindow | null = () => null

export function registerHiveBridge(getMain: () => BrowserWindow | null) {
  getWindow = getMain
  setHiveEmitter((channel, payload) => {
    const win = getWindow()
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
  })

  ipcMain.handle('hive:send', async (_e, text: string, conversationId?: string) => {
    try {
      ingestUserMessage(String(text || ''), { conversationId: conversationId || 'default', via: 'local' })
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

  registerApprovalIpc()
}
