import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { isHiveOwner } from '../../lib/admin'
import { useAuthStore } from '../../stores/authStore'

type ProfileRow = {
  id: string
  email: string | null
  display_name: string | null
  status: string
  is_admin?: boolean
  created_at: string
}

type QuotaRow = {
  user_id: string
  email: string | null
  used: number
  token_limit: number
  bonus: number
  reset_at: string | null
  updated_at: string | null
}

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const allowed = isHiveOwner(user?.email, profile)
  const [q, setQ] = useState('')
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [quotas, setQuotas] = useState<Record<string, QuotaRow>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  const load = async () => {
    setErr('')
    const [p, u] = await Promise.all([
      supabase.from('profiles').select('id,email,display_name,status,is_admin,created_at').order('created_at', { ascending: false }).limit(400),
      supabase.from('usage_quotas').select('*').limit(400),
    ])
    if (p.error) setErr(p.error.message)
    setProfiles((p.data as ProfileRow[]) || [])
    const map: Record<string, QuotaRow> = {}
    for (const row of (u.data as QuotaRow[]) || []) map[row.user_id] = row
    setQuotas(map)
  }

  useEffect(() => {
    if (allowed) void load()
  }, [allowed])

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return profiles
    return profiles.filter(
      (p) =>
        (p.email || '').toLowerCase().includes(n) ||
        (p.display_name || '').toLowerCase().includes(n)
    )
  }, [profiles, q])

  const flash = (msg: string) => {
    setNote(msg)
    window.setTimeout(() => setNote(''), 2200)
  }

  const resetUser = async (row: ProfileRow, extraBonus = 0, extraLimit?: number) => {
    setBusy(row.id)
    const prev = quotas[row.id]
    const { error } = await supabase.from('usage_quotas').upsert({
      user_id: row.id,
      email: row.email,
      used: 0,
      token_limit: extraLimit || prev?.token_limit || 1_000_000,
      bonus: extraBonus,
      started_at: null,
      reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setBusy(null)
    if (error) {
      setErr(error.message)
      return
    }
    flash(`Reset ${row.email || row.display_name}`)
    await load()
  }

  const grantBonus = async (row: ProfileRow, add: number) => {
    setBusy(row.id)
    const prev = quotas[row.id]
    const { error } = await supabase.from('usage_quotas').upsert({
      user_id: row.id,
      email: row.email,
      used: prev?.used || 0,
      token_limit: prev?.token_limit || 1_000_000,
      bonus: (prev?.bonus || 0) + add,
      started_at: prev ? undefined : null,
      reset_at: prev?.reset_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setBusy(null)
    if (error) {
      setErr(error.message)
      return
    }
    flash(`+${add.toLocaleString()} tokens for ${row.email}`)
    await load()
  }

  const setStatus = async (row: ProfileRow, status: string) => {
    setBusy(row.id)
    const { error } = await supabase.from('profiles').update({ status }).eq('id', row.id)
    setBusy(null)
    if (error) setErr(error.message)
    else {
      flash(`${row.email} → ${status}`)
      await load()
    }
  }

  if (!allowed) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(0,0,0,0.62)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 860,
          maxWidth: '100%',
          maxHeight: '88vh',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 90px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ padding: '18px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--accent)', textTransform: 'uppercase' }}>
              Owner only
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Hive Admin</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 18 }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '0 20px 12px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Stat label="Accounts" value={String(profiles.length)} />
          <Stat label="Approved" value={String(profiles.filter((p) => p.status === 'approved').length)} />
          <Stat
            label="Tokens used"
            value={Object.values(quotas)
              .reduce((s, r) => s + (r.used || 0), 0)
              .toLocaleString()}
          />
        </div>
        <div style={{ padding: '0 20px 12px' }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search email or name"
            style={{
              width: '100%',
              background: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '10px 12px',
              color: 'var(--text)',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {(note || err) && (
            <div style={{ marginTop: 8, fontSize: 12, color: err ? '#f87171' : 'var(--accent)' }}>{err || note}</div>
          )}
        </div>
        <div style={{ overflow: 'auto', padding: '0 12px 16px', minHeight: 0 }}>
          {rows.map((row) => {
            const qu = quotas[row.id]
            const used = qu?.used || 0
            const limit = (qu?.token_limit || 1_000_000) + (qu?.bonus || 0)
            return (
              <div
                key={row.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 0.7fr 0.9fr auto',
                  gap: 10,
                  alignItems: 'center',
                  padding: '10px 8px',
                  borderBottom: '1px solid var(--border-soft)',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{row.display_name || '—'}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{row.email}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{row.status}{row.is_admin ? ' · admin' : ''}</div>
                <div style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                  {used.toLocaleString()} / {limit.toLocaleString()}
                  {qu?.bonus ? <span style={{ color: 'var(--accent)', marginLeft: 6 }}>+{qu.bonus.toLocaleString()}</span> : null}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <MiniBtn disabled={busy === row.id} onClick={() => resetUser(row)}>
                    Reset
                  </MiniBtn>
                  <MiniBtn disabled={busy === row.id} onClick={() => grantBonus(row, 100_000)}>
                    +100k
                  </MiniBtn>
                  <MiniBtn disabled={busy === row.id} onClick={() => resetUser(row, 0, 5_000_000)}>
                    5M day
                  </MiniBtn>
                  {row.status !== 'approved' && (
                    <MiniBtn disabled={busy === row.id} onClick={() => setStatus(row, 'approved')}>
                      Approve
                    </MiniBtn>
                  )}
                  {row.status !== 'denied' && (
                    <MiniBtn danger disabled={busy === row.id} onClick={() => setStatus(row, 'denied')}>
                      Deny
                    </MiniBtn>
                  )}
                </div>
              </div>
            )
          })}
          {rows.length === 0 && (
            <div style={{ padding: 24, color: 'var(--text-faint)', fontSize: 13 }}>
              {err ? 'Could not load accounts. Run the quota SQL in Supabase first.' : 'No accounts match.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', minWidth: 120 }}>
      <div style={{ fontSize: 10.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function MiniBtn({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: danger ? 'rgba(239,68,68,0.1)' : 'var(--panel-2)',
        border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
        color: danger ? '#f87171' : 'var(--text)',
        borderRadius: 8,
        padding: '5px 8px',
        fontSize: 11,
        cursor: disabled ? 'wait' : 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}
