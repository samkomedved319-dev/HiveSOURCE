import { supabase } from './supabase'

export type QuotaView = {
  ok: boolean
  used: number
  limit: number
  bonus?: number
  remaining: number
  startedAt: number
  resetsAt: number
  remoteResetAt?: number
}

export async function syncQuotaWithCloud(userId: string, email: string): Promise<QuotaView | null> {
  const api = window.electronAPI?.app
  if (!api?.quota) return null
  try {
    await api.quotaBindUser?.(userId)
    const local = (await api.quota()) as QuotaView
    const { data } = await supabase.from('usage_quotas').select('*').eq('user_id', userId).maybeSingle()
    const row = data as {
      used?: number
      token_limit?: number
      bonus?: number
      started_at?: string | null
      reset_at?: string | null
    } | null

    const cloudUsed = Number(row?.used || 0)
    const cloudLimit = Number(row?.token_limit || 0)
    const cloudBonus = Number(row?.bonus || 0)
    const cloudStarted = row?.started_at ? new Date(row.started_at).getTime() : 0
    const adminResetMs = row?.reset_at ? new Date(row.reset_at).getTime() : 0
    const already = local.remoteResetAt || 0

    if (adminResetMs > 0 && adminResetMs > already && api.quotaApply) {
      await api.quotaApply({
        reset: true,
        bonus: cloudBonus,
        limit: cloudLimit || 1_000_000,
        remoteResetAt: adminResetMs,
      })
    } else if (api.quotaApply) {
      await api.quotaApply({
        reset: false,
        used: Math.max(local.used || 0, cloudUsed),
        bonus: Math.max(local.bonus || 0, cloudBonus),
        limit: cloudLimit || local.limit || 1_000_000,
        startedAt: local.startedAt || cloudStarted || 0,
        remoteResetAt: Math.max(already, adminResetMs),
      })
    }

    const next = (await api.quota()) as QuotaView
    const payload = {
      user_id: userId,
      email,
      used: next.used,
      token_limit: Math.max(1, (next.limit || 1_000_000) - (next.bonus || 0)),
      bonus: next.bonus || 0,
      started_at: next.startedAt ? new Date(next.startedAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    }
    if (cloudUsed > 0 && next.used < cloudUsed && !(adminResetMs > already)) {
      payload.used = cloudUsed
    }
    await supabase.from('usage_quotas').upsert(payload)
    return next
  } catch {
    try {
      return (await api.quota()) as QuotaView
    } catch {
      return null
    }
  }
}
