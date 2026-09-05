import React, { useState } from 'react'

interface ProfileModalProps {
  onClose: () => void
  userInitial?: string
}

export default function ProfileModal({ onClose, userInitial = 'A' }: ProfileModalProps) {
  const [name, setName] = useState(localStorage.getItem('hive_user_name') || 'Samko Medved')
  const [handle, setHandle] = useState(localStorage.getItem('hive_user_handle') || '@samko')
  const [role, setRole] = useState(localStorage.getItem('hive_user_role') || 'Lead AI Engineer')
  const [status, setStatus] = useState(localStorage.getItem('hive_user_status') || 'Building autonomous systems')
  const [tier, setTier] = useState(localStorage.getItem('hive_user_tier') || 'Pro Developer')
  const [toast, setToast] = useState<string | null>(null)

  const handleSave = () => {
    localStorage.setItem('hive_user_name', name.trim())
    localStorage.setItem('hive_user_handle', handle.trim())
    localStorage.setItem('hive_user_role', role.trim())
    localStorage.setItem('hive_user_status', status.trim())
    localStorage.setItem('hive_user_tier', tier)
    setToast('Profile updated')
    setTimeout(() => {
      setToast(null)
      onClose()
    }, 450)
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
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>User Profile & Identity</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              fontSize: 14,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Avatar Profile Card */}
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
              boxShadow: '0 4px 14px rgba(242, 193, 78, 0.25)',
            }}
          >
            {name ? name.charAt(0).toUpperCase() : userInitial}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 500 }}>{handle} · {tier}</div>
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11.5, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
              Full Display Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
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

          <div>
            <label style={{ fontSize: 11.5, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
              Handle
            </label>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--panel-2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '7px 10px',
                color: 'var(--text)',
                fontSize: 12.5,
                outline: 'none',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11.5, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
              Role / Title
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
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

          <div>
            <label style={{ fontSize: 11.5, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
              Status Bio
            </label>
            <input
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="What are you working on?"
              style={{
                width: '100%',
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
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
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
            onClick={handleSave}
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
            Save Profile
          </button>
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
              pointerEvents: 'none',
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
