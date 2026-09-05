import React, { useRef, useEffect } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  onAttach?: (file: File) => void
  onOpenTools?: () => void
  onOpenVoice?: () => void
}

export default function ChatInput({
  onSend,
  disabled,
  onAttach,
  onOpenTools,
  onOpenVoice,
}: ChatInputProps) {
  const [msg, setMsg] = React.useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '22px'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [msg])

  const send = () => {
    if (!msg.trim() || disabled) return
    onSend(msg.trim())
    setMsg('')
    if (textareaRef.current) {
      textareaRef.current.style.height = '22px'
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onAttach?.(file)
      // reset so same file can be selected again
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
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div
        className="composer-box"
        style={{
          width: '100%',
          maxWidth: 768,
          background: '#16181C',
          border: '1px solid #2F3336',
          borderRadius: 26,
          padding: '12px 16px',
          transition: 'border-color .2s var(--ease), box-shadow .2s var(--ease)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Message Hive…"
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
          }}
        >
          {/* Tools */}
          <div style={{ display: 'flex', gap: 6 }}>
            {/* Attach button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach File"
              style={{
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
                outline: 'none',
                transition: 'all .2s var(--ease)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--panel-2)'
                e.currentTarget.style.color = 'var(--text-dim)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-faint)'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M21.4 11.1l-8.9 8.9a5 5 0 0 1-7.1-7.1l9.2-9.2a3.3 3.3 0 0 1 4.7 4.7L10.1 17a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" />
              </svg>
            </button>

            {/* Quick Tools button */}
            <button
              type="button"
              onClick={onOpenTools}
              title="Hive Tools"
              style={{
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
                outline: 'none',
                transition: 'all .2s var(--ease)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--panel-2)'
                e.currentTarget.style.color = 'var(--text-dim)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-faint)'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M14.7 6.3a4 4 0 1 1-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 1 1 5.4-5.4z" />
              </svg>
            </button>
          </div>

          {/* Mic when empty, white send pill when typing (Grok send slot) */}
          {!msg.trim() && onOpenVoice ? (
            <button
              type="button"
              onClick={onOpenVoice}
              title="Voice mode"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-dim)',
                border: 'none',
                outline: 'none',
                fontSize: 14,
              }}
            >
              🎙
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
              outline: 'none',
              transition: 'transform .15s var(--ease), opacity .15s',
            }}
            onMouseEnter={(e) => {
              if (msg.trim() && !disabled) {
                e.currentTarget.style.transform = 'scale(1.06)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
            onMouseDown={(e) => {
              if (msg.trim() && !disabled) {
                e.currentTarget.style.transform = 'scale(.94)'
              }
            }}
            onMouseUp={(e) => {
              if (msg.trim() && !disabled) {
                e.currentTarget.style.transform = 'scale(1.06)'
              }
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