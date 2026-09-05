import React from 'react'
import BloubEngineAvatar from '../mascot/BloubEngineAvatar'
import { useBuddyColor } from '../mascot/CursorBuddy'

interface TypingIndicatorProps {
  label?: string
}

export default function TypingIndicator({ label = 'Thinking…' }: TypingIndicatorProps) {
  const buddyInk = useBuddyColor()
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        marginBottom: 28,
      }}
    >
      {/* Hive house avatar while generating */}
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          flexShrink: 0,
          marginTop: 2,
          background: 'var(--panel-2)',
          border: '1px solid var(--border-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <BloubEngineAvatar size={22} crop={120} botState="thinking" ink={buddyInk} fps={60} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginTop: 4,
        }}
      >
        {/* Hexagon outline loader */}
        <div
          style={{
            width: 16,
            height: 16,
            position: 'relative',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            style={{
              width: '100%',
              height: '100%',
              animation: 'spin 2.2s linear infinite',
            }}
          >
            <path
              d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
              stroke="var(--accent)"
              strokeWidth="1.8"
              strokeDasharray="8 4"
            />
          </svg>
        </div>

        {/* Pulsing text */}
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-faint)',
          }}
        >
          <span
            style={{
              animation: 'pulse 1.4s ease-in-out infinite',
              display: 'inline-block',
            }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}