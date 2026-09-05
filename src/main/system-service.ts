import { app, ipcMain, shell } from 'electron'
import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)

export function registerSystemControlHandlers() {
  // Execute verified local powershell / cmd task
  ipcMain.handle('system:exec', async (_e, command: string) => {
    try {
      // Safe guard against destructive format commands
      if (/format\s+[a-z]:/i.test(command) || /del\s+\/s\s+\/q\s+c:\\windows/i.test(command)) {
        return { ok: false, error: 'Command blocked by security policy' }
      }

      const { stdout, stderr } = await execPromise(command, {
        timeout: 15000,
        shell: 'powershell.exe',
      })

      return {
        ok: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      }
    } catch (err: any) {
      return {
        ok: false,
        error: err.message,
      }
    }
  })

  // Open applications or web pages locally
  ipcMain.handle('system:openApp', async (_e, target: string) => {
    try {
      if (target.startsWith('http://') || target.startsWith('https://')) {
        await shell.openExternal(target)
        return { ok: true, message: `Opened URL: ${target}` }
      } else {
        await execPromise(`Start-Process "${target}"`, { shell: 'powershell.exe' })
        return { ok: true, message: `Launched ${target}` }
      }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })

  // App version retrieval (backed by package.json / Electron app.getVersion())
  ipcMain.handle('system:getVersion', async () => {
    return app.getVersion()
  })

  ipcMain.handle('app:getVersion', async () => {
    return app.getVersion()
  })
}
