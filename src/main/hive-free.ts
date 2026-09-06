import fs from 'fs'
import path from 'path'
import { app, ipcMain } from 'electron'

/** Hive-hosted TokenRouter key — Fast/Auto free models. */
export const HIVE_FREE_KEY = 'sk-NwtPUPnpuq8v7VW1PgPejUV6R7ykLl3netGXIANWhKQdHS0R'

export const TOKENROUTER_BASES = ['https://tokenrouter.me/v1', 'https://api.tokenrouter.io/v1']

export const FREE_GLM = 'z-ai/glm-5.3-free'
export const FREE_NEMOTRON = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'

export const HIVE_FREE_MODELS = [FREE_GLM, FREE_NEMOTRON]

export const DAILY_TOKEN_LIMIT = 1_000_000
const WINDOW_MS = 24 * 60 * 60 * 1000

type QuotaFile = { startedAt: number; used: number }

function quotaPath() {
  return path.join(app.getPath('userData'), 'hive-free-quota.json')
}

function readQuota(): QuotaFile {
  try {
    const raw = fs.readFileSync(quotaPath(), 'utf8')
    const j = JSON.parse(raw) as QuotaFile
    if (typeof j.startedAt === 'number' && typeof j.used === 'number') return j
  } catch {}
  return { startedAt: 0, used: 0 }
}

function writeQuota(q: QuotaFile) {
  try {
    fs.writeFileSync(quotaPath(), JSON.stringify(q), 'utf8')
  } catch {}
}

function activeQuota(): QuotaFile {
  const q = readQuota()
  if (q.startedAt && Date.now() - q.startedAt >= WINDOW_MS) {
    const next = { startedAt: 0, used: 0 }
    writeQuota(next)
    return next
  }
  return q
}

export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4))
}

export function quotaStatus() {
  const q = activeQuota()
  const remaining = Math.max(0, DAILY_TOKEN_LIMIT - q.used)
  const resetsAt = q.startedAt ? q.startedAt + WINDOW_MS : 0
  return {
    ok: true,
    used: q.used,
    limit: DAILY_TOKEN_LIMIT,
    remaining,
    startedAt: q.startedAt,
    resetsAt,
    models: HIVE_FREE_MODELS,
  }
}

export function assertFreeQuota(est: number): { ok: true } | { ok: false; error: string } {
  let q = activeQuota()
  if (!q.startedAt) {
    q = { startedAt: Date.now(), used: 0 }
    writeQuota(q)
  }
  if (q.used + est > DAILY_TOKEN_LIMIT) {
    const when = new Date(q.startedAt + WINDOW_MS).toLocaleString()
    return {
      ok: false,
      error: `Hive Free daily limit reached (1,000,000 tokens). It resets 24 hours after your first AI message — next window ${when}.`,
    }
  }
  return { ok: true }
}

export function consumeFreeQuota(tokens: number) {
  const q = activeQuota()
  const now = Date.now()
  const next: QuotaFile = {
    startedAt: q.startedAt || now,
    used: q.used + Math.max(0, Math.floor(tokens)),
  }
  writeQuota(next)
  return next
}

export function registerQuotaHandlers() {
  ipcMain.handle('quota:status', () => quotaStatus())
}
