import React from 'react'

export interface Conversation {
  id: string
  title: string
  group: 'Today' | 'Previous 7 Days' | 'Older'
  kind?: 'chat' | 'group'
  agentIds?: string[]
}

interface ConversationListProps {
  conversations: Conversation[]
  activeId: string
  onSelect: (id: string) => void
  onNewChat: () => void
  onNewGroup?: () => void
  onDeleteChat?: (id: string) => void
  onOpenWorkers?: () => void
  onToggleSidebar?: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onNewGroup,
  onDeleteChat,
  searchQuery,
  onSearchChange,
}: ConversationListProps) {
  const filtered = searchQuery.trim()
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations

  const todayItems = filtered.filter((c) => c.group === 'Today')
  const prev7Items = filtered.filter((c) => c.group === 'Previous 7 Days')
  const olderItems = filtered.filter((c) => c.group === 'Older')

  return (
    <div
      style={{
        background: 'var(--panel)',
        borderRight: '1px solid var(--border-soft)',
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 10px',
        width: 240,
        height: '100%',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      {/* Header: single New chat action (Claude-style). Sidebar toggle lives
          only in the TitleBar; workers live only in the rail — no duplicates. */}
      <div style={{ padding: '4px 2px 12px 2px' }}>
        <button
          type="button"
          onClick={onNewChat}
          title="New chat"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 9,
            border: '1px solid var(--border)',
            background: 'var(--panel-2)',
            color: 'var(--text)',
            fontSize: 12.8,
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color .15s var(--ease), background .15s var(--ease)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-dim)'
            e.currentTarget.style.background = 'rgba(242,193,78,0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.background = 'var(--panel-2)'
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </button>
        {onNewGroup && (
          <button
            type="button"
            onClick={onNewGroup}
            title="Add new group"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              marginTop: 8,
              borderRadius: 9,
              border: '1px solid var(--border-soft)',
              background: 'transparent',
              color: 'var(--text-dim)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Add new group
          </button>
        )}
      </div>

      {/* Search */}
      <input
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search chats…"
        style={{
          background: 'var(--panel-2)',
          border: '1px solid var(--border-soft)',
          borderRadius: 8,
          padding: '7px 10px',
          fontSize: 12.5,
          color: 'var(--text)',
          marginBottom: 12,
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />

      {conversations.length === 0 && (
        <div
          style={{
            padding: '24px 8px',
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-faint)',
            lineHeight: 1.5,
          }}
        >
          No conversations yet.
          <div style={{ marginTop: 4 }}>Click + above to start one.</div>
        </div>
      )}

      {/* Groups */}
      {todayItems.length > 0 && (
        <>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: 'var(--text-faint)',
              padding: '10px 8px 6px 8px',
              fontWeight: 500,
            }}
          >
            Today
          </div>
          {todayItems.map((c) => (
            <ConversationItem
              key={c.id}
              id={c.id}
              active={c.id === activeId}
              title={c.title}
              kind={c.kind}
              onClick={() => onSelect(c.id)}
              onDelete={onDeleteChat}
            />
          ))}
        </>
      )}

      {prev7Items.length > 0 && (
        <>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: 'var(--text-faint)',
              padding: '10px 8px 6px 8px',
              fontWeight: 500,
            }}
          >
            Previous 7 Days
          </div>
          {prev7Items.map((c) => (
            <ConversationItem
              key={c.id}
              id={c.id}
              active={c.id === activeId}
              title={c.title}
              kind={c.kind}
              onClick={() => onSelect(c.id)}
              onDelete={onDeleteChat}
            />
          ))}
        </>
      )}

      {olderItems.length > 0 && (
        <>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: 'var(--text-faint)',
              padding: '10px 8px 6px 8px',
              fontWeight: 500,
            }}
          >
            Older
          </div>
          {olderItems.map((c) => (
            <ConversationItem
              key={c.id}
              id={c.id}
              active={c.id === activeId}
              title={c.title}
              kind={c.kind}
              onClick={() => onSelect(c.id)}
              onDelete={onDeleteChat}
            />
          ))}
        </>
      )}
    </div>
  )
}

function ConversationItem({
  id,
  title,
  active,
  kind,
  onClick,
  onDelete,
}: {
  id: string
  title: string
  active: boolean
  kind?: 'chat' | 'group'
  onClick: () => void
  onDelete?: (id: string) => void
}) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 8px',
        borderRadius: 7,
        cursor: 'pointer',
        color: active || hovered ? 'var(--text)' : 'var(--text-dim)',
        background: active || hovered ? 'var(--panel-2)' : 'transparent',
        fontSize: 12.8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'background .15s var(--ease), color .15s var(--ease)',
        position: 'relative',
      }}
    >
      {active && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: '20%',
            bottom: '20%',
            width: 2,
            background: 'var(--accent)',
            borderRadius: 2,
          }}
        />
      )}
      <span
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
          paddingLeft: active ? 6 : 0,
        }}
      >
        {title}
      </span>
      {kind === 'group' && (
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--accent)', border: '1px solid var(--accent-dim)', borderRadius: 4, padding: '1px 5px' }}>
          Group
        </span>
      )}
      {hovered && onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(id)
          }}
          title="Delete chat"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-faint)',
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: 12,
            marginLeft: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}
        >
          ✕
        </button>
      )}
    </div>
  )
}
