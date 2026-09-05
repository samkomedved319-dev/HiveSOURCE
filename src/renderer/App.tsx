import React, { useState, useEffect, useRef } from 'react'
import IconRail, { NavTab } from './components/layout/IconRail'
import ConversationList, { Conversation } from './components/layout/ConversationList'
import ChatView from './components/chat/ChatView'
import CanvasPanel, { BrowserStep } from './components/canvas/CanvasPanel'
import SettingsModal from './components/layout/SettingsModal'
import ProjectsModal from './components/layout/ProjectsModal'
import BotsPanel from './components/bots/BotsPanel'
import ProfileModal from './components/layout/ProfileModal'
import VoiceCall from './components/chat/VoiceCall'
import CursorBuddy from './components/mascot/CursorBuddy'
import BuddyOverlay from './components/chat/BuddyOverlay'
import LaunchScreen from './components/launch/LaunchScreen'
import FloatingPanel from './components/layout/FloatingPanel'
import NewGroupModal from './components/layout/NewGroupModal'
import FeedbackModal from './components/layout/FeedbackModal'
import CloudComputerPanel from './components/layout/CloudComputerPanel'
import { AnimatePresence } from 'motion/react'
import { useChatStore } from './stores/chatStore'
import { useAgentStore } from './stores/agentStore'
import { BUDDY_SETTINGS_EVENT, isBuddyEnabled } from './components/mascot/CursorBuddy'
import AuthGate from './components/auth/AuthGate'
import DeniedScreen from './components/auth/DeniedScreen'
import { useAuthStore } from './stores/authStore'
import type { Message } from './types'

function loadConvMessages(): Record<string, Message[]> {
  try {
    const saved = localStorage.getItem('hive_conv_messages')
    if (saved) return JSON.parse(saved)
  } catch {}
  return {}
}

