import React, { useEffect, useState } from 'react'

export type QuotaSnapshot = {
  used: number
  limit: number
  remaining: number
  bonus?: number
  startedAt: number
  resetsAt: number
}

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}k`
  return n.toLocaleString()
}

function resetLabel(resetsAt: number, startedAt: number) {
  if (!startedAt || !resetsAt) return 'Starts on your first AI message'
  const ms = resetsAt - Date.now()
  if (ms <= 0) return 'Resetting…'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h >= 1) return `Resets in ${h}h ${m}m`
  return `Resets in ${m}m`
}

export default function QuotaMeter({
  compact = false,
  quota,
}: {
  compact?: boolean
  quota?: QuotaSnapshot | null
}) {
  const [local, setLocal] = useState<QuotaSnapshot | null>(quota || null)

  useEffect(() => {
    if (quota) setLocal(quota)
  }, [quota])

  useEffect(() => {
    let alive = true
    const pull = () => {
      void window.electronAPI?.app?.quota?.().then((q) => {
        if (!alive || !q?.ok) return
        setLocal({
          used: q.used ?? 0,
          limit: q.limit ?? 1_000_000,
          remaining: q.remaining ?? 0,
          bonus: q.bonus,
          startedAt: q.startedAt ?? 0,
          resetsAt: q.resetsAt ?? 0,
        })
      })
    }
    pull()
    const t = window.setInterval(pull, compact ? 8000 : 2500)
    return () => {
      alive = false
      window.clearInterval(t)
    }
  }, [compact])

  const used = local?.used ?? 0
  const limit = local?.limit ?? 1_000_000
  const remaining = local?.remaining ?? Math.max(0, limit - used)
  const ratio = Math.max(0, Math.min(1, used / Math.max(1, limit)))
  const pct = Math.round(ratio * 100)
  const hot = ratio > 0.86
  const r = compact ? 11 : 42
  const stroke = compact ? 3 : 8
  const c = 2 * Math.PI * r
  const dash = c * ratio

  if (compact) {
    return (
      <div
        title={`${remaining.toLocaleString()} / ${limit.toLocaleString()} Hive Free tokens left`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          WebkitAppRegion: 'no-drag',
          fontFamily: 'inherit',
        }}
      >
        <svg width={26} height={26} viewBox="0 0 26 26">
          <circle cx="13" cy="13" r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
          <circle
            cx="13"
            cy="13"
            r={r}
            fill="none"
            stroke={hot ? '#f87171' : 'var(--accent)'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            transform="rotate(-90 13 13)"
            style={{ transition: 'stroke-dasharray 700ms cubic-bezier(.16,.8,.24,1)' }}
          />
        </svg>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
          {formatTokens(remaining)}
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--panel-2)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 18,
        display: 'flex',
        gap: 18,
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes hive-quota-breathe {
          0%, 100% { filter: drop-shadow(0 0 6px color-mix(in oklab, var(--accent) 30%, transparent)); }
          50% { filter: drop-shadow(0 0 14px color-mix(in oklab, var(--accent) 70%, transparent)); }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 12% 50%, color-mix(in oklab, var(--accent) ${hot ? 18 : 14}%, transparent), transparent 62%)`,
          pointerEvents: 'none',
        }}
      />
      <svg width="108" height="108" viewBox="0 0 108 108" style={{ flexShrink: 0, position: 'relative' }}>
        <circle cx="54" cy="54" r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx="54"
          cy="54"
          r={r}
          fill="none"
          stroke={hot ? '#f87171' : 'var(--accent)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 54 54)"
          style={{
            transition: 'stroke-dasharray 900ms cubic-bezier(.16,.8,.24,1)',
            filter: 'drop-shadow(0 0 8px color-mix(in oklab, var(--accent) 45%, transparent))',
            animation: 'hive-quota-breathe 2.8s ease-in-out infinite',
          }}
        />
        <text
          x="54"
          y="50"
          textAnchor="middle"
          fill="var(--text)"
          style={{ fontSize: 18, fontWeight: 700, fontFamily: 'inherit' }}
        >
          {pct}%
        </text>
        <text
          x="54"
          y="68"
          textAnchor="middle"
          fill="var(--text-faint)"
          style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.6, fontFamily: 'inherit' }}
        >
          USED
        </text>
      </svg>
      <div style={{ position: 'relative', minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--accent)', textTransform: 'uppercase' }}>
          Hive Free pool
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
          {remaining.toLocaleString()}
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dim)', marginLeft: 6 }}>left</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
          {used.toLocaleString()} / {limit.toLocaleString()} tokens
          {(local?.bonus || 0) > 0 ? ` · +${(local?.bonus || 0).toLocaleString()} bonus` : ''}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 6 }}>{resetLabel(local?.resetsAt || 0, local?.startedAt || 0)}</div>
      </div>
    </div>
  )
}
