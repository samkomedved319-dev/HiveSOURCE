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
    const local = (await api.quota()) as QuotaView
    const { data } = await supabase.from('usage_quotas').select('*').eq('user_id', userId).maybeSingle()
    const row = data as {
      used?: number
      token_limit?: number
      bonus?: number
      started_at?: string | null
      reset_at?: string | null
    } | null

    if (row?.reset_at && api.quotaApply) {
      const resetMs = new Date(row.reset_at).getTime()
      if (resetMs > (local.remoteResetAt || local.startedAt || 0)) {
        await api.quotaApply({
          reset: true,
          bonus: row.bonus || 0,
          limit: row.token_limit || 1_000_000,
          remoteResetAt: resetMs,
        })
      } else if (typeof row.bonus === 'number' || typeof row.token_limit === 'number') {
        await api.quotaApply({
          bonus: row.bonus || 0,
          limit: row.token_limit || 1_000_000,
        })
      }
    }

    const next = (await api.quota()) as QuotaView
    await supabase.from('usage_quotas').upsert({
      user_id: userId,
      email,
      used: next.used,
      token_limit: Math.max(1, (next.limit || 1_000_000) - (next.bonus || 0)),
      bonus: next.bonus || 0,
      started_at: next.startedAt ? new Date(next.startedAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    return next
  } catch {
    try {
      return (await api.quota()) as QuotaView
    } catch {
      return null
    }
  }
}
