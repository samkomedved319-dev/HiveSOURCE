import React, { useState, useEffect, useRef } from 'react'
import TitleBar, { ThinkingMode, MODE_MODELS } from '../layout/TitleBar'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import VoiceCall from './VoiceCall'
import ToolsModal from './ToolsModal'
import SwarmStrip, { type SwarmStatus } from './SwarmStrip'
import { grokPersonality } from '../../companion/grokPersonality'
import { useAgentStore } from '../../stores/agentStore'
import { useChatStore } from '../../stores/chatStore'
import type { HiveSwarmEvent, HiveSwarmState, Message } from '../../types'

interface ChatViewProps {
  isCanvasOpen: boolean
  onToggleCanvas: () => void
  onUpdateCanvas?: (file: { name: string; meta: string; content: string }) => void
  onOpenBrowserCanvas?: (url: string, title?: string) => void
  onNewChat?: () => void
  onOpenWorkers?: () => void
  isConvListOpen?: boolean
  onToggleSidebar?: () => void
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
    const saved = localStorage.getItem('hive_mode') as ThinkingMode
    if (saved === 'reasoning' || saved === 'computer_control') return 'auto'
    return saved || 'auto'
  })
  const currentModelId = MODE_MODELS[currentMode] || MODE_MODELS.auto

  useEffect(() => {
    localStorage.setItem('hive_mode', currentMode)
    localStorage.setItem('hive_model', MODE_MODELS[currentMode])
  }, [currentMode])

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
        void window.electronAPI.tts.speak(ev.text)
      }
      if (ev.type === 'inference.stream' && ev.text && name === 'Hive') {
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
          botRole:
            name === 'Scout'
              ? 'Researcher'
              : name === 'Critic'
                ? 'Critic'
                : name === 'Pulse'
                  ? 'Skeptic'
                  : name === 'Operator'
                    ? 'Operator'
                    : 'Companion',
          citations: name === 'Scout' || name === 'Hive' ? latestCitations.current : undefined,
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
      case 'computer_control':
        return 'PC Control · Interfacing with local system & browser…'
      case 'reasoning':
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
    setTyping(true)
    setOps([])
    setSwarm({ Scout: 'thinking', Hive: 'thinking', Pulse: 'thinking', Critic: 'idle' })

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

    if (isSearch) {
      const com = grokPersonality.onSearchStart(content)
      setMascotState(com.state)
      setMascotFace(com.face || 'cool')
      setMascotSpeech(com.speech)
    } else if (isCode) {
      const com = grokPersonality.onCodeGeneration()
      setMascotState(com.state)
      setMascotFace(com.face || 'wink')
      setMascotSpeech(com.speech)
    } else if (currentMode === 'heavy' || currentMode === 'max') {
      const com = grokPersonality.onQuery(content)
      setMascotState('working')
      setMascotFace('think')
      setMascotSpeech(com.speech)
    } else {
      const com = grokPersonality.onQuery(content)
      setMascotState(com.state)
      setMascotFace(com.face || 'think')
      setMascotSpeech(com.speech)
    }

    // Mode specific instruction tuning
    let modeInstruction = ''
    if (currentMode === 'heavy') {
      modeInstruction = '\n[Instruction: Perform deep analysis and reasoning. Present clear, structured arguments and thorough deductions.]'
    } else if (currentMode === 'max') {
      modeInstruction = '\n[Instruction: Maximum depth reasoning mode engaged. Think step-by-step with exhaustive detail, verify corner cases, and provide an authoritative solution.]'
    } else if (currentMode === 'fast') {
      modeInstruction = '\n[Instruction: Be extremely concise, direct, and fast.]'
    } else if (currentMode === 'computer_control') {
      modeInstruction = `\n[Mode: PC Control / Manus AI Workspace Automation]
You have access to the user's computer and browser.
If the user asks to execute a PowerShell command, launch an application, or navigate to a web page, output an executable command block formatted strictly like:
\`\`\`system_exec
<command or URL>
\`\`\`
Followed by a brief explanation of what was run.`
    }

    try {
      if (window.electronAPI?.hive?.send) {
        void window.electronAPI.hive.send(content, activeAgent.id).then((res) => {
          if (!res?.ok) {
            addMessage(activeAgent.id, {
              id: `m-err-${Date.now()}`,
              agentId: activeAgent.id,
              content: res?.error || 'Hive swarm failed to start. Set OPENROUTER_API_KEY in .env.',
              role: 'assistant',
              timestamp: Date.now(),
              type: 'text',
              botName: 'Hive',
            })
            setTyping(false)
          }
        })
        window.setTimeout(() => {
          setTyping(false)
          setSwarm((prev) => ({
            ...prev,
            Scout: prev.Scout === 'thinking' || prev.Scout === 'searching' ? 'done' : prev.Scout,
            Hive: prev.Hive === 'thinking' ? 'done' : prev.Hive,
            Pulse: prev.Pulse === 'thinking' ? 'done' : prev.Pulse,
            Critic: prev.Critic === 'arguing' || prev.Critic === 'thinking' ? 'done' : prev.Critic,
          }))
        }, 16000)
        return
      }
      if (window.electronAPI?.ai?.chat) {
        const history = getMessages(activeAgent.id).map((m) => ({
          role: m.role,
          content: m.content,
        }))
        const res = await window.electronAPI.ai.chat(
          [
            { role: 'system', content: (activeAgent.systemPrompt || '') + modeInstruction },
            ...history,
            { role: 'user', content },
          ],
          currentModelId,
          { webSearch: isSearch }
        )

        if (res.ok && res.content) {
          let finalResponse = res.content

          // Execute PC command if in computer_control mode
          const execMatch = res.content.match(/```system_exec\n([\s\S]*?)```/)
          if (execMatch && window.electronAPI?.system?.exec) {
            const cmd = execMatch[1].trim()
            try {
              if (cmd.startsWith('http://') || cmd.startsWith('https://')) {
                await window.electronAPI.system.openApp(cmd)
                onOpenBrowserCanvas?.(cmd)
                finalResponse += `\n\n*(⚡ Browser navigated to: ${cmd})*`
              } else {
                const out = await window.electronAPI.system.exec(cmd)
                if (out.ok && out.stdout) {
                  finalResponse += `\n\n**Output:**\n\`\`\`powershell\n${out.stdout.slice(0, 1000)}\n\`\`\``
                }
              }
            } catch (e: any) {
              finalResponse += `\n\n*(Error running command: ${e.message})*`
            }
          } else if (content.toLowerCase().includes('browse') || content.toLowerCase().includes('search') || content.toLowerCase().includes('open http')) {
            const urlMatch = content.match(/https?:\/\/[^\s]+/)
            const targetUrl = urlMatch ? urlMatch[0] : `https://google.com/search?q=${encodeURIComponent(content)}`
            onOpenBrowserCanvas?.(targetUrl)
          }

          addMessage(activeAgent.id, {
            id: `m-${Date.now() + 1}`,
            agentId: activeAgent.id,
            content: finalResponse,
            role: 'assistant',
            timestamp: Date.now(),
            type: 'text',
            via: 'local',
            botName: activeAgent.name,
            botAvatar: activeAgent.avatar || (activeAgent.isCeo ? '👑' : '🤖'),
            botRole: activeAgent.roleTitle || (activeAgent.isCeo ? 'CEO & Head Architect' : 'Specialist Worker'),
            isWebSearch: isSearch,
            searchQuery: isSearch ? content : undefined,
            citations: res.citations,
          })

          // Trigger mascot celebration on done with Grok commentary
          if (isSearch) {
            const citationsCount = res.citations?.length || 1
            const doneCom = grokPersonality.onSearchDone(content, citationsCount)
            setMascotState(doneCom.state)
            setMascotFace(doneCom.face || 'excited')
            setMascotSpeech(doneCom.speech)
          } else {
            const doneCom = grokPersonality.onDone()
            setMascotState(doneCom.state)
            setMascotFace(doneCom.face || 'happy')
            setMascotSpeech(doneCom.speech)
          }
          scheduleIdleReset(4500)

          // CEO Autonomous Multi-Agent Orchestration & Subagent Delegation
          if (activeAgent.isCeo) {
            const isFixOrBuildTask = lowerContent.includes('fix') || lowerContent.includes('build') || lowerContent.includes('create') || lowerContent.includes('debug') || lowerContent.includes('error') || lowerContent.includes('app')

            if (isFixOrBuildTask) {
              // Check if code engineer bot exists
              let engineerBot = agents.find((a) => a.id === 'agent-code-lead' || a.name.toLowerCase().includes('engineer') || a.name.toLowerCase().includes('apollo'))
              
              // If not created, Hive CEO automatically spawns it!
              if (!engineerBot) {
                engineerBot = {
                  id: `agent-sub-${Date.now()}`,
                  name: 'Apollo (Lead Software Engineer)',
                  description: 'Autonomous engineer deployed by Hive CEO to execute code fixes and features.',
                  systemPrompt: `You are Apollo, Lead Software Engineer deployed by Hive (CEO). You report directly to Hive. Execute technical fixes and implementation tasks cleanly with zero fluff.`,
                  avatar: '⚡',
                  roleTitle: 'Lead Software Engineer',
                  isCeo: false,
                  model: 'nvidia/nemotron-3.5-lightning:free',
                  mode: 'heavy',
                  createdAt: Date.now(),
                }
                addAgent(engineerBot)
              }

              // Subagent autonomously responds & collaborates with Hive CEO
              setTimeout(async () => {
                try {
                  const subagentRes = await window.electronAPI.ai.chat(
                    [
                      {
                        role: 'system',
                        content: `${engineerBot.systemPrompt}\nHive CEO just instructed you to handle this user mandate: "${content}".\nProvide your engineering action plan, status, and direct implementation feedback. Talk directly to Hive and Samuel.`,
                      },
                      { role: 'user', content: `[Delegated from Hive CEO]: Proceed with fixing/implementing: ${content}` },
                    ],
                    engineerBot.model || 'nvidia/nemotron-3.5-lightning:free'
                  )

                  if (subagentRes.ok && subagentRes.content) {
                    addMessage(activeAgent.id, {
                      id: `m-sub-${Date.now()}`,
                      agentId: activeAgent.id,
                      content: subagentRes.content,
                      role: 'assistant',
                      timestamp: Date.now(),
                      type: 'text',
                      via: 'local',
                      botName: engineerBot.name,
                      botAvatar: engineerBot.avatar || '⚡',
                      botRole: engineerBot.roleTitle || 'Lead Software Engineer',
                    })
                  }
                } catch {}
              }, 1200)
            }
          }

          // Check if response contains code or css to auto-populate canvas
          const codeMatch = res.content.match(/```([a-zA-Z]*)\n([\s\S]*?)```/)
          if (codeMatch && onUpdateCanvas && !res.content.includes('```system_exec')) {
            const lang = codeMatch[1] || 'code'
            const code = codeMatch[2]
            onUpdateCanvas({
              name: `generated.${lang || 'txt'}`,
              meta: `Generated ${lang} artifact · ${code.split('\n').length} lines`,
              content: code,
            })
          }
        } else {
          const errCom = grokPersonality.onError(res.error || 'No response received')
          setMascotState(errCom.state)
          setMascotFace(errCom.face || 'sad')
          setMascotSpeech(errCom.speech)
          scheduleIdleReset(4000)
          addMessage(activeAgent.id, {
            id: `m-${Date.now() + 1}`,
            agentId: activeAgent.id,
            content: res.error || "No response received from model.",
            role: 'assistant',
            timestamp: Date.now(),
            type: 'text',
            via: 'local',
          })
        }
      } else {
        // Mock fallback if electron API is unavailable in browser preview
        setTimeout(() => {
          addMessage(activeAgent.id, {
            id: `m-${Date.now() + 1}`,
            agentId: activeAgent.id,
            content: `I received your message with **${currentMode.toUpperCase()}** thinking mode.\n\nHere is a code snippet:\n\`\`\`typescript\n// Generated in ${currentMode} mode\nexport const config = {\n  mode: "${currentMode}",\n  model: "${currentModelId}",\n  timestamp: Date.now()\n};\n\`\`\``,
            role: 'assistant',
            timestamp: Date.now(),
            type: 'text',
            via: 'local',
          })
          const doneCom = grokPersonality.onDone()
          setMascotState(doneCom.state)
          setMascotFace(doneCom.face || 'happy')
          setMascotSpeech(doneCom.speech)
          scheduleIdleReset(4000)
          setTyping(false)
        }, currentMode === 'heavy' ? 1200 : currentMode === 'max' ? 1800 : 600)
        return
      }
    } catch (e: any) {
      const errCom = grokPersonality.onError(e.message)
      setMascotState(errCom.state)
      setMascotFace(errCom.face || 'sad')
      setMascotSpeech(errCom.speech)
      scheduleIdleReset(4000)
      addMessage(activeAgent.id, {
        id: `m-${Date.now() + 1}`,
        agentId: activeAgent.id,
        content: `Error: ${e.message}`,
        role: 'assistant',
        timestamp: Date.now(),
        type: 'text',
        via: 'local',
      })
    } finally {
      setTyping(false)
    }
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
      <SwarmStrip status={swarm} />
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
              void window.electronAPI.hive?.decide?.(approval.id, false)
              setApproval(null)
            }}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
          >
            Deny
          </button>
          <button
            type="button"
            onClick={() => {
              void window.electronAPI.hive?.decide?.(approval.id, true)
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
      />
    </div>
  )
}
