import fs from 'fs'
import path from 'path'
import { dialog, ipcMain, BrowserWindow } from 'electron'
import { requestApproval } from './mozaik/approvals'

let root = ''

function safe(rel: string) {
  if (!root) throw new Error('No project folder set')
  const p = path.resolve(root, rel || '.')
  const base = path.resolve(root)
  if (!p.startsWith(base)) throw new Error('Path escapes project')
  return p
}

export function registerWorkspaceHandlers() {
  ipcMain.handle('workspace:pick', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const res = win
      ? await dialog.showOpenDialog(win, {
          properties: ['openDirectory'],
          title: 'Open a project folder for Hive',
        })
      : await dialog.showOpenDialog({
          properties: ['openDirectory'],
          title: 'Open a project folder for Hive',
        })
    if (res.canceled || !res.filePaths[0]) return { ok: false }
    root = res.filePaths[0]
    return { ok: true, root }
  })

  ipcMain.handle('workspace:set', (_e, folder: string) => {
    const p = path.resolve(String(folder || ''))
    if (!fs.existsSync(p) || !fs.statSync(p).isDirectory()) return { ok: false, error: 'Not a folder' }
    root = p
    return { ok: true, root }
  })

  ipcMain.handle('workspace:status', () => ({ ok: true, root }))

  ipcMain.handle('workspace:list', (_e, rel = '.') => {
    try {
      const dir = safe(String(rel || '.'))
      const entries = fs.readdirSync(dir, { withFileTypes: true }).slice(0, 80).map((e) => ({
        name: e.name,
        dir: e.isDirectory(),
      }))
      return { ok: true, root, entries }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('workspace:read', (_e, rel: string) => {
    try {
      const p = safe(rel)
      const stat = fs.statSync(p)
      if (stat.size > 400_000) return { ok: false, error: 'File too large' }
      return { ok: true, path: p, content: fs.readFileSync(p, 'utf8') }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('workspace:write', async (_e, rel: string, content: string) => {
    try {
      const p = safe(rel)
      const ok = await requestApproval('write_file', { path: p })
      if (!ok) return { ok: false, error: 'Denied' }
      fs.mkdirSync(path.dirname(p), { recursive: true })
      fs.writeFileSync(p, String(content ?? ''), 'utf8')
      return { ok: true, path: p }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })
}
