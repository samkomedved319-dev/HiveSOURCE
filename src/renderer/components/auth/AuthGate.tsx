import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { WEB_APP_URL } from '../../lib/supabase'

export default function AuthGate() {
  const waitlistWaiting = useAuthStore((s) => s.waitlistWaiting)
  const error = useAuthStore((s) => s.error)
  const info = useAuthStore((s) => s.info)
  const [waiting, setWaiting] = useState(false)

  useEffect(() => {
    const off = window.electronAPI?.auth?.onSession?.((tokens) => {
      void useAuthStore.getState().acceptSession(tokens.access_token, tokens.refresh_token)
    })
    return () => {
      try {
        off?.()
      } catch {}
    }
  }, [])

  const openWeb = () => {
    setWaiting(true)
    try {
      window.electronAPI?.auth?.openWebLogin?.()
    } catch {
      window.open(`${WEB_APP_URL}/?desktop=1`, '_blank')
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 400,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 32,
          textAlign: 'center',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none" style={{ color: 'var(--accent)', marginBottom: 12 }}>
          <path d="M16 3.4 28.2 10.3v11.4L16 28.6 3.8 21.7V10.3L16 3.4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M16 10.6 22.4 14.2v7.2L16 24.9 9.6 21.4v-7.2L16 10.6Z" fill="currentColor" />
        </svg>
        <div style={{ fontSize: 18, fontWeight: 650, marginBottom: 8 }}>Sign in to Hive</div>
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5, lineHeight: 1.55, margin: '0 0 22px' }}>
          Login happens on the Hive website — same account, same waitlist. Your browser will send you back here when you’re in.
        </p>
        <button
          type="button"
          onClick={openWeb}
          style={{
            width: '100%',
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            border: 'none',
            borderRadius: 10,
            padding: '12px 16px',
            fontWeight: 650,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {waiting ? 'Waiting for website…' : 'Continue in browser'}
        </button>
        {waiting && (
          <p style={{ color: 'var(--text-faint)', fontSize: 12.5, marginTop: 14, lineHeight: 1.5 }}>
            Sign in on the page that opened. This window unlocks automatically.
          </p>
        )}
        {error && <p style={{ color: '#F04438', fontSize: 13, marginTop: 12 }}>{error}</p>}
        {info && <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 12 }}>{info}</p>}
        <p style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 18 }}>
          {waitlistWaiting === 1 ? '1 person is on the waitlist' : `${waitlistWaiting} people are on the waitlist`}
        </p>
      </div>
    </div>
  )
}
