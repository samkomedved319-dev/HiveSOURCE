import path from 'path'
import fs from 'fs'
import { app, ipcMain } from 'electron'

function isPlaceholder(v: string) {
  const s = v.trim()
  if (!s) return true
  if (s.includes('your_') || s.endsWith('_here')) return true
  if (s === 'sk-or-v1-...' || s === 'sk-or-v1-your-real-key') return true
  return false
}

function applyEnvFile(file: string) {
  if (!fs.existsSync(file)) return
  try {
    const text = fs.readFileSync(file, 'utf8')
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq < 1) continue
      const name = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!isPlaceholder(val)) process.env[name] = val
    }
  } catch {}
}

export function loadEnvFiles() {
  const extra: string[] = []
  try {
    extra.push(path.join(app.getAppPath(), '.env'))
    extra.push(path.join(path.dirname(app.getPath('exe')), '.env'))
    extra.push(path.join(app.getPath('userData'), '.env'))
  } catch {}
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../../../.env'),
    ...extra,
  ]
  for (const p of candidates) applyEnvFile(p)
}

loadEnvFiles()

const overlay: Record<string, string> = {}

export function setOverlayKeys(next: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(next)) {
    if (typeof v === 'string' && !isPlaceholder(v)) overlay[k] = v.trim()
  }
}

export function getKey(...names: string[]): string {
  for (const n of names) {
    const fromOverlay = overlay[n]
    if (fromOverlay && !isPlaceholder(fromOverlay)) return fromOverlay
    const fromEnv = process.env[n]
    if (fromEnv && !isPlaceholder(fromEnv)) return fromEnv.trim()
  }
  return ''
}

export function openRouterKey() {
  const k = getKey('OPENROUTER_API_KEY', 'OPENAI_API_KEY', 'hive_custom_api_key')
  if (k) return k
  const openai = getKey('OPENAI_API_KEY')
  if (openai.startsWith('sk-or-')) return openai
  return ''
}

export function openRouterBase() {
  return getKey('OPENAI_BASE_URL') || 'https://openrouter.ai/api/v1'
}

export function mozaikCloudKey() {
  return getKey('MOZAIK_CLOUD_API_KEY')
}

export function mozaikCloudBase() {
  return getKey('MOZAIK_CLOUD_BASE_URL')
}

export function mem0Key() {
  return getKey('MEM0_API_KEY')
}

export function nvidiaNimKey() {
  return getKey('NVIDIA_API_KEY', 'NVIDIA_NIM_API_KEY', 'NGC_API_KEY')
}

export function registerKeyHandlers() {
  try {
    loadEnvFiles()
  } catch {}
  ipcMain.handle('keys:set', (_e, next: Record<string, string>) => {
    setOverlayKeys(next || {})
    const or = openRouterKey()
    if (or) {
      process.env.OPENROUTER_API_KEY = or
      if (isPlaceholder(process.env.OPENAI_API_KEY || '')) process.env.OPENAI_API_KEY = or
    }
    const cloud = mozaikCloudKey()
    if (cloud) process.env.MOZAIK_CLOUD_API_KEY = cloud
    const cloudBase = mozaikCloudBase()
    if (cloudBase) process.env.MOZAIK_CLOUD_BASE_URL = cloudBase
    const mem = mem0Key()
    if (mem) process.env.MEM0_API_KEY = mem
    const nim = nvidiaNimKey()
    if (nim) process.env.NVIDIA_API_KEY = nim
    return {
      ok: true,
      openrouter: Boolean(openRouterKey()),
      nim: Boolean(nvidiaNimKey()),
      mozaikCloud: Boolean(mozaikCloudKey() && mozaikCloudBase()),
      mem0: Boolean(mem0Key()),
    }
  })
  ipcMain.handle('keys:status', () => ({
    ok: true,
    openrouter: Boolean(openRouterKey()),
    nim: Boolean(nvidiaNimKey()),
    mem0: Boolean(mem0Key()),
    cloudBase: mozaikCloudBase() || '',
  }))
}
