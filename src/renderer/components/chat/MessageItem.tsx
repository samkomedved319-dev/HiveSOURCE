import React, { useEffect, useState } from 'react'
import type { Message } from '../../types'
import BloubEngineAvatar from '../mascot/BloubEngineAvatar'
import { getMascot } from '../mascot/mascotLibrary'

export function extractCitationDomain(c: { domain?: string; url?: string }): string {
  let domain = c.domain
  if (!domain && c.url) {
    try {
      domain = new URL(c.url).hostname.replace(/^www\./, '')
    } catch {
      domain = c.url.slice(0, 30)
    }
  }
  return domain || 'source'
}

export default React.memo(function MessageItem({
  message,
  index = 0,
}: {
  message: Message
  index?: number
}) {
  const isUser = message.role === 'user'
  const mascot = getMascot(message.botAvatar)
  const [open, setOpen] = useState(false)
  const fresh = Date.now() - message.timestamp < 8000 && !isUser
  const [shown, setShown] = useState(fresh ? Math.min(48, message.content.length) : message.content.length)

  useEffect(() => {
    if (!fresh) return
    const id = window.setInterval(() => {
      setShown((n) => {
        const next = Math.min(message.content.length, n + Math.max(3, Math.ceil(message.content.length / 90)))
        if (next >= message.content.length) window.clearInterval(id)
        return next
      })
    }, 16)
    return () => window.clearInterval(id)
  }, [fresh, message.content, message.content.length])

  const formatInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={i}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              background: 'rgba(255,255,255,0.08)',
              padding: '1px 5px',
              borderRadius: 4,
              fontSize: 13,
              color: 'var(--accent)',
            }}
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link) {
        return (
          <a key={i} href={link[2]} onClick={(e) => { e.preventDefault(); window.electronAPI?.system?.openApp?.(link[2]) }} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
            {link[1]}
          </a>
        )
      }
      return <React.Fragment key={i}>{part}</React.Fragment>
    })
  }

  // Format code blocks or inline code cleanly
  const renderContent = (raw: string) => {
    const content = !open && raw.length > 1400 ? raw.slice(0, 1400) + '…' : raw
    const writing = shown < message.content.length ? content.slice(0, shown) : content
    // Check for triple backtick code blocks
    const codeBlockMatch = writing.match(/```([a-zA-Z]*)\n?([\s\S]*?)```/)
    if (codeBlockMatch) {
      const lang = codeBlockMatch[1] || 'code'
      const code = codeBlockMatch[2]
      const beforeCode = writing.split('```')[0]
      const afterCode = writing.split('```').slice(2).join('```')

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {beforeCode.trim() && <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{formatInline(beforeCode.trim())}</p>}
          <div
            style={{
              background: '#0D0E11',
              border: '1px solid var(--border-soft)',
              borderRadius: 8,
              overflow: 'hidden',
              marginTop: 4,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '4px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontSize: 11,
                color: 'var(--text-faint)',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {lang}
            </div>
            <pre
              style={{
                margin: 0,
                padding: 12,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13.5,
                color: '#D8DAE0',
                lineHeight: 1.6,
                overflowX: 'auto',
              }}
            >
              <code>{code}</code>
            </pre>
          </div>
          {afterCode.trim() && <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{formatInline(afterCode.trim())}</p>}
        </div>
      )
    }

    const lines = writing.split('\n')
    return (
      <div style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.65, overflowWrap: 'anywhere', userSelect: 'text' }}>
        {lines.map((line, i) => {
          if (/^#{1,3}\s/.test(line)) {
            return (
              <div key={i} style={{ fontWeight: 700, fontSize: 16.5, margin: '10px 0 4px', color: 'var(--text)' }}>
                {formatInline(line.replace(/^#{1,3}\s/, ''))}
              </div>
            )
          }
          return <div key={i}>{formatInline(line.replace(/^[-*]\s+/, '• ').replace(/^\d+\.\s+/, (m) => m))}</div>
        })}
        {shown < message.content.length && (
          <span style={{ display: 'inline-block', width: 7, height: 14, marginLeft: 2, background: 'var(--accent)', animation: 'office-type .7s steps(1) infinite', verticalAlign: 'text-bottom' }} />
        )}
      </div>
    )
  }

  // Grok-clean rows: user = right-aligned bubble, assistant = plain
  // full-width text with the house avatar. No badge chrome.
  const authorName = isUser ? 'You' : (message.botName || 'Hive')
  const authorColor =
    authorName === 'Scout'
      ? '#5B8DEF'
      : authorName === 'Critic'
        ? '#C084FC'
        : authorName === 'Pulse'
          ? '#FB7185'
          : authorName === 'Operator'
            ? '#34D399'
            : authorName === 'Sentry'
              ? '#F97316'
              : authorName === 'Hive'
                ? 'var(--accent)'
                : 'var(--text-dim)'

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 14px', animation: 'rise .25s var(--ease) forwards' }}>
        <div
          style={{
            maxWidth: '78%',
            background: '#16181C',
            color: '#E7E9EA',
            padding: '12px 16px',
            borderRadius: 20,
            borderBottomRightRadius: 6,
            fontSize: 15,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
        >
          {renderContent(message.content)}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '8px 14px',
        borderRadius: 8,
        transition: 'background 0.12s ease',
        animation: 'rise .25s var(--ease) forwards',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* House avatar */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        <BloubEngineAvatar
          size={32}
          crop={120}
          live={false}
          ink={mascot.ink}
          paper={mascot.paper}
          botState={mascot.pose}
          shapeId={mascot.shape}
        />
      </div>

      {/* Message Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Quiet header: name + time only */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: authorColor }}>
            {authorName}
          </span>
          <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Message Text */}
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.65,
            color: '#D8DAE0',
            overflowWrap: 'anywhere',
            userSelect: 'text',
            maxWidth: '100%',
          }}
        >
          {renderContent(message.content)}
          {message.content.length > 1400 && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              style={{ marginTop: 8, background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12 }}
            >
              {open ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Interactive Cited Sources Cards */}
        {message.citations && message.citations.length > 0 && (
            <div
              style={{
                marginTop: 10,
                padding: '10px 12px',
                borderRadius: 8,
                background: '#1E2126',
                border: '1px solid #2F3336',
              }}
            >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'var(--accent)',
                  letterSpacing: '0.02em',
                }}
              >
                <span>🌐</span>
                <span>Sources</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {message.citations.map((c, idx) => {
                const domain = extractCitationDomain(c)
                const fav = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
                return (
                  <a
                    key={idx}
                    href={c.url}
                    onClick={(e) => {
                      e.preventDefault()
                      if (window.electronAPI?.system?.openApp) {
                        window.electronAPI.system.openApp(c.url)
                      } else {
                        window.open(c.url, '_blank', 'noopener,noreferrer')
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      textDecoration: 'none',
                      color: 'inherit',
                      maxWidth: 280,
                    }}
                    title={c.url}
                  >
                    <img src={fav} alt="" width={14} height={14} style={{ borderRadius: 3 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#E4E6EB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title || domain}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{domain}</span>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})