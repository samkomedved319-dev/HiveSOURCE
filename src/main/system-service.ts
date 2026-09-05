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
}
