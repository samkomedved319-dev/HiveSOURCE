import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { exec, spawn } from 'child_process'
import util from 'util'
import { HIVE_VERSION, RELEASES_API, RELEASES_PAGE, UPDATE_MANIFEST_URL } from './hive-version'

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

type ReleaseNote = { type: string; text: string }

function isNewer(latest: string, current: string) {
  return latest.localeCompare(current, undefined, { numeric: true, sensitivity: 'base' }) > 0
}

function allowedDownload(url: string) {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    const okHost =
      host === 'github.com' ||
      host.endsWith('.githubusercontent.com') ||
      host === 'objects.githubusercontent.com'
    if (!okHost) return false
    return /hive-setup/i.test(u.pathname) || /releases/i.test(u.pathname)
  } catch {
    return false
  }
}

function sendProgress(payload: { phase: string; percent?: number; error?: string }) {
  for (const w of BrowserWindow.getAllWindows()) {
    try {
      w.webContents.send('app:update-progress', payload)
    } catch {}
  }
}

async function readManifest(): Promise<{
  version: string
  downloadUrl?: string
  notes?: ReleaseNote[]
}> {
  const res = await fetch(UPDATE_MANIFEST_URL, { cache: 'no-store' })
  if (res.ok) {
    const json = (await res.json()) as { version?: string; downloadUrl?: string; notes?: ReleaseNote[] }
    return {
      version: String(json.version || HIVE_VERSION),
      downloadUrl: json.downloadUrl,
      notes: json.notes,
    }
  }
  const gh = await fetch(RELEASES_API, {
    cache: 'no-store',
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!gh.ok) throw new Error('Could not reach GitHub')
  const release = (await gh.json()) as {
    tag_name?: string
    html_url?: string
    assets?: { name: string; browser_download_url: string }[]
  }
  const asset = (release.assets || []).find((a) => /Hive-Setup.*\.exe$/i.test(a.name))
  return {
    version: String(release.tag_name || HIVE_VERSION).replace(/^v/i, ''),
    downloadUrl: asset?.browser_download_url,
  }
}

export function registerSystemControlHandlers() {
  ipcMain.handle('system:exec', async (_e, command: string) => runSystemCommand(command))
  ipcMain.handle('system:openApp', async (_e, target: string) => openSystemTarget(target))
  ipcMain.handle('system:getVersion', async () => HIVE_VERSION)
  ipcMain.handle('app:getVersion', async () => HIVE_VERSION)

  ipcMain.handle('app:checkUpdate', async () => {
    const current = HIVE_VERSION
    try {
      const man = await readManifest()
      const latest = man.version || current
      const newer = isNewer(latest, current)
      return {
        ok: true,
        current,
        latest,
        newer,
        notes: man.notes || [],
        downloadUrl: man.downloadUrl,
        url: RELEASES_PAGE,
      }
    } catch (e) {
      return { ok: false, current, error: e instanceof Error ? e.message : 'Update check failed' }
    }
  })

  ipcMain.handle('app:installUpdate', async (_e, downloadUrl?: string) => {
    try {
      let url = downloadUrl || ''
      if (!url) {
        const man = await readManifest()
        url = man.downloadUrl || ''
      }
      if (!url || !allowedDownload(url)) return { ok: false, error: 'No trusted installer URL' }

      sendProgress({ phase: 'downloading', percent: 0 })
      const path = await import('path')
      const os = await import('os')
      const fs = await import('fs')
      const { pipeline } = await import('stream/promises')
      const { Readable } = await import('stream')

      const installerPath = path.join(os.tmpdir(), `Hive-Setup-${Date.now()}.exe`)
      const res = await fetch(url)
      if (!res.ok || !res.body) throw new Error(`Download failed with status ${res.status}`)
      const total = Number(res.headers.get('content-length') || 0)
      let received = 0
      const nodeStream = Readable.fromWeb(res.body as any)
      if (total > 0) {
        nodeStream.on('data', (chunk: Buffer) => {
          received += chunk.length
          sendProgress({ phase: 'downloading', percent: Math.min(99, Math.round((received / total) * 100)) })
        })
      }
      await pipeline(nodeStream, fs.createWriteStream(installerPath))

      sendProgress({ phase: 'installing', percent: 100 })
      const exe = app.getPath('exe')
      const helper = path.join(os.tmpdir(), 'hive-apply-update.cmd')
      const cmd = [
        '@echo off',
        'ping -n 3 127.0.0.1 >nul',
        `"${installerPath}" /S`,
        `start "" "${exe}"`,
      ].join('\r\n')
      fs.writeFileSync(helper, cmd, 'utf8')
      spawn('cmd.exe', ['/c', helper], { detached: true, stdio: 'ignore', windowsHide: true }).unref()
      setTimeout(() => app.quit(), 400)
      return { ok: true }
    } catch (err: any) {
      sendProgress({ phase: 'error', error: err.message })
      return { ok: false, error: err.message }
    }
  })
}
