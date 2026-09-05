import { app, ipcMain, shell } from 'electron'
import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)

export async function runSystemCommand(command: string) {
  try {
    if (/format\s+[a-z]:/i.test(command) || /del\s+\/s\s+\/q\s+c:\\windows/i.test(command)) {
      return { ok: false, error: 'Command blocked by security policy' }
    }
    const { stdout, stderr } = await execPromise(command, {
      timeout: 15000,
      shell: 'powershell.exe',
    })
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim() }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

export async function openSystemTarget(target: string) {
  try {
    if (target.startsWith('http://') || target.startsWith('https://')) {
      await shell.openExternal(target)
      return { ok: true, message: `Opened URL: ${target}` }
    }
    await execPromise(`Start-Process "${target}"`, { shell: 'powershell.exe' })
    return { ok: true, message: `Launched ${target}` }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export function registerSystemControlHandlers() {
  ipcMain.handle('system:exec', async (_e, command: string) => runSystemCommand(command))
  ipcMain.handle('system:openApp', async (_e, target: string) => openSystemTarget(target))
  ipcMain.handle('system:getVersion', async () => app.getVersion())
  ipcMain.handle('app:getVersion', async () => app.getVersion())
  ipcMain.handle('app:checkUpdate', async () => {
    try {
      const current = app.getVersion()
      const res = await fetch('https://raw.githubusercontent.com/samkomedved319-dev/HiveSOURCE/main/package.json', {
        cache: 'no-store',
      })
      if (!res.ok) return { ok: false, current, error: 'Could not reach GitHub' }
      const json = (await res.json()) as { version?: string }
      const latest = String(json.version || current)
      const newer = latest.localeCompare(current, undefined, { numeric: true, sensitivity: 'base' }) > 0
      return {
        ok: true,
        current,
        latest,
        newer,
        url: 'https://github.com/samkomedved319-dev/HiveSOURCE/releases',
      }
    } catch (e) {
      return { ok: false, current: app.getVersion(), error: e instanceof Error ? e.message : 'Update check failed' }
    }
  })
}
