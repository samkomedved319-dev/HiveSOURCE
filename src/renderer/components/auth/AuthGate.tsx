import React, { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { WEB_APP_URL } from '../../lib/supabase'

export default function AuthGate() {
  const { signIn, signUp, loading, error, info, waitlistWaiting } = useAuthStore()
  const [tab, setTab] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (tab === 'in') await signIn(email.trim(), password)
    else await signUp(email.trim(), password, name.trim())
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--panel-2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '11px 14px',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
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
          width: 380,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" style={{ color: 'var(--accent)' }}>
            <path d="M16 3.4 28.2 10.3v11.4L16 28.6 3.8 21.7V10.3L16 3.4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M16 10.6 22.4 14.2v7.2L16 24.9 9.6 21.4v-7.2L16 10.6Z" fill="currentColor" />
          </svg>
          <div style={{ fontSize: 16, fontWeight: 650 }}>Hive</div>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.5, margin: '0 0 18px' }}>
          Sign in with the same account as the Hive website. New accounts join the waitlist.
        </p>
        <div style={{ display: 'flex', gap: 16, marginBottom: 18, fontSize: 14, fontWeight: 600 }}>
          <button
            type="button"
            onClick={() => setTab('in')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === 'in' ? '2px solid var(--accent)' : '2px solid transparent',
              paddingBottom: 6,
              color: tab === 'in' ? 'var(--text)' : 'var(--text-faint)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 600,
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setTab('up')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === 'up' ? '2px solid var(--accent)' : '2px solid transparent',
              paddingBottom: 6,
              color: tab === 'up' ? 'var(--text)' : 'var(--text-faint)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 600,
            }}
          >
            Create account
          </button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tab === 'up' && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" style={inputStyle} />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email" style={inputStyle} />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={6}
            placeholder={tab === 'up' ? 'Password (6+ chars)' : 'Password'}
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              background: 'var(--accent)',
              color: 'var(--accent-fg)',
              border: 'none',
              borderRadius: 10,
              padding: '11px 14px',
              fontWeight: 650,
              cursor: 'pointer',
              fontFamily: 'inherit',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Working…' : tab === 'in' ? 'Sign in' : 'Join waitlist'}
          </button>
        </form>
        {error && <p style={{ color: '#F04438', fontSize: 13, marginTop: 12 }}>{error}</p>}
        {info && <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 12 }}>{info}</p>}
        <p style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>
          {waitlistWaiting === 1 ? '1 person is on the waitlist' : `${waitlistWaiting} people are on the waitlist`}
          {' · '}
          <a href={WEB_APP_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
            hive website
          </a>
        </p>
      </div>
    </div>
  )
}
