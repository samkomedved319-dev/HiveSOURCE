import React, { useState, useEffect, useRef } from 'react'
import TitleBar, { ThinkingMode, MODE_MODELS } from '../layout/TitleBar'
import { FREE_GLM } from '../../lib/freeModels'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import VoiceCall from './VoiceCall'
import ToolsModal from './ToolsModal'
import SwarmStrip, { type SwarmStatus } from './SwarmStrip'
import LoopAgentsBar from '../bots/LoopAgentsBar'
import CrewPanel from '../layout/CrewPanel'
import { grokPersonality } from '../../companion/grokPersonality'
import { useAgentStore } from '../../stores/agentStore'
import { useChatStore } from '../../stores/chatStore'
import type { HiveSwarmEvent, HiveSwarmState, Message, Agent } from '../../types'
import { mentionHandle } from '../bots/botLibrary'
import type { Conversation } from '../layout/ConversationList'
import { emitTitleChat } from '../../chatTitle'
import { isTrivialChat, wantsSwarm } from '../../lib/chatIntent'

function parseMentionedAgents(content: string, list: Agent[]): Agent[] {
  const tags = [...content.matchAll(/@([A-Za-z0-9_-]+)/g)].map((m) => m[1].toLowerCase())
  if (!tags.length) return []
  return list.filter((a) => {
    const handle = mentionHandle(a.name).toLowerCase()
    const first = (a.name.split(/[\s(/]/)[0] || '').toLowerCase()
    const role = (a.roleTitle || '').toLowerCase().replace(/\s+/g, '')
    const idBit = a.id.replace(/^agent-|^lib-/, '').toLowerCase()
    return tags.some(
      (t) =>
        t === handle ||
        t === first ||
        handle.startsWith(t) ||
        first.startsWith(t) ||
        idBit.startsWith(t) ||
        role.startsWith(t) ||
        t.startsWith(handle) ||
        t.startsWith(first)
    )
  })
}

interface ChatViewProps {
  isCanvasOpen: boolean
  onToggleCanvas: () => void
  onUpdateCanvas?: (file: { name: string; meta: string; content: string }) => void
  onOpenBrowserCanvas?: (url: string, title?: string) => void
  onNewChat?: () => void
  onOpenWorkers?: () => void
  isConvListOpen?: boolean
  onToggleSidebar?: () => void
  conversation?: Conversation | null
}

export default function ChatView({
  isCanvasOpen,
  onToggleCanvas,
  onUpdateCanvas,
  onOpenBrowserCanvas,
  onNewChat,
  onOpenWorkers,
  isConvListOpen,
  onToggleSidebar,
  conversation,
}: ChatViewProps) {
  const { activeAgent, agents, addAgent } = useAgentStore()
  const { addMessage, upsertMessage, getMessages, clearMessages, setTyping } = useChatStore()
  const [showVoice, setShowVoice] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [shareStatus, setShareStatus] = useState<string | null>(null)

  // Mascot Companion State
  const [mascotState, setMascotState] = useState<'idle' | 'thinking' | 'searching' | 'coding' | 'working' | 'done' | 'error' | 'sleep'>('idle')
  const [mascotSpeech, setMascotSpeech] = useState<string | null>(null)
  const [mascotFace, setMascotFace] = useState<any>('happy')
  const [swarm, setSwarm] = useState<Record<string, SwarmStatus>>({
    Scout: 'idle',
    Hive: 'idle',
    Pulse: 'idle',
    Critic: 'idle',
  })
  const [ops, setOps] = useState<HiveSwarmEvent[]>([])
  const [approval, setApproval] = useState<{ id: string; text: string } | null>(null)
  const latestCitations = useRef<HiveSwarmState['citations']>([])
  const activeIdRef = useRef<string | undefined>(undefined)

  // Idle reset timer: a stale reset from an earlier message must never
  // clobber the state of a newer one, so each send clears the previous.
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const directModeRef = useRef(false)
  const stickyAgentsRef = useRef<Agent[]>([])
  const sendGenRef = useRef(0)
  const conversationRef = useRef(conversation)
  conversationRef.current = conversation
  const scheduleIdleReset = (ms: number) => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      setMascotState('idle')
      setMascotFace('happy')
    }, ms)
  }
  useEffect(() => {
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])

  const [currentMode, setCurrentMode] = useState<ThinkingMode>(() => {
    const saved = localStorage.getItem('hive_mode') || ''
    // Migrate legacy mode ids from older builds to the current 4-mode set.
    if (saved === 'reasoning' || saved === 'computer_control') return 'auto'
    if (saved === 'fast' || saved === 'auto' || saved === 'heavy' || saved === 'max') {
      return saved as ThinkingMode
    }
    return 'auto'
  })
  const [currentModelId, setCurrentModelId] = useState(() => FREE_GLM)

  useEffect(() => {
    localStorage.setItem('hive_mode', currentMode)
  }, [currentMode])

  useEffect(() => {
    const syncModel = () => {
      const saved = localStorage.getItem('hive_model') || ''
      if (saved === FREE_GLM) setCurrentModelId(saved)
      else setCurrentModelId(FREE_GLM)
    }
    window.addEventListener('hive:model-changed', syncModel)
    window.addEventListener('storage', syncModel)
    return () => {
      window.removeEventListener('hive:model-changed', syncModel)
      window.removeEventListener('storage', syncModel)
    }
  }, [])

  useEffect(() => {
    activeIdRef.current = activeAgent?.id
  }, [activeAgent?.id])

  useEffect(() => {
    const mark = (name: string, st: SwarmStatus) => {
      setSwarm((prev) => ({ ...prev, [name]: st }))
    }
    const offEvent = window.electronAPI?.hive?.onEvent?.((ev: HiveSwarmEvent) => {
      const name = ev.producerName
      setOps((prev) => [...prev.slice(-40), ev])
      if (ev.type === 'inference.started') mark(name, name === 'Scout' ? 'searching' : 'thinking')
      if (ev.type === 'function_call.started') mark(name === 'Sentry' ? 'Scout' : name, 'searching')
      if (ev.type === 'model.answer') mark(name, 'done')
      if (ev.type === 'interception.started') mark('Hive', 'thinking')
      if (ev.type === 'hive.approve' && ev.approvalId) {
        setApproval({ id: ev.approvalId, text: ev.text || 'Allow machine action?' })
      }
      if (ev.type === 'hive.error') {
        mark('Hive', 'error')
        setTyping(false)
      }
      if (ev.type === 'hive.speak' && ev.text && window.electronAPI?.tts?.speak) {
        void window.electronAPI?.tts?.speak(ev.text)
      }
      if (ev.type === 'inference.stream' && ev.text && name === 'Hive') {
        if (directModeRef.current) return
        setTyping(false)
        const agentId = activeIdRef.current
        if (!agentId) return
        const id = `stream-${ev.producerId}`
        const prev = getMessages(agentId).find((m) => m.id === id)
        upsertMessage(agentId, {
          id,
          agentId,
          content: (prev?.content || '') + ev.text,
          role: 'assistant',
          timestamp: ev.occurredAt || Date.now(),
          type: 'text',
          via: 'local',
          botName: name,
          botAvatar: useAgentStore.getState().activeAgent?.avatar,
        })
      }
      if (ev.type === 'model.answer' && ev.text && name === 'Hive') {
        if (directModeRef.current) return
        const agentId = activeIdRef.current
        if (!agentId) return
        upsertMessage(agentId, {
          id: `stream-${ev.producerId}`,
          agentId,
          content: ev.text,
          role: 'assistant',
          timestamp: ev.occurredAt || Date.now(),
          type: 'text',
          via: 'local',
          botName: name,
          botAvatar: useAgentStore.getState().activeAgent?.avatar,
          botRole: 'Companion',
          citations: latestCitations.current,
        })
        if (name === 'Hive') setTyping(false)
      }
    })
    const offState = window.electronAPI?.hive?.onState?.((state: HiveSwarmState) => {
      if (state.citations) latestCitations.current = state.citations
      if (state.mood === 'searching') mark('Scout', 'searching')
      if (state.mood === 'thinking') mark('Hive', 'thinking')
      if (state.mood === 'arguing') mark('Critic', 'arguing')
      if (state.mood === 'done') {
        mark('Scout', 'done')
        mark('Hive', 'done')
        mark('Critic', 'done')
        setTyping(false)
        scheduleIdleReset(4500)
      }
      if (state.mood === 'searching') {
        setMascotState('searching')
        setMascotFace('cool')
      } else if (state.mood === 'thinking' || state.mood === 'arguing') {
        setMascotState('thinking')
        setMascotFace('think')
      } else if (state.mood === 'done') {
        setMascotState('done')
        setMascotFace('happy')
      } else if (state.mood === 'error') {
        setMascotState('error')
        setMascotFace('sad')
      }
    })
    return () => {
      try {
        offEvent?.()
        offState?.()
      } catch {}
    }
  }, [addMessage, setTyping])

  const getThinkingLabel = () => {
    switch (currentMode) {
      case 'fast':
        return 'Generating quick response…'
      case 'heavy':
        return 'Heavy Thinking · Analyzing multi-step reasoning…'
      case 'max':
        return 'Max Thinking · Performing exhaustive reflection…'
      case 'auto':
      default:
        return 'Thinking…'
    }
  }

  const handleSend = async (content: string) => {
    if (!activeAgent) return
    // New message cancels any pending idle reset from the previous one.
    if (idleTimer.current) clearTimeout(idleTimer.current)

    const userMsg: Message = {
      id: `m-${Date.now()}`,
      agentId: activeAgent.id,
      content,
      role: 'user',
      timestamp: Date.now(),
      type: 'text',
      via: 'local',
    }
    addMessage(activeAgent.id, userMsg)
    emitTitleChat(content)
    setTyping(true)
    const gen = ++sendGenRef.current

    const conv = conversationRef.current
    const mentioned = parseMentionedAgents(content, agents)
    const isGroup = conv?.kind === 'group' || conv?.id?.startsWith('g-') || (conv?.agentIds?.length || 0) > 1
    const groupMembers = (conv?.agentIds || [])
      .map((id) => agents.find((a) => a.id === id))
      .filter(Boolean) as Agent[]
    const threadAgent = conv?.agentId ? agents.find((a) => a.id === conv.agentId) : undefined

    const runDirect = async (targets: Agent[]) => {
      directModeRef.current = true
      stickyAgentsRef.current = targets
      const unique = targets.filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
      if (!unique.length) {
        addMessage(activeAgent.id, {
          id: `m-err-${Date.now()}`,
          agentId: activeAgent.id,
          content: 'No bot matched that @mention. Try @Athena, @Apollo, or @Hive.',
          role: 'assistant',
          timestamp: Date.now(),
          type: 'text',
          botName: 'Hive',
        })
        setTyping(false)
        return
      }
      try {
        for (const agent of unique) {
          if (gen !== sendGenRef.current) return
          try {
            const history = getMessages(activeAgent.id)
              .filter((m) => m.role === 'user' || m.role === 'assistant')
              .slice(-16)
              .map((m) => ({ role: m.role, content: m.content }))
            const timeout = new Promise<{ ok: false; error: string }>((resolve) =>
              setTimeout(() => resolve({ ok: false, error: 'Timed out waiting for a reply.' }), 45000)
            )
            const call = window.electronAPI?.ai?.chat?.(
              [{ role: 'system', content: agent.systemPrompt }, ...history],
              agent.model || currentModelId,
              { webSearch: false }
            ) || Promise.resolve({ ok: false, error: 'AI bridge is not ready.' })
            const res = await Promise.race([call, timeout])
            if (gen !== sendGenRef.current) return
            if (res?.ok && res.content) {
              addMessage(activeAgent.id, {
                id: `m-${agent.id}-${Date.now()}`,
                agentId: activeAgent.id,
                content: res.content,
                role: 'assistant',
                timestamp: Date.now(),
                type: 'text',
                botName: mentionHandle(agent.name),
                botAvatar: agent.avatar,
                botRole: agent.roleTitle,
                citations: res.citations,
              })
            } else {
              addMessage(activeAgent.id, {
                id: `m-err-${Date.now()}`,
                agentId: activeAgent.id,
                content: (res && 'error' in res && res.error) || `${mentionHandle(agent.name)} could not reply. Hive Free may be busy — try again.`,
                role: 'assistant',
                timestamp: Date.now(),
                type: 'text',
                botName: mentionHandle(agent.name),
                botAvatar: agent.avatar,
              })
            }
          } catch (err) {
            addMessage(activeAgent.id, {
              id: `m-err-${Date.now()}`,
              agentId: activeAgent.id,
              content: err instanceof Error ? err.message : 'Reply failed',
              role: 'assistant',
              timestamp: Date.now(),
              type: 'text',
              botName: mentionHandle(agent.name),
            })
          }
        }
      } finally {
        if (gen === sendGenRef.current) setTyping(false)
      }
    }

    if (mentioned.length) {
      await runDirect(mentioned)
      return
    }
    if (isGroup) {
      const fallback = stickyAgentsRef.current.length
        ? stickyAgentsRef.current
        : groupMembers.length
          ? groupMembers
          : agents.filter((a) => !a.isCeo).slice(0, 3)
      await runDirect(fallback.length ? fallback : [activeAgent])
      return
    }
    if (threadAgent && !threadAgent.isCeo) {
      await runDirect([threadAgent])
      return
    }
    if (stickyAgentsRef.current.length && !activeAgent.isCeo) {
      await runDirect(stickyAgentsRef.current)
      return
    }
    if (!activeAgent.isCeo) {
      await runDirect([activeAgent])
      return
    }

    const trivial = isTrivialChat(content)
    const swarmOn = !trivial && wantsSwarm(content)

    setOps([])
    setSwarm(
      swarmOn
        ? { Scout: 'thinking', Hive: 'thinking', Pulse: 'thinking', Critic: 'idle' }
        : { Scout: 'idle', Hive: 'idle', Pulse: 'idle', Critic: 'idle' }
    )
    directModeRef.current = false
    stickyAgentsRef.current = []

    // Map intent to Grok personality commentary & Hex mascot state
    const lowerContent = content.toLowerCase()
    const isSearch =
      lowerContent.includes('search') ||
      lowerContent.includes('browse') ||
      lowerContent.includes('find') ||
      lowerContent.includes('who is') ||
      lowerContent.includes('what is') ||
      lowerContent.includes('latest') ||
      lowerContent.includes('news') ||
      lowerContent.includes('lookup') ||
      activeAgent.id === 'agent-researcher'

    const isCode =
      lowerContent.includes('code') ||
      lowerContent.includes('fix') ||
      lowerContent.includes('build') ||
      lowerContent.includes('write') ||
      lowerContent.includes('function') ||
      lowerContent.includes('script')

    if (isSearch && !trivial) {
      const com = grokPersonality.onSearchStart(content)
      setMascotState(com.state)
      setMascotFace(com.face || 'cool')
      setMascotSpeech(com.speech)
    } else if (isCode && !trivial) {
      const com = grokPersonality.onCodeGeneration()
      setMascotState(com.state)
      setMascotFace(com.face || 'wink')
      setMascotSpeech(com.speech)
    } else if (currentMode === 'heavy' || currentMode === 'max') {
      const com = grokPersonality.onQuery(content)
      setMascotState('working')
      setMascotFace('think')
      setMascotSpeech(trivial ? '' : com.speech)
    } else {
      setMascotState('thinking')
      setMascotFace('think')
      setMascotSpeech(trivial ? null : grokPersonality.onQuery(content).speech)
    }

    // Mode specific instruction tuning
    let modeInstruction = ''
    if (trivial) {
      modeInstruction = '\n[Instruction: 1–2 short sentences. No memories, no tools, no essays.]'
    } else if (currentMode === 'heavy') {
      modeInstruction = '\n[Instruction: Perform deep analysis and reasoning. Present clear, structured arguments and thorough deductions.]'
    } else if (currentMode === 'max') {
      modeInstruction = '\n[Instruction: Maximum depth reasoning mode engaged. Think step-by-step with exhaustive detail, verify corner cases, and provide an authoritative solution.]'
    } else if (currentMode === 'fast') {
      modeInstruction = '\n[Instruction: Be extremely concise, direct, and fast.]'
    }

    try {
      if (swarmOn && window.electronAPI?.hive?.send) {
        void window.electronAPI?.hive?.send(content, activeAgent.id).catch(() => {})
      }
      const history = trivial
        ? []
        : getMessages(activeAgent.id)
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .slice(-10)
            .map((m) => ({ role: m.role, content: String(m.content || '').slice(0, 1200) }))
      const timeout = new Promise<{ ok: false; error: string }>((resolve) =>
        setTimeout(() => resolve({ ok: false, error: 'Timed out waiting for a reply.' }), trivial ? 20000 : 45000)
      )
      const call =
        window.electronAPI?.ai?.chat?.(
          [
            {
              role: 'system',
              content: trivial
                ? 'You are Hive. Reply in one or two short sentences. Do not recall old chats. Do not use tools.'
                : (activeAgent.systemPrompt || 'You are Hive.') + modeInstruction,
            },
            ...history,
            { role: 'user', content },
          ],
          currentModelId,
          { webSearch: isSearch && !trivial, thinking: currentMode === 'heavy' || currentMode === 'max' }
        ) || Promise.resolve({ ok: false, error: 'AI bridge is not ready.' })
      const res = await Promise.race([call, timeout])
      if (gen !== sendGenRef.current) return
      if (res?.ok && res.content) {
        addMessage(activeAgent.id, {
          id: `m-${Date.now() + 1}`,
          agentId: activeAgent.id,
          content: res.content,
          role: 'assistant',
          timestamp: Date.now(),
          type: 'text',
          via: 'local',
          botName: activeAgent.name.split('(')[0].trim() || 'Hive',
          botAvatar: activeAgent.avatar || '👑',
          botRole: activeAgent.roleTitle,
          isWebSearch: isSearch,
          searchQuery: isSearch ? content : undefined,
          citations: res.citations,
        })
      } else {
        addMessage(activeAgent.id, {
          id: `m-err-${Date.now()}`,
          agentId: activeAgent.id,
          content: (res && 'error' in res && res.error) || 'No reply. Hive Free may be busy — try again.',
          role: 'assistant',
          timestamp: Date.now(),
          type: 'text',
          botName: 'Hive',
        })
      }
    } catch (err) {
      if (gen === sendGenRef.current) {
        addMessage(activeAgent.id, {
          id: `m-err-${Date.now()}`,
          agentId: activeAgent.id,
          content: err instanceof Error ? err.message : 'Reply failed',
          role: 'assistant',
          timestamp: Date.now(),
          type: 'text',
          botName: 'Hive',
        })
      }
    } finally {
      if (gen === sendGenRef.current) {
        setTyping(false)
        if (!swarmOn) {
          setSwarm({ Scout: 'idle', Hive: 'idle', Pulse: 'idle', Critic: 'idle' })
        } else {
          setSwarm((prev) => ({
            ...prev,
            Scout: 'done',
            Hive: 'done',
            Pulse: 'done',
            Critic: prev.Critic === 'idle' ? 'idle' : 'done',
          }))
        }
      }
    }
    return
  }

  const handleAttachFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      if (text && onUpdateCanvas) {
        onUpdateCanvas({
          name: file.name,
          meta: `Uploaded file · ${file.name.split('.').pop()?.toUpperCase()} · ${(file.size / 1024).toFixed(1)} KB`,
          content: text,
        })
        if (!isCanvasOpen) {
          onToggleCanvas()
        }
      }
    }
    reader.readAsText(file)
  }

  const handleShare = async () => {
    if (!activeAgent) return
    const msgs = getMessages(activeAgent.id)
    if (msgs.length === 0) {
      setShareStatus('Nothing to share yet')
      setTimeout(() => setShareStatus(null), 2000)
      return
    }
    const transcript = msgs
      .map((m) => `[${m.role.toUpperCase()}]:\n${m.content}`)
      .join('\n\n---\n\n')
    try {
      await navigator.clipboard.writeText(transcript)
      setShareStatus('Chat copied to clipboard!')
    } catch {
      setShareStatus('Failed to copy')
    }
    setTimeout(() => setShareStatus(null), 2500)
  }

  const handleToolAction = (action: 'code' | 'clear' | 'voice' | 'telegram') => {
    if (action === 'code') {
      if (!isCanvasOpen) onToggleCanvas()
    } else if (action === 'voice') {
      setShowVoice(true)
    } else if (action === 'clear') {
      if (activeAgent) {
        clearMessages(activeAgent.id)
      }
    }
  }

  const messages = activeAgent ? getMessages(activeAgent.id) : []

  return (
    <div style={{ display: 'flex', flex: 1, minWidth: 0, minHeight: 0, height: '100%' }}>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
        background: 'var(--bg)',
        height: '100%',
        flex: 1,
        position: 'relative',
      }}
    >
      <TitleBar
        currentMode={currentMode}
        onChangeMode={setCurrentMode}
        isCanvasOpen={isCanvasOpen}
        onToggleCanvas={onToggleCanvas}
        onShare={handleShare}
        onNewChat={onNewChat}
        onOpenWorkers={onOpenWorkers}
        isConvListOpen={isConvListOpen}
        onToggleSidebar={onToggleSidebar}
        onFeedback={() => window.dispatchEvent(new CustomEvent('hive:feedback'))}
      />
      <LoopAgentsBar />
      {!isCanvasOpen && <SwarmStrip status={swarm} />}
      {approval && (
        <div
          style={{
            margin: '8px 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            border: '1px solid #F97316',
            background: 'rgba(249,115,22,0.1)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 12,
          }}
        >
          <span style={{ flex: 1, color: '#FDBA74' }}>Operator wants: {approval.text}</span>
          <button
            type="button"
            onClick={() => {
              void window.electronAPI?.hive?.decide?.(approval.id, false)
              setApproval(null)
            }}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
          >
            Deny
          </button>
          <button
            type="button"
            onClick={() => {
              void window.electronAPI?.hive?.decide?.(approval.id, true)
              setApproval(null)
            }}
            style={{ background: '#F97316', border: 'none', color: '#111', fontWeight: 650, borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
          >
            Allow
          </button>
        </div>
      )}

      {shareStatus && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 24,
            zIndex: 40,
            background: 'var(--panel)',
            border: '1px solid var(--accent)',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 12,
            color: 'var(--accent)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            animation: 'rise .3s var(--ease) forwards',
          }}
        >
          {shareStatus}
        </div>
      )}

      {showVoice && (
        <VoiceCall onClose={() => setShowVoice(false)} />
      )}

      {showTools && (
        <ToolsModal
          onClose={() => setShowTools(false)}
          onSelectAction={handleToolAction}
        />
      )}

      <MessageList typingLabel={getThinkingLabel()} mascotState={mascotState} onSuggest={handleSend} />

      <ChatInput
        onSend={handleSend}
        onAttach={handleAttachFile}
        onOpenTools={() => setShowTools(true)}
        onOpenVoice={() => setShowVoice(true)}
        mentionables={
          conversation?.kind === 'group' || conversation?.id?.startsWith('g-')
            ? agents.filter((a) => !(conversation.agentIds || []).length || (conversation.agentIds || []).includes(a.id))
            : agents
        }
      />
    </div>
    {isCanvasOpen && <CrewPanel status={swarm} onClose={onToggleCanvas} />}
    </div>
  )
}
