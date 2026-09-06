import React from 'react'

export type NavTab = 'chat' | 'workers' | 'projects' | 'office' | 'voice' | 'settings'

interface IconRailProps {
  activeTab: NavTab
  onSelectTab: (tab: NavTab) => void
  onOpenProfile?: () => void
  userInitial?: string
  buddyOn?: boolean
  onToggleBuddy?: () => void
  chatOpen?: boolean
}

function RailBtn({
  title,
  active,
  onClick,
  children,
}: {
  title: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        position: 'relative',
        width: 36,
        height: 36,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? 'var(--accent)' : 'var(--text-faint)',
        background: active ? 'var(--panel-2)' : 'transparent',
        cursor: 'pointer',
        border: 'none',
        outline: 'none',
        transition: 'background 200ms var(--ease), color 200ms var(--ease), transform 150ms var(--ease)',
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.96)'
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--panel-2)'
          e.currentTarget.style.color = 'var(--text-dim)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-faint)'
        }
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          width: 2,
          height: 16,
          borderRadius: 99,
          background: 'var(--accent)',
          transform: active ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.5)',
          opacity: active ? 1 : 0,
          transition: 'opacity 200ms var(--ease), transform 200ms var(--ease)',
        }}
      />
      {children}
    </button>
  )
}

export default function IconRail({
  activeTab,
  onSelectTab,
  onOpenProfile,
  userInitial = 'A',
  buddyOn = false,
  onToggleBuddy,
  chatOpen = false,
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
        gap: 12,
        flexShrink: 0,
        height: '100%',
        userSelect: 'none',
      }}
    >
      <img
        src="./logo.png"
        alt="Hive"
        style={{ width: 28, height: 28, marginBottom: 8, cursor: 'pointer', objectFit: 'contain' }}
        onClick={() => onSelectTab('office')}
      />

      <RailBtn title="Chat" active={activeTab === 'chat'} onClick={() => onSelectTab('chat')}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </RailBtn>

      <RailBtn title="AI Workers" active={activeTab === 'workers'} onClick={() => onSelectTab('workers')}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <circle cx="9" cy="10" r="1.5" fill="currentColor" />
          <circle cx="15" cy="10" r="1.5" fill="currentColor" />
          <path d="M8 15h8" strokeLinecap="round" />
        </svg>
      </RailBtn>

      <RailBtn title="Projects" active={activeTab === 'projects'} onClick={() => onSelectTab('projects')}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </RailBtn>

      <RailBtn title="3D Office / HiveOffice" active={activeTab === 'office'} onClick={() => onSelectTab('office')}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 21V8l9-5 9 5v13" />
          <path d="M9 21v-8h6v8" />
          <path d="M9 10h.01M15 10h.01M12 10h.01" />
        </svg>
      </RailBtn>

      {/* Messages / calling rail â€” kept in source, hidden from users.
      <RailBtn title="Messages" active={activeTab === 'voice'} onClick={() => onSelectTab('voice')}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M21.2 16.7v2.6a1.7 1.7 0 0 1-1.9 1.7 16.8 16.8 0 0 1-7.3-2.5 16.5 16.5 0 0 1-5.1-5.1A16.8 16.8 0 0 1 4.4 6.1 1.7 1.7 0 0 1 6.1 4.2h2.5a1.7 1.7 0 0 1 1.7 1.4c.1.9.3 1.7.5 2.5a1.7 1.7 0 0 1-.4 1.8L9.2 11a13.6 13.6 0 0 0 5.1 5.1l1.1-1.1a1.7 1.7 0 0 1 1.8-.4c.8.2 1.6.4 2.5.5a1.7 1.7 0 0 1 1.5 1.6z" />
        </svg>
      </RailBtn>
      */}

      {onToggleBuddy && (
        <RailBtn
          title={buddyOn ? 'Buddy on â€” follows your cursor' : 'Enable Buddy'}
          active={buddyOn}
          onClick={onToggleBuddy}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="10" r="4" />
            <path d="M6 20c1.4-3.2 3.6-5 6-5s4.6 1.8 6 5" />
          </svg>
        </RailBtn>
      )}

      <div style={{ flex: 1 }} />

      <RailBtn title="Settings" active={activeTab === 'settings'} onClick={() => onSelectTab('settings')}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </RailBtn>

      <div
        onClick={onOpenProfile}
        title="Profile"
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: 12,
          color: 'var(--accent-fg)',
          cursor: 'pointer',
          transition: 'transform 150ms var(--ease)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {userInitial}
      </div>
    </div>
  )
}

