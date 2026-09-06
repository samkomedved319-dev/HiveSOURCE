import React from 'react'
import { HIVE_VERSION, LOCAL_WHATS_NEW, type ReleaseNote } from '../../hiveVersion'

export default function WhatsNewModal({
  version,
  notes,
  onClose,
}: {
  version?: string
  notes?: ReleaseNote[]
  onClose: () => void
}) {
  const list = notes && notes.length ? notes : LOCAL_WHATS_NEW
  const ver = version || HIVE_VERSION
  const label = (t: ReleaseNote['type']) => (t === 'new' ? 'New' : t === 'fix' ? 'Fix' : 'Polish')
  const color = (t: ReleaseNote['type']) =>
    t === 'new' ? 'var(--accent)' : t === 'fix' ? '#7ec8ff' : '#c4b5a0'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440,
          maxWidth: '100%',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{ padding: '22px 24px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="./icon.png" alt="" style={{ width: 36, height: 36, borderRadius: 10 }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 650 }}>What’s New</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>Hive {ver}</div>
          </div>
        </div>
        <div style={{ padding: '8px 24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  color: color(n.type),
                  background: 'var(--panel-2)',
                  borderRadius: 6,
                  padding: '3px 6px',
                  marginTop: 1,
                  flexShrink: 0,
                }}
              >
                {label(n.type)}
              </span>
              <div style={{ fontSize: 13.5, lineHeight: 1.45, color: 'var(--text)' }}>{n.text}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 24px 20px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              background: 'var(--accent)',
              color: 'var(--accent-fg)',
              border: 'none',
              borderRadius: 10,
              padding: '11px 16px',
              fontWeight: 650,
              fontSize: 13.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
