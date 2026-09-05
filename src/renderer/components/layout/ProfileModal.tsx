import React, { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'

interface ProfileModalProps {
  onClose: () => void
  userInitial?: string
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'On the waitlist', color: '#F2C14E', bg: 'rgba(242,193,78,.12)' },
  approved: { label: 'Approved', color: '#10B981', bg: 'rgba(16,185,129,.12)' },
  denied: { label: 'Denied', color: '#F04438', bg: 'rgba(240,68,56,.12)' },
}

export default function ProfileModal({ onClose, userInitial = 'A' }: ProfileModalProps) {
  const { user, profile, saveProfile, signOut } = useAuthStore()
  const [name, setName] = useState(profile?.display_name || localStorage.getItem('hive_user_name') || '')
  const [toast, setToast] = useState<string | null>(null)
  const email = profile?.email || user?.email || ''
  const st = STATUS[profile?.status || 'pending']
  const initial = (name || email || userInitial).charAt(0).toUpperCase()

  const handleSave = async () => {
    const ok = await saveProfile(name.trim())
    if (ok) {
      setToast('Profile saved')
      setTimeout(() => {
        setToast(null)
        onClose()
      }, 450)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 6, 8, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 160,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '24px 26px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Hive account</div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 14 }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'var(--panel-2)',
            border: '1px solid var(--border-soft)',
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F2C14E, #C99A2E)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
              color: '#0D0E11',
            }}
          >
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{name || 'Hive member'}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{email}</div>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: st.color,
              background: st.bg,
              borderRadius: 999,
              padding: '4px 8px',
            }}
          >
            {st.label}
          </span>
        </div>

        {profile?.customer_number != null && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Member #{profile.customer_number}</div>
        )}

        <div>
          <label style={{ fontSize: 11.5, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
            Display name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '7px 10px',
              color: 'var(--text)',
              fontSize: 12.5,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => void signOut()}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 12,
              color: 'var(--text-dim)',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                color: 'var(--text-dim)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              style={{
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 6,
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 600,
                color: '#0D0E11',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
          </div>
        </div>

        {toast && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '5px 12px',
              fontSize: 11.5,
              color: 'var(--accent)',
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
