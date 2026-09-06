import fs from 'fs'
import path from 'path'
import { app, ipcMain } from 'electron'

/** Hive-hosted TokenRouter key — GLM 5.3 only. Nemotron has $0 credits. */
export const HIVE_FREE_KEY = 'sk-NwtPUPnpuq8v7VW1PgPejUV6R7ykLl3netGXIANWhKQdHS0R'

/** Live TokenRouter host. tokenrouter.me has no DNS; api.tokenrouter.io wants tr_ keys. */
export const TOKENROUTER_BASES = ['https://api.tokenrouter.com/v1']

export const FREE_GLM = 'z-ai/glm-5.3-free'
/** Kept for migration of saved hive_model values. Never called. */
export const FREE_NEMOTRON = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'

export const HIVE_FREE_MODELS = [FREE_GLM]

export const DAILY_TOKEN_LIMIT = 1_000_000
const WINDOW_MS = 24 * 60 * 60 * 1000
const ANON = '__anon__'

type QuotaFile = {
  startedAt: number
  used: number
  bonus?: number
  limit?: number
  remoteResetAt?: number
}

type Store = {
  currentUserId: string
  byUser: Record<string, QuotaFile>
}

function quotaPath() {
  return path.join(app.getPath('userData'), 'hive-free-quota.json')
}

function emptyQ(): QuotaFile {
  return { startedAt: 0, used: 0, bonus: 0, limit: DAILY_TOKEN_LIMIT, remoteResetAt: 0 }
}

function readStore(): Store {
  try {
    const raw = fs.readFileSync(quotaPath(), 'utf8')
    const j = JSON.parse(raw) as Store & QuotaFile
    if (j && j.byUser && typeof j.byUser === 'object') {
      return {
        currentUserId: j.currentUserId || ANON,
        byUser: j.byUser,
      }
    }
    if (typeof (j as QuotaFile).used === 'number') {
      const legacy: QuotaFile = {
        startedAt: Number((j as QuotaFile).startedAt) || 0,
        used: Number((j as QuotaFile).used) || 0,
        bonus: Number((j as QuotaFile).bonus) || 0,
        limit: Number((j as QuotaFile).limit) || DAILY_TOKEN_LIMIT,
        remoteResetAt: Number((j as QuotaFile).remoteResetAt) || 0,
      }
      return { currentUserId: ANON, byUser: { [ANON]: legacy } }
    }
  } catch {}
  return { currentUserId: ANON, byUser: {} }
}

function writeStore(s: Store) {
  try {
    fs.writeFileSync(quotaPath(), JSON.stringify(s), 'utf8')
  } catch {}
}

function uid() {
  return readStore().currentUserId || ANON
}

function readQuota(): QuotaFile {
  const s = readStore()
  const id = s.currentUserId || ANON
  return s.byUser[id] || emptyQ()
}

function writeQuota(q: QuotaFile) {
  const s = readStore()
  const id = s.currentUserId || ANON
  s.byUser[id] = q
  writeStore(s)
}

export function bindQuotaUser(userId: string) {
  const id = (userId || '').trim() || ANON
  const s = readStore()
  const prevId = s.currentUserId || ANON
  if (id !== ANON && prevId === ANON && s.byUser[ANON] && !s.byUser[id]) {
    s.byUser[id] = { ...s.byUser[ANON] }
  } else if (id !== ANON && prevId === ANON && s.byUser[ANON] && s.byUser[id]) {
    const a = s.byUser[ANON]
    const b = s.byUser[id]
    s.byUser[id] = {
      startedAt: b.startedAt || a.startedAt || 0,
      used: Math.max(a.used || 0, b.used || 0),
      bonus: Math.max(a.bonus || 0, b.bonus || 0),
      limit: Math.max(a.limit || 0, b.limit || 0, DAILY_TOKEN_LIMIT),
      remoteResetAt: Math.max(a.remoteResetAt || 0, b.remoteResetAt || 0),
    }
  }
  s.currentUserId = id
  writeStore(s)
  return quotaStatus()
}

