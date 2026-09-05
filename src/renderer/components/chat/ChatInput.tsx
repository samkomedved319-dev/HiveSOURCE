import React, { useRef, useEffect } from 'react'
import { mentionHandle } from '../bots/botLibrary'

interface Mentionable {
  id: string
  name: string
}

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  onAttach?: (file: File) => void
  onOpenTools?: () => void
  onOpenVoice?: () => void
  mentionables?: Mentionable[]
}

export default function ChatInput({
  onSend,
  disabled,
  onAttach,
  onOpenTools,
  onOpenVoice,
  mentionables = [],
}: ChatInputProps) {
  const [msg, setMsg] = React.useState('')
  const [mentionOpen, setMentionOpen] = React.useState(false)
  const [mentionQ, setMentionQ] = React.useState('')
  const [mentionIdx, setMentionIdx] = React.useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = mentionables.filter((m) => {
    const h = mentionHandle(m.name).toLowerCase()
    return h.startsWith(mentionQ.toLowerCase()) || m.name.toLowerCase().includes(mentionQ.toLowerCase())
  }).slice(0, 8)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '22px'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [msg])

  const insertMention = (name: string) => {
    const handle = mentionHandle(name)
    setMsg((prev) => prev.replace(/@[\w]*$/, `@${handle} `))
    setMentionOpen(false)
    setMentionQ('')
    textareaRef.current?.focus()
  }

  const send = () => {
    if (!msg.trim() || disabled) return
    onSend(msg.trim())
    setMsg('')
    setMentionOpen(false)
    if (textareaRef.current) textareaRef.current.style.height = '22px'
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onAttach?.(file)
      e.target.value = ''
    }
  }

  return (
    <div
      style={{
        padding: '16px 24px 22px 24px',
        display: 'flex',
        justifyContent: 'center',
        background: 'var(--bg)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

      <div
        className="composer-box"
        style={{
          width: '100%',
          maxWidth: 768,
          background: '#16181C',
          border: '1px solid #2F3336',
          borderRadius: 26,
          padding: '12px 16px',
          position: 'relative',
        }}
      >
        {mentionOpen && filtered.length > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 12,
              right: 12,
              bottom: '100%',
              marginBottom: 8,
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
              zIndex: 20,
              boxShadow: '0 12px 32px rgba(0,0,0,.45)',
            }}
          >
            {filtered.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertMention(m.name)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 10px',
                  background: i === mentionIdx ? 'var(--panel-2)' : 'transparent',
                  border: 'none',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontFamily: 'inherit',
                }}
              >
                @{mentionHandle(m.name)}
                <span style={{ color: 'var(--text-faint)', marginLeft: 8 }}>{m.name}</span>
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={msg}
          onChange={(e) => {
            const v = e.target.value
            setMsg(v)
            const at = v.match(/@([\w]*)$/)
            if (at) {
              setMentionOpen(true)
              setMentionQ(at[1])
              setMentionIdx(0)
            } else {
              setMentionOpen(false)
            }
          }}
          onKeyDown={(e) => {
            if (mentionOpen && filtered.length) {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setMentionIdx((i) => (i + 1) % filtered.length)
                return
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setMentionIdx((i) => (i - 1 + filtered.length) % filtered.length)
                return
              }
              if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                insertMention(filtered[mentionIdx].name)
                return
              }
              if (e.key === 'Escape') {
                setMentionOpen(false)
                return
              }
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Message Hive…  @ to mention a bot"
          rows={1}
          disabled={disabled}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 13.6,
            lineHeight: 1.5,
            height: 22,
            maxHeight: 120,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              style={iconBtn}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M21.4 11.1l-8.9 8.9a5 5 0 0 1-7.1-7.1l9.2-9.2a3.3 3.3 0 0 1 4.7 4.7L10.1 17a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" />
              </svg>
            </button>
            <button type="button" onClick={onOpenTools} title="Tools" style={iconBtn}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {!msg.trim() && onOpenVoice ? (
            <button type="button" onClick={onOpenVoice} title="Voice" style={{ ...iconBtn, width: 28, height: 28, borderRadius: '50%' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M6 11a6 6 0 0 0 12 0M12 17v4" strokeLinecap="round" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={send}
              disabled={!msg.trim() || disabled}
              title="Send"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: !msg.trim() || disabled ? 'default' : 'pointer',
                opacity: !msg.trim() || disabled ? 0.35 : 1,
                color: '#0D0E11',
                border: 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D0E11" strokeWidth="2.2">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 7,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-faint)',
  cursor: 'pointer',
  background: 'transparent',
  border: 'none',
}
