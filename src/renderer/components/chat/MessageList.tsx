import React, { useEffect, useRef } from 'react'
import MessageItem from './MessageItem'
import TypingIndicator from './TypingIndicator'
import BloubEngineAvatar from '../mascot/BloubEngineAvatar'
import { getEngineState, type HiveActivityState } from '../mascot/engineStateKit'
import { useBuddyColor } from '../mascot/CursorBuddy'
import { useChatStore } from '../../stores/chatStore'
import { useAgentStore } from '../../stores/agentStore'

export default function MessageList({
  typingLabel = 'Thinking\u2026',
  mascotState = 'idle',
  onSuggest,
}: {
  typingLabel?: string
  mascotState?: HiveActivityState
  onSuggest?: (text: string) => void
}) {
  const { activeAgent } = useAgentStore()
  const { getMessages, isTyping } = useChatStore()
  const buddyInk = useBuddyColor()
  const endRef = useRef<HTMLDivElement>(null)
  const messages = activeAgent ? getMessages(activeAgent.id) : []
  const visible = messages.slice(-60)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
  }, [messages.length, isTyping])

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        overflowAnchor: 'none',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          minHeight: '100%',
          margin: '0 auto',
          padding: '24px 20px 40px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {messages.length === 0 && !isTyping ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1,
              minHeight: '100%',
              padding: '24px 14px',
              borderBottom: '1px solid var(--border-soft)',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(242, 193, 78, 0.15)',
                border: '1px solid rgba(242, 193, 78, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <BloubEngineAvatar size={44} crop={122} follow botState={getEngineState(mascotState)} ink={buddyInk} fps={60} />
            </div>

            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text)',
                margin: '0 0 6px 0',
                letterSpacing: '-0.02em',
              }}
            >
              What can Hive do for you?
            </h1>

            <p
              style={{
                fontSize: 13.5,
                color: 'var(--text-dim)',
                lineHeight: 1.6,
                margin: '0 0 14px 0',
                maxWidth: 620,
              }}
            >
              Scout, Hive, and Pulse think at the same time. Critic reviews the draft. Ctrl+K for commands.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { icon: '\u2b21', label: 'Hackathon demo', prompt: 'What is the JigJoy Mozaik hackathon deadline and main rule?' },
                { icon: '\ud83d\udd0d', label: 'Research the web', prompt: 'Search the web for the latest AI news and cite your sources' },
                { icon: '\u26a1', label: 'Write code', prompt: 'Write a TypeScript function that debounces user input, with a usage example' },
                { icon: '\ud83d\uddb1\ufe0f', label: 'Control my PC', prompt: 'Take control: open Notepad on my PC' },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => onSuggest?.(s.prompt)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    background: 'var(--panel)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 18,
                    padding: '7px 14px',
                    fontSize: 12.5,
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'border-color .15s, background .15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)'
                    e.currentTarget.style.background = 'var(--panel-2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-soft)'
                    e.currentTarget.style.background = 'var(--panel)'
                  }}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {visible.map((m, idx) => (
              <MessageItem key={m.id} message={m} index={idx} />
            ))}
            {isTyping && (
              <div style={{ paddingLeft: 46 }}>
                <TypingIndicator label={typingLabel} />
              </div>
            )}
          </>
        )}
        <div ref={endRef} />
      </div>
    </div>
  )
}
