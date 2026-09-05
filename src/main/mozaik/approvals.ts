import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { emitHiveEvent } from './notify'

type Pending = { resolve: (ok: boolean) => void }
const pending = new Map<string, Pending>()

export function requestApproval(tool: string, args: unknown): Promise<boolean> {
  const id = randomUUID()
  emitHiveEvent({
    type: 'hive.approve',
    producerId: 'operator',
    producerName: 'Operator',
    text: `${tool} ${typeof args === 'string' ? args : JSON.stringify(args)}`,
    approvalId: id,
    tool,
    args,
    occurredAt: Date.now(),
  })
  return new Promise((resolve) => {
    pending.set(id, { resolve })
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id)
        resolve(false)
      }
    }, 45000)
  })
}

export function registerApprovalIpc() {
  ipcMain.handle('hive:decide', async (_e, id: string, ok: boolean) => {
    const p = pending.get(String(id))
    if (!p) return { ok: false }
    pending.delete(String(id))
    p.resolve(!!ok)
    return { ok: true }
  })
}
