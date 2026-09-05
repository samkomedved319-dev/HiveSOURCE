import React from 'react'
import { useAuthStore } from '../../stores/authStore'

export default function DeniedScreen() {
  const signOut = useAuthStore((s) => s.signOut)
  const email = useAuthStore((s) => s.profile?.email || s.user?.email)

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
      <div style={{ width: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 650, marginBottom: 8 }}>Access denied</div>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.5 }}>
          {email ? `${email} is not approved for Hive yet.` : 'This account cannot use Hive.'}
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          style={{
            marginTop: 16,
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 16px',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