export default function App() {
  const authReady = useAuthStore((s) => s.ready)
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    const onFb = () => setShowFeedback(true)
    window.addEventListener('hive:feedback', onFb as EventListener)
    return () => window.removeEventListener('hive:feedback', onFb as EventListener)
  }, [])

  // Launch screen animation disabled: boot straight into the workspace.
  // (LaunchScreen component is kept for tests/preview; set this back to
  // `useState(true)` to re-enable the animated boot sequence.)
  const [isLaunching, setIsLaunching] = useState(false)
  const [activeTab, setActiveTab] = useState<NavTab>('chat')
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('hive_conversations')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return []
  })
  const [activeConvId, setActiveConvId] = useState<string>(() => {
    return localStorage.getItem('hive_active_conv') || ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isCanvasOpen, setIsCanvasOpen] = useState(false)
  const [isConvListOpen, setIsConvListOpen] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [mainView, setMainView] = useState<'chat' | 'bots'>('chat')
  const [showProfile, setShowProfile] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [buddyOn, setBuddyOn] = useState(isBuddyEnabled)
  const [canvasMode, setCanvasMode] = useState<'code' | 'browser'>('code')
  const [activeBrowserUrl, setActiveBrowserUrl] = useState('https://google.com')
  const [activeTabTitle, setActiveTabTitle] = useState('Google Search')
  const [browserSteps, setBrowserSteps] = useState<BrowserStep[]>([
    {
      id: 'step-1',
      action: 'navigate',
      target: 'https://google.com/search?q=Manus+AI+Browser+Companion',
      status: 'completed',
      timestamp: Date.now() - 3000,
      detail: 'Loaded browser viewport',
    },
    {
      id: 'step-2',
      action: 'extract',
      target: 'document.body.innerText',
      status: 'completed',
      timestamp: Date.now() - 1500,
      detail: 'Scraped primary DOM content and synthesized query response',
    },
  ])
  const [canvasData, setCanvasData] = useState({
    name: 'theme.css',
    meta: 'Generated file · 42 lines',
    content: `:root{
  --bg: #0D0E11;
  --panel: #17181C;
  --accent: #F2C14E;
  --text: #F5F6F7;
  --radius: 10px;
}

.button--primary{
  background: var(--accent);
  color: var(--bg);
  border-radius: 8px;
}`,
  })

  const { activeAgent } = useAgentStore()
  const { clearMessages, addMessage } = useChatStore()

  // Per-conversation transcripts: selecting a chat in the left panel swaps
  // the main view to that conversation instead of only highlighting the row.
  const [convMessages, setConvMessages] = useState<Record<string, Message[]>>(loadConvMessages)
  const convMessagesRef = useRef<Record<string, Message[]>>(convMessages)
  const activeConvRef = useRef(activeConvId)
  const lastFlushSig = useRef('')

  // Save conversations to localStorage
  useEffect(() => {
    localStorage.setItem('hive_conversations', JSON.stringify(conversations))
    if (activeConvId) {
      localStorage.setItem('hive_active_conv', activeConvId)
    }
  }, [conversations, activeConvId])

  // Flush the live store into the active conversation snapshot (change-guarded).
  const persistCurrent = () => {
    const agent = useAgentStore.getState().activeAgent
    const cid = activeConvRef.current
    if (!agent || !cid) return
    const msgs = (useChatStore.getState().messages[agent.id] ?? []).slice(-60)
    const next = { ...convMessagesRef.current, [cid]: msgs }
    convMessagesRef.current = next
    setConvMessages(next)
    try {
      localStorage.setItem('hive_conv_messages', JSON.stringify(next))
    } catch {}
  }

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null
    const unsub = useChatStore.subscribe((s) => {
      const agent = useAgentStore.getState().activeAgent
      const cid = activeConvRef.current
      if (!agent || !cid) return
      const msgs = s.messages[agent.id] ?? []
      const sig = `${msgs.length}:${msgs.length ? msgs[msgs.length - 1].id : ''}:${(msgs[msgs.length - 1]?.content || '').length}`
      if (sig === lastFlushSig.current) return
      lastFlushSig.current = sig
      if (t) clearTimeout(t)
      t = setTimeout(() => persistCurrent(), 700)
    })
    return () => {
      if (t) clearTimeout(t)
      unsub()
    }
  }, [])

  // Restore the saved transcript for the active conversation on boot.
  useEffect(() => {
    const agent = activeAgent
    const cid = activeConvId
    if (!agent || !cid) return
    const saved = convMessagesRef.current[cid] ?? []
    const live = useChatStore.getState().messages[agent.id] ?? []
    if (saved.length > 0 && live.length === 0) {
      saved.forEach((m) => addMessage(agent.id, m))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleBuddy = () => {
    const next = !buddyOn
    setBuddyOn(next)
    try {
      localStorage.setItem('hive_buddy_enabled', next ? 'true' : 'false')
      window.dispatchEvent(new Event(BUDDY_SETTINGS_EVENT))
      window.electronAPI?.buddy?.setOuterEnabled?.(next)
    } catch {}
  }

  // Keyboard shortcut: Cmd/Ctrl + B conversation list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !e.shiftKey) {
        e.preventDefault()
        setIsConvListOpen((prev) => !prev)
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setIsConvListOpen((prev) => !prev)
        setMainView('chat')
        setActiveTab('chat')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const off = window.electronAPI?.buddy?.onSummon?.(() => {
      setIsConvListOpen(true)
      setMainView('chat')
      setActiveTab('chat')
    })
    return () => {
      try {
        off?.()
      } catch {}
    }
  }, [])

  // Responsive: collapse conv list under 900px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 900) {
        setIsConvListOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNavTab = (tab: NavTab) => {
    setActiveTab(tab)
    if (tab === 'chat') {
      // Chat tab doubles as "back to workspace": dismiss any modal surface.
      setMainView('chat')
      setShowSettings(false)
      setShowProjects(false)
      setShowProfile(false)
      setShowVoiceModal(false)
    } else if (tab === 'settings') {
      setShowSettings(true)
    } else if (tab === 'projects') {
      setShowProjects(true)
    } else if (tab === 'workers') {
      // Bots live in the main column where chat lives — no popup.
      setMainView('bots')
    } else if (tab === 'voice') {
      setShowVoiceModal(true)
    }
  }

  const handleSelectConv = (id: string) => {
    if (id === activeConvRef.current) return
    persistCurrent()
    activeConvRef.current = id
    setActiveConvId(id)
    const agent = useAgentStore.getState().activeAgent
    if (agent) {
      const saved = convMessagesRef.current[id] ?? []
      clearMessages(agent.id)
      saved.forEach((m) => addMessage(agent.id, m))
    }
  }

  const handleNewGroup = (name: string, agentIds: string[]) => {
    persistCurrent()
    const newId = `g-${Date.now()}`
    const newConv: Conversation = {
      id: newId,
      title: name,
      group: 'Today',
      kind: 'group',
      agentIds,
    }
    setConversations([newConv, ...conversations])
    activeConvRef.current = newId
    setActiveConvId(newId)
    if (activeAgent) clearMessages(activeAgent.id)
    setShowNewGroup(false)
  }

  const handleNewChat = () => {
    persistCurrent()
    const newId = `c-${Date.now()}`
    const workerName = activeAgent ? activeAgent.name : 'Hive'
    const newConv: Conversation = {
      id: newId,
      title: `${workerName} Chat ${conversations.length + 1}`,
      group: 'Today',
    }
    const updated = [newConv, ...conversations]
    setConversations(updated)
    activeConvRef.current = newId
    setActiveConvId(newId)
    if (activeAgent) {
      clearMessages(activeAgent.id)
    }
  }

  const handleDeleteChat = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id)
    setConversations(updated)
    const next = { ...convMessagesRef.current }
    delete next[id]
    convMessagesRef.current = next
    setConvMessages(next)
    try {
      localStorage.setItem('hive_conv_messages', JSON.stringify(next))
    } catch {}
    if (activeConvRef.current === id) {
      const nextActive = updated[0]?.id || ''
      activeConvRef.current = nextActive
      setActiveConvId(nextActive)
      if (activeAgent) {
        const saved = nextActive ? next[nextActive] ?? [] : []
        clearMessages(activeAgent.id)
        saved.forEach((m) => addMessage(activeAgent.id, m))
      }
    }
  }

  // Calculate 4-column grid template: Rail (56px) | Conv (240px or 0px) | Main (1fr) | Canvas (400px or 0px)
  const convWidth = isConvListOpen ? '240px' : '0px'
  const canvasWidth = '0px'
  const displayName = profile?.display_name || localStorage.getItem('hive_user_name') || 'H'
  const userInitial = displayName.charAt(0).toUpperCase()

  if (!authReady) {
    return (
      <div style={{ height: '100vh', width: '100vw', background: 'var(--bg)' }} />
    )
  }
  if (!session) return <AuthGate />
  if (profile?.status === 'denied') return <DeniedScreen />

  return (
    <>
      {/* 0. Cyber-bee Animated Launch Screen */}
      <AnimatePresence mode="wait">
        {isLaunching && (
          <LaunchScreen
            onComplete={() => setIsLaunching(false)}
            minDurationMs={2400}
          />
        )}
      </AnimatePresence>

      {/* Main Workspace (Pre-mounted behind launch screen for zero-flash reveal) */}
      <div
      style={{
        display: 'grid',
        gridTemplateColumns: `56px ${convWidth} 1fr ${canvasWidth}`,
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--bg)',
        position: 'relative',
        transition: 'grid-template-columns .45s var(--ease)',
      }}
    >
      {profile?.status === 'pending' && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            fontSize: 12,
            color: 'var(--accent)',
            background: 'rgba(242,193,78,0.1)',
            border: '1px solid var(--accent-dim)',
            borderRadius: 999,
            padding: '5px 12px',
            pointerEvents: 'none',
          }}
        >
          On the Hive waitlist — same account as the website
        </div>
      )}
      {/* 1. Icon rail */}
      <IconRail
        activeTab={activeTab}
        onSelectTab={handleNavTab}
        onOpenProfile={() => setShowProfile(true)}
        userInitial={userInitial}
        buddyOn={buddyOn}
        onToggleBuddy={toggleBuddy}
      />

      {/* 2. Conversation list panel (animated slide open/close) */}
      <div
        style={{
          width: isConvListOpen ? 240 : 0,
          opacity: isConvListOpen ? 1 : 0,
          visibility: isConvListOpen ? 'visible' : 'hidden',
          height: '100%',
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'width .45s var(--ease), opacity .3s var(--ease), visibility 0s',
          transitionDelay: isConvListOpen ? '0s, 0s, 0s' : '0s, 0s, .45s',
        }}
      >
        <div style={{ width: 240, height: '100%' }}>
          <ConversationList
            conversations={conversations}
            activeId={activeConvId}
            onSelect={handleSelectConv}
            onNewChat={handleNewChat}
            onNewGroup={() => setShowNewGroup(true)}
            onDeleteChat={handleDeleteChat}
            onOpenWorkers={() => setMainView('bots')}
            onToggleSidebar={() => setIsConvListOpen((prev) => !prev)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      </div>

      {/* 3. Main column: chat or bots (bots open where chat lives) */}
      {mainView === 'chat' ? (
      <ChatView
        isCanvasOpen={isCanvasOpen}
        onToggleCanvas={() => setIsCanvasOpen((prev) => !prev)}
        onUpdateCanvas={(data) => {
          setCanvasData(data)
          setCanvasMode('code')
          setIsCanvasOpen(true)
        }}
        onOpenBrowserCanvas={(url, title) => {
          setActiveBrowserUrl(url)
          if (title) setActiveTabTitle(title)
          setCanvasMode('browser')
          setBrowserSteps([
            {
              id: `step-${Date.now()}-1`,
              action: 'navigate',
              target: url,
              status: 'completed',
              timestamp: Date.now() - 1000,
              detail: `Navigated to ${url}`,
            },
            {
              id: `step-${Date.now()}-2`,
              action: 'extract',
              target: 'DOM page content & text',
              status: 'running',
              timestamp: Date.now(),
              detail: 'Extracting live page data with Hive Browser Bridge...',
            },
          ])
          setIsCanvasOpen(true)
        }}
        onNewChat={handleNewChat}
        onOpenWorkers={() => setMainView('bots')}
        isConvListOpen={isConvListOpen}
        onToggleSidebar={() => setIsConvListOpen((prev) => !prev)}
      />
      ) : (
      <BotsPanel
        onBack={() => {
          setMainView('chat')
          setActiveTab('chat')
        }}
        onSelectAgent={(agent) => {
          const newId = `c-${Date.now()}`
          const newConv: Conversation = {
            id: newId,
            title: `${agent.name} Session`,
            group: 'Today',
          }
          setConversations([newConv, ...conversations])
          activeConvRef.current = newId
          setActiveConvId(newId)
          clearMessages(agent.id)
          setMainView('chat')
          setActiveTab('chat')
        }}
      />
      )}

      {isCanvasOpen && (
        <FloatingPanel title="HiveBox · live cloud" onClose={() => setIsCanvasOpen(false)} width={440} height={620}>
          <CloudComputerPanel onClose={() => setIsCanvasOpen(false)} />
        </FloatingPanel>
      )}

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      {showNewGroup && (
        <NewGroupModal onClose={() => setShowNewGroup(false)} onCreate={handleNewGroup} />
      )}

      {/* Hive Buddy: cursor companion + push-to-talk overlay */}
      <CursorBuddy />
      <BuddyOverlay />

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* User Profile Modal */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          userInitial={userInitial}
        />
      )}

      {/* Projects Modal */}
      {showProjects && (
        <ProjectsModal
          onClose={() => setShowProjects(false)}
          onSelectProject={(projName) => {
            const newId = `c-${Date.now()}`
            const newConv: Conversation = {
              id: newId,
              title: `${projName} discussion`,
              group: 'Today',
            }
            setConversations([newConv, ...conversations])
            setActiveConvId(newId)
            if (activeAgent) {
              clearMessages(activeAgent.id)
            }
          }}
        />
      )}

      {/* Voice Call Modal from Rail */}
      {showVoiceModal && (
        <VoiceCall onClose={() => setShowVoiceModal(false)} />
      )}
    </div>
    </>
  )
}
