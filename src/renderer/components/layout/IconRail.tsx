import React from 'react'

export type NavTab = 'chat' | 'workers' | 'projects' | 'voice' | 'settings'

interface IconRailProps {
  activeTab: NavTab
  onSelectTab: (tab: NavTab) => void
  onOpenProfile?: () => void
  userInitial?: string
}

export default function IconRail({
  activeTab,
  onSelectTab,
  onOpenProfile,
  userInitial = 'A',
}: IconRailProps) {
  return (
    <div
      style={{
        width: 56,
        background: 'var(--bg)',
        borderRight: '1px solid var(--border-soft)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        gap: 20,
        flexShrink: 0,
        height: '100%',
        userSelect: 'none',
      }}
    >
      {/* Logo mark */}
      <svg
        style={{ width: 28, height: 28, marginBottom: 8, cursor: 'pointer' }}
        viewBox="0 0 32 32"
        fill="none"
        onClick={() => onSelectTab('chat')}
      >
        <path
          d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
          stroke="var(--accent)"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M16 9L22 12.5V19.5L16 23L10 19.5V12.5L16 9Z"
          fill="var(--accent)"
        />
      </svg>

      {/* Chat */}
      <button
        type="button"
        title="Chat"
        onClick={() => onSelectTab('chat')}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: activeTab === 'chat' ? 'var(--accent)' : 'var(--text-faint)',
          background: activeTab === 'chat' ? 'var(--panel-2)' : 'transparent',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          transition: 'background .2s var(--ease), color .2s var(--ease)',
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'chat') {
            e.currentTarget.style.background = 'var(--panel-2)'
            e.currentTarget.style.color = 'var(--text-dim)'
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'chat') {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-faint)'
          }
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* AI Workers (Grok Bots / Specialists) */}
      <button
        type="button"
        title="AI Workers & Specialists"
        onClick={() => onSelectTab('workers')}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: activeTab === 'workers' ? 'var(--accent)' : 'var(--text-faint)',
          background: activeTab === 'workers' ? 'var(--panel-2)' : 'transparent',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          transition: 'background .2s var(--ease), color .2s var(--ease)',
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'workers') {
            e.currentTarget.style.background = 'var(--panel-2)'
            e.currentTarget.style.color = 'var(--text-dim)'
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'workers') {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-faint)'
          }
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <circle cx="9" cy="10" r="1.5" fill="currentColor" />
          <circle cx="15" cy="10" r="1.5" fill="currentColor" />
          <path d="M8 15h8" strokeLinecap="round" />
          <path d="M12 2v2M2 12h2M20 12h2" />
        </svg>
      </button>

      {/* Projects */}
      <button
        type="button"
        title="Projects"
        onClick={() => onSelectTab('projects')}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: activeTab === 'projects' ? 'var(--accent)' : 'var(--text-faint)',
          background: activeTab === 'projects' ? 'var(--panel-2)' : 'transparent',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          transition: 'background .2s var(--ease), color .2s var(--ease)',
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'projects') {
            e.currentTarget.style.background = 'var(--panel-2)'
            e.currentTarget.style.color = 'var(--text-dim)'
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'projects') {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-faint)'
          }
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>

      {/* Messages (voice calling ships later — the panel funnels to Telegram) */}
      <button
        type="button"
        title="Messages"
        onClick={() => onSelectTab('voice')}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: activeTab === 'voice' ? 'var(--accent)' : 'var(--text-faint)',
          background: activeTab === 'voice' ? 'var(--panel-2)' : 'transparent',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          transition: 'background .2s var(--ease), color .2s var(--ease)',
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'voice') {
            e.currentTarget.style.background = 'var(--panel-2)'
            e.currentTarget.style.color = 'var(--text-dim)'
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'voice') {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-faint)'
          }
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
          <circle cx="13" cy="11" r="1" fill="currentColor" stroke="none" />
          <circle cx="17" cy="11" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Settings */}
      <button
        type="button"
        title="Settings"
        onClick={() => onSelectTab('settings')}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: activeTab === 'settings' ? 'var(--accent)' : 'var(--text-faint)',
          background: activeTab === 'settings' ? 'var(--panel-2)' : 'transparent',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          transition: 'background .2s var(--ease), color .2s var(--ease)',
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'settings') {
            e.currentTarget.style.background = 'var(--panel-2)'
            e.currentTarget.style.color = 'var(--text-dim)'
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'settings') {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-faint)'
          }
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      </button>

      {/* Avatar */}
      <div
        onClick={onOpenProfile}
        title="View & Edit Profile"
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #F2C14E, #C99A2E)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: 12,
          color: '#0D0E11',
          cursor: 'pointer',
          transition: 'transform .15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {userInitial}
      </div>
    </div>
  )
}
