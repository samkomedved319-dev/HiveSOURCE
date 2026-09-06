import React, { useState, useEffect, useRef } from 'react'
import IconRail, { NavTab } from './components/layout/IconRail'
import ConversationList, { Conversation } from './components/layout/ConversationList'
import ChatView from './components/chat/ChatView'
import OfficeOverlay from './components/office/OfficeOverlay'
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
import CommandPalette from './components/layout/CommandPalette'
import CloudComputerPanel from './components/layout/CloudComputerPanel'
import { AnimatePresence } from 'motion/react'
import { loadShortcuts, matchesBinding, toAccelerator } from './shortcuts'
import { TITLE_EVENT, isPlaceholderTitle, localTitle, refineTitle } from './chatTitle'
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
    document.documentElement.style.setProperty('--accent', '#F2C14E')
    const payload: Record<string, string> = {}
    const or = localStorage.getItem('hive_custom_api_key') || ''
    if (or.trim()) {
      payload.OPENROUTER_API_KEY = or.trim()
      payload.hive_custom_api_key = or.trim()
    }
    const openai = localStorage.getItem('hive_openai_key') || ''
    if (openai.trim()) payload.OPENAI_API_KEY = openai.trim()
    const staff = localStorage.getItem('hive_staff') === '1'
    if (staff) {
      const mem = localStorage.getItem('hive_mem0_key') || ''
      const ck = localStorage.getItem('hive_mozaik_cloud_key') || ''
      const cb = localStorage.getItem('hive_mozaik_cloud_base') || ''
      if (mem.trim()) payload.MEM0_API_KEY = mem.trim()
      if (ck.trim()) payload.MOZAIK_CLOUD_API_KEY = ck.trim()
      if (cb.trim()) payload.MOZAIK_CLOUD_BASE_URL = cb.trim()
    }
    if (Object.keys(payload).length) void window.electronAPI?.keys?.set?.(payload)
  }, [])

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
  const [mainView, setMainView] = useState<'chat' | 'office' | 'bots' | 'projects'>('chat')
  const [showProfile, setShowProfile] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
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
    meta: 'Generated file Â· 42 lines',
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

  useEffect(() => {
    const onTitle = (e: Event) => {
      const text = String((e as CustomEvent<string>).detail || '').trim()
      if (!text) return
      let cid = activeConvRef.current
      if (!cid) {
        cid = `c-${Date.now()}`
        const conv: Conversation = {
          id: cid,
          title: localTitle(text),
          group: 'Today',
          agentId: useAgentStore.getState().activeAgent?.id,
        }
        setConversations((prev) => [conv, ...prev])
        activeConvRef.current = cid
        setActiveConvId(cid)
      } else {
        setConversations((prev) =>
          prev.map((c) => (c.id === cid && isPlaceholderTitle(c.title) ? { ...c, title: localTitle(text) } : c))
        )
      }
      const locked = cid
      void refineTitle(text).then((named) => {
        if (!named || activeConvRef.current !== locked) return
        setConversations((prev) => prev.map((c) => (c.id === locked ? { ...c, title: named } : c)))
      })
    }
    window.addEventListener(TITLE_EVENT, onTitle as EventListener)
    return () => window.removeEventListener(TITLE_EVENT, onTitle as EventListener)
  }, [])

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

  // Keyboard shortcuts (capture so they work even from the composer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const map = loadShortcuts()
      if (matchesBinding(e, map.sidebar)) {
        e.preventDefault()
        setIsConvListOpen((prev) => !prev)
      } else if (matchesBinding(e, map.newChat)) {
        e.preventDefault()
        handleNewChat()
      } else if (matchesBinding(e, map.settings)) {
        e.preventDefault()
        setShowSettings(true)
      } else if (matchesBinding(e, map.palette)) {
        e.preventDefault()
        setShowPalette(true)
      } else if (matchesBinding(e, map.hivebox)) {
        e.preventDefault()
        setIsCanvasOpen((prev) => !prev)
      } else if (matchesBinding(e, map.buddy)) {
        e.preventDefault()
        setMainView('chat')
        setActiveTab('chat')
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  useEffect(() => {
    const map = loadShortcuts()
    window.electronAPI?.shortcuts?.setGlobal?.({
      hivebox: toAccelerator(map.hivebox),
      buddy: toAccelerator(map.buddy),
    })
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
      setMainView('chat')
      setShowSettings(false)
    } else if (tab === 'settings') {
      setShowSettings(true)
    } else if (tab === 'projects') {
      setMainView('projects')
      setShowSettings(false)
    } else if (tab === 'workers') {
      setMainView('bots')
      setShowSettings(false)
    } else if (tab === 'office') {
      setMainView('office')
      setShowSettings(false)
      setIsCanvasOpen(false)
    } else if (tab === 'voice') {
      setShowVoiceModal(true)
    }
  }

  const handleSelectConv = (id: string) => {
    if (id === activeConvRef.current) return
    persistCurrent()
    activeConvRef.current = id
    setActiveConvId(id)
    const conv = conversations.find((c) => c.id === id)
    if (conv?.agentId) {
      const bot = useAgentStore.getState().agents.find((a) => a.id === conv.agentId)
      if (bot) useAgentStore.getState().setActiveAgent(bot)
    }
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
      title: `${workerName.split('(')[0].trim()} Chat ${conversations.length + 1}`,
      group: 'Today',
      agentId: activeAgent?.id,
    }
    const updated = [newConv, ...conversations]
    setConversations(updated)
    activeConvRef.current = newId
    setActiveConvId(newId)
    if (activeAgent) {
      clearMessages(activeAgent.id)
    }
    setMainView('chat')
    setActiveTab('chat')
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
        gridTemplateColumns: `56px ${mainView === 'chat' && isConvListOpen ? '240px' : '0px'} minmax(0, 1fr)`,
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        minHeight: 0,
        gridTemplateRows: 'minmax(0, 1fr)',
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
            gridColumn: '1 / -1',
            height: 0,
            color: 'var(--accent)',
            background: 'rgba(242,193,78,0.1)',
            border: '1px solid var(--accent-dim)',
            borderRadius: 999,
            padding: '5px 12px',
            pointerEvents: 'none',
          }}
        >
          On the Hive waitlist â€” same account as the website
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

      <div
        style={{
          width: mainView === 'chat' && isConvListOpen ? 240 : 0,
          overflow: 'hidden',
          height: '100%',
          minHeight: 0,
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

      <div style={{ minWidth: 0, minHeight: 0, overflow: 'hidden', height: '100%', display: 'flex' }}>
      {mainView === 'projects' ? (
        <ProjectsModal
          embedded
          onClose={() => {
            setMainView('chat')
            setActiveTab('chat')
          }}
          onSelectProject={(projName) => {
            const newId = `c-${Date.now()}`
            const newConv: Conversation = {
              id: newId,
              title: `${projName} discussion`,
              group: 'Today',
            }
            setConversations([newConv, ...conversations])
            setActiveConvId(newId)
            if (activeAgent) clearMessages(activeAgent.id)
            setMainView('chat')
            setActiveTab('chat')
          }}
        />
      ) : mainView === 'bots' ? (
      <BotsPanel
        onBack={() => {
          setMainView('chat')
          setActiveTab('chat')
        }}
        onSelectAgent={(agent) => {
          useAgentStore.getState().setActiveAgent(agent)
          const newId = `c-${Date.now()}`
          const newConv: Conversation = {
            id: newId,
            title: `${agent.name.split('(')[0].trim()}`,
            group: 'Today',
            agentId: agent.id,
          }
          setConversations([newConv, ...conversations])
          activeConvRef.current = newId
          setActiveConvId(newId)
          clearMessages(agent.id)
          setMainView('chat')
          setActiveTab('chat')
        }}
      />
      ) : mainView === 'office' ? (
        <div className="office-native-root" style={{ width: '100%', height: '100%', minHeight: 0 }}><OfficeOverlay /></div>
      ) : (
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
          setIsCanvasOpen(true)
        }}
        onNewChat={handleNewChat}
        onOpenWorkers={() => setMainView('bots')}
        isConvListOpen={isConvListOpen}
        onToggleSidebar={() => setIsConvListOpen((prev) => !prev)}
        conversation={conversations.find((c) => c.id === activeConvId) || null}
      />
      )}
      </div>
      {showPalette && (
        <CommandPalette
          open={showPalette}
          onClose={() => setShowPalette(false)}
          actions={[
            { id: 'new', label: 'New chat', hint: 'Ctrl+N', run: () => { setShowPalette(false); handleNewChat() } },
            { id: 'group', label: 'New group', run: () => { setShowPalette(false); setShowNewGroup(true) } },
            { id: 'hivebox', label: 'Toggle HiveBox', hint: 'Ctrl+Shift+H', run: () => { setShowPalette(false); setIsCanvasOpen((v) => !v) } },
            { id: 'sidebar', label: 'Toggle sidebar', hint: 'Ctrl+B', run: () => { setShowPalette(false); setIsConvListOpen((v) => !v) } },
            { id: 'projects', label: 'Projects', run: () => { setShowPalette(false); setMainView('projects'); setActiveTab('projects') } },
            { id: 'office', label: '3D Office / HiveOffice', run: () => { setShowPalette(false); setMainView('office'); setActiveTab('office') } },
            { id: 'settings', label: 'Settings', hint: 'Ctrl+,', run: () => { setShowPalette(false); setShowSettings(true) } },
          ]}
        />
      )}

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
      {false && showProjects && (
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


