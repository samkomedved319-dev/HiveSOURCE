import React, { useRef } from 'react'

interface ToolsModalProps {
  onClose: () => void
  onSelectAction: (action: 'code' | 'clear' | 'voice' | 'telegram') => void
}

export default function ToolsModal({ onClose, onSelectAction }: ToolsModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '18px 20px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Hive Quick Tools</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              onSelectAction('code')
              onClose()
            }}
            style={{
              background: 'var(--panel-2)',
              border: '1px solid var(--border-soft)',
              borderRadius: 8,
              padding: '12px',
              textAlign: 'left',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
              ⚡ Open Code Canvas
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
              Inspect generated code artifacts or design tokens
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectAction('voice')
              onClose()
            }}
            style={{
              background: 'var(--panel-2)',
              border: '1px solid var(--border-soft)',
              borderRadius: 8,
              padding: '12px',
              textAlign: 'left',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#38bdf8' }}>
              🎙️ Start Live Voice Call
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
              Connect computer mic or ring your Telegram phone
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectAction('clear')
              onClose()
            }}
            style={{
              background: 'var(--panel-2)',
              border: '1px solid var(--border-soft)',
              borderRadius: 8,
              padding: '12px',
              textAlign: 'left',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f87171' }}>
              🗑️ Clear Conversation History
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
              Wipe all messages in current chat session
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
