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
  ipcMain.handle('system:getVersion', async () => '0.0.1.1')
  ipcMain.handle('app:getVersion', async () => '0.0.1.1')

  ipcMain.handle('app:checkUpdate', async () => {
    try {
      const current = '0.0.1.1'
      const res = await fetch('https://raw.githubusercontent.com/samkomedved319-dev/Hive-Desktop/main/latest.json', {
        cache: 'no-store',
      })
      if (!res.ok) {
        // Fallback to releases page if latest.json is not yet published
        return { ok: true, current, latest: current, newer: false, url: 'https://github.com/samkomedved319-dev/Hive-Desktop/releases' }
      }
      const json = (await res.json()) as { version?: string; downloadUrl?: string }
      const latest = String(json.version || current)
      const newer = latest.localeCompare(current, undefined, { numeric: true, sensitivity: 'base' }) > 0
      return {
        ok: true,
        current,
        latest,
        newer,
        downloadUrl: json.downloadUrl || 'https://github.com/samkomedved319-dev/Hive-Desktop/releases',
        url: 'https://github.com/samkomedved319-dev/Hive-Desktop/releases',
      }
    } catch (e) {
      return { ok: false, current: '0.0.1.1', error: e instanceof Error ? e.message : 'Update check failed' }
    }
  })

  ipcMain.handle('app:installUpdate', async (_e, downloadUrl?: string) => {
    try {
      if (!downloadUrl) return { ok: false, error: 'No download URL provided' }
      const path = await import('path')
      const os = await import('os')
      const fs = await import('fs')
      const { pipeline } = await import('stream/promises')
      const { Readable } = await import('stream')
      const { spawn } = await import('child_process')

      const installerPath = path.join(os.tmpdir(), `Hive-Update-${Date.now()}.exe`)
      const res = await fetch(downloadUrl)
      if (!res.ok || !res.body) throw new Error(`Download failed with status ${res.status}`)

      // Stream installer directly to temp file
      const nodeStream = Readable.fromWeb(res.body as any)
      const fileStream = fs.createWriteStream(installerPath)
      await pipeline(nodeStream, fileStream)

      // Launch installer silently/automatically and quit current app
      spawn(installerPath, ['/S'], { detached: true, stdio: 'ignore' }).unref()
      setTimeout(() => {
        app.quit()
      }, 1000)

      return { ok: true }
    } catch (err: any) {
      return { ok: false, error: err.message }
    }
  })
}
