import type { HiveProfile } from './supabase'

/** Owner accounts — the in-app Admin panel is hidden from everyone else. */
export function isHiveOwner(email?: string | null, profile?: HiveProfile | null) {
  if (profile?.is_admin) return true
  const e = (email || '').trim().toLowerCase()
  if (!e) return false
  return e.includes('samkomedved')
}
