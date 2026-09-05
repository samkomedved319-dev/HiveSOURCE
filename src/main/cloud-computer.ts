import { ipcMain } from 'electron'

const DEFAULT_URL = process.env.HIVE_CLOUD_URL || ''
const TOKEN = process.env.HIVE_CLOUD_TOKEN || ''

async function cloud(path: string, init?: RequestInit) {
  const base = process.env.HIVE_CLOUD_URL || DEFAULT_URL
  if (!base) return { ok: false, error: 'Set HIVE_CLOUD_URL (Cloudflare worker or Colab ngrok URL)' }
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (TOKEN || process.env.HIVE_CLOUD_TOKEN) {
    headers.authorization = `Bearer ${process.env.HIVE_CLOUD_TOKEN || TOKEN}`
  }
  const res = await fetch(`${base.replace(/\/$/, '')}${path}`, { ...init, headers: { ...headers, ...(init?.headers || {}) } })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok && (data as { ok?: boolean }).ok !== false, status: res.status, ...data }
}

export async function cloudStatus() {
  return cloud('/status')
}

export async function cloudExec(command: string) {
  return cloud('/exec', { method: 'POST', body: JSON.stringify({ command }) })
}

export async function cloudWrite(path: string, content: string) {
  return cloud('/fs', { method: 'POST', body: JSON.stringify({ path, content }) })
}

export async function cloudRead(path?: string) {
  return cloud(path ? `/fs?path=${encodeURIComponent(path)}` : '/fs')
}

export async function cloudSwarm(text: string) {
  return cloud('/swarm', { method: 'POST', body: JSON.stringify({ text }) })
}

export function registerCloudComputerHandlers() {
  ipcMain.handle('cloud:status', () => cloudStatus())
  ipcMain.handle('cloud:exec', (_e, command: string) => cloudExec(String(command || '')))
  ipcMain.handle('cloud:write', (_e, path: string, content: string) => cloudWrite(path, content))
  ipcMain.handle('cloud:read', (_e, path?: string) => cloudRead(path))
  ipcMain.handle('cloud:swarm', (_e, text: string) => cloudSwarm(String(text || '')))
}
