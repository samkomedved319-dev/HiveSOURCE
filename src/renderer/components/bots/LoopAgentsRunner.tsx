import { useEffect, useRef } from 'react'
import { useAgentStore } from '../../stores/agentStore'
import { useChatStore } from '../../stores/chatStore'
import { FREE_GLM } from '../../lib/freeModels'
import { mentionHandle } from './botLibrary'

/** Runs only bots the user marked as looping in the Bots panel. Never on "hey?". */
export default function LoopAgentsRunner() {
  const agents = useAgentStore((s) => s.agents)
  const addMessage = useChatStore((s) => s.addMessage)
  const lastTick = useRef<Record<string, number>>({})

  useEffect(() => {
    const loops = agents.filter((a) => a.kind === 'loop' && a.looping && (a.loopGoal || '').trim())
    if (!loops.length) return
    const id = window.setInterval(() => {
      const now = Date.now()
      for (const a of loops) {
        const every = Math.max(60_000, a.loopEveryMs || 120_000)
        const prev = lastTick.current[a.id] || 0
        if (now - prev < every) continue
        lastTick.current[a.id] = now
        const goal = (a.loopGoal || '').trim()
        void (async () => {
          try {
            const res = await window.electronAPI?.ai?.chat?.(
              [
                {
                  role: 'system',
                  content:
                    a.systemPrompt ||
                    'You are a Hive loop agent. One short status. No swarm. No filler.',
                },
                { role: 'user', content: goal },
              ],
              a.model || FREE_GLM,
              { webSearch: false }
            )
            if (res?.ok && res.content) {
              addMessage(a.id, {
                id: `loop-${a.id}-${now}`,
                agentId: a.id,
                content: res.content,
                role: 'assistant',
                timestamp: now,
                type: 'text',
                botName: mentionHandle(a.name),
                botAvatar: a.avatar,
                botRole: a.roleTitle || 'Loop',
              })
            }
          } catch {}
        })()
      }
    }, 15_000)
    return () => window.clearInterval(id)
  }, [agents, addMessage])

  return null
}
