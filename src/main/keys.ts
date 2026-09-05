import path from 'path'
import fs from 'fs'
import { app, ipcMain } from 'electron'

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require('dotenv')
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../../../.env'),
  ]
  try {
    if (app?.isReady?.()) candidates.push(path.join(app.getAppPath(), '.env'))
  } catch {}
  for (const p of candidates) {
    if (fs.existsSync(p)) dotenv.config({ path: p, override: false })
  }
  dotenv.config({ override: false })
} catch {}

const overlay: Record<string, string> = {}

export function setOverlayKeys(next: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(next)) {
    if (typeof v === 'string' && v.trim()) overlay[k] = v.trim()
    else if (v === '') delete overlay[k]
  }
}

export function getKey(...names: string[]): string {
  for (const n of names) {
    const fromOverlay = overlay[n]
    if (fromOverlay) return fromOverlay
    const fromEnv = process.env[n]
    if (fromEnv && fromEnv.trim() && !fromEnv.includes('your_') && !fromEnv.endsWith('_here')) return fromEnv.trim()
  }
  return ''
}

export function openRouterKey() {
  return getKey('OPENROUTER_API_KEY', 'OPENAI_API_KEY', 'hive_custom_api_key')
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

export function registerKeyHandlers() {
  ipcMain.handle('keys:set', (_e, next: Record<string, string>) => {
    setOverlayKeys(next || {})
    const or = openRouterKey()
    if (or) {
      process.env.OPENROUTER_API_KEY = or
      if (!process.env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = or
    }
    const cloud = mozaikCloudKey()
    if (cloud) process.env.MOZAIK_CLOUD_API_KEY = cloud
    const cloudBase = mozaikCloudBase()
    if (cloudBase) process.env.MOZAIK_CLOUD_BASE_URL = cloudBase
    const mem = mem0Key()
    if (mem) process.env.MEM0_API_KEY = mem
    return {
      ok: true,
      openrouter: Boolean(openRouterKey()),
      mozaikCloud: Boolean(mozaikCloudKey() && mozaikCloudBase()),
      mem0: Boolean(mem0Key()),
    }
  })
  ipcMain.handle('keys:status', () => ({
    ok: true,
    openrouter: Boolean(openRouterKey()),
    mozaikCloud: Boolean(mozaikCloudKey() && mozaikCloudBase()),
    mem0: Boolean(mem0Key()),
    cloudBase: mozaikCloudBase() || '',
  }))
}
