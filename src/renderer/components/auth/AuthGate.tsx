import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { WEB_APP_URL } from '../../lib/supabase'

export default function AuthGate() {
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
        <img
          src="./logo.png"
          alt="Hive"
          style={{ width: 42, height: 42, marginBottom: 12, objectFit: 'contain' }}
        />
        <div style={{ fontSize: 18, fontWeight: 650, marginBottom: 8 }}>Sign in to Hive</div>
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5, lineHeight: 1.55, margin: '0 0 22px' }}>
          Login happens on the Hive website. Sign in or create an account — this window unlocks when you are in.
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
      </div>
    </div>
  )
}