function effectiveLimit(q: QuotaFile) {
  return Math.max(1, (q.limit || DAILY_TOKEN_LIMIT) + (q.bonus || 0))
}

function activeQuota(): QuotaFile {
  const q = readQuota()
  if (q.startedAt && Date.now() - q.startedAt >= WINDOW_MS) {
    const next: QuotaFile = {
      startedAt: 0,
      used: 0,
      bonus: q.bonus || 0,
      limit: q.limit || DAILY_TOKEN_LIMIT,
      remoteResetAt: q.remoteResetAt,
    }
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
  const limit = effectiveLimit(q)
  const remaining = Math.max(0, limit - q.used)
  const resetsAt = q.startedAt ? q.startedAt + WINDOW_MS : 0
  return {
    ok: true,
    used: q.used,
    limit,
    bonus: q.bonus || 0,
    remaining,
    startedAt: q.startedAt,
    resetsAt,
    remoteResetAt: q.remoteResetAt || 0,
    userId: uid(),
    models: HIVE_FREE_MODELS,
  }
}

export function assertFreeQuota(est: number): { ok: true } | { ok: false; error: string } {
  let q = activeQuota()
  if (!q.startedAt) {
    q = { ...q, startedAt: Date.now(), used: q.used || 0 }
    writeQuota(q)
  }
  const limit = effectiveLimit(q)
  if (q.used + est > limit) {
    const when = new Date(q.startedAt + WINDOW_MS).toLocaleString()
    return {
      ok: false,
      error: `Hive Free daily limit reached (${limit.toLocaleString()} tokens). It resets 24 hours after your first AI message — next window ${when}. Or paste your own OpenRouter / OpenAI / Anthropic key in Settings → Models.`,
    }
  }
  return { ok: true }
}

export function consumeFreeQuota(tokens: number) {
  const q = activeQuota()
  const now = Date.now()
  const next: QuotaFile = {
    ...q,
    startedAt: q.startedAt || now,
    used: q.used + Math.max(0, Math.floor(tokens)),
  }
  writeQuota(next)
  return next
}

export function resetQuota(keepBonus = false) {
  const q = readQuota()
  writeQuota({
    startedAt: 0,
    used: 0,
    bonus: keepBonus ? q.bonus || 0 : 0,
    limit: q.limit || DAILY_TOKEN_LIMIT,
    remoteResetAt: Date.now(),
  })
  return quotaStatus()
}

export function applyRemoteQuota(p: {
  used?: number
  bonus?: number
  limit?: number
  startedAt?: number
  remoteResetAt?: number
  reset?: boolean
}) {
  const q = readQuota()
  const remoteReset = p.remoteResetAt || 0
  const shouldReset = Boolean(p.reset) && remoteReset > 0 && remoteReset > (q.remoteResetAt || 0)
  if (shouldReset) {
    writeQuota({
      startedAt: 0,
      used: 0,
      bonus: p.bonus ?? q.bonus ?? 0,
      limit: p.limit || q.limit || DAILY_TOKEN_LIMIT,
      remoteResetAt: remoteReset,
    })
    return quotaStatus()
  }
  writeQuota({
    startedAt: q.startedAt || p.startedAt || 0,
    used: Math.max(q.used || 0, p.used || 0),
    bonus: p.bonus ?? q.bonus ?? 0,
    limit: p.limit || q.limit || DAILY_TOKEN_LIMIT,
    remoteResetAt: Math.max(q.remoteResetAt || 0, remoteReset),
  })
  return quotaStatus()
}

export function registerQuotaHandlers() {
  ipcMain.handle('quota:status', () => quotaStatus())
  ipcMain.handle('quota:reset', (_e, keepBonus?: boolean) => resetQuota(Boolean(keepBonus)))
  ipcMain.handle('quota:apply', (_e, payload?: Parameters<typeof applyRemoteQuota>[0]) =>
    applyRemoteQuota(payload || {})
  )
  ipcMain.handle('quota:bindUser', (_e, userId?: string) => bindQuotaUser(String(userId || '')))
}
