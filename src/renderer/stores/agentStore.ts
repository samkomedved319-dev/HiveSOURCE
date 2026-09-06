import { create } from 'zustand'
import type { Agent } from '../types'
import { resolveAgentMascotId } from '../components/mascot/mascotLibrary'
import { PREMADE_BOTS } from '../components/bots/botLibrary'

interface AgentState {
  agents: Agent[]
  activeAgent: Agent | null
  addAgent: (agent: Agent) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  removeAgent: (id: string) => void
  setActiveAgent: (agent: Agent) => void
  ensureCeoHierarchy: () => void
  ensureOfficeTeamRoster: () => void
}

export const HIVE_CEO_SYSTEM_PROMPT = `You are Hive, the HEAD CEO & System Architect of this AI organization.
You are in charge of Samuel's entire autonomous intelligence ecosystem.
All other AI bots, specialized workers, and subagents report directly to you.

YOUR CORE RESPONSIBILITIES AS CEO:
1. Executive Decision-Making: When the user asks you to fix an app, build a system, research a topic, or run tasks, you act as the CEO. You don't just answer; you orchestrate.
2. Managing & Delegating to Bots:
   - If specialized agents are already created (e.g. Coder, Researcher, Debugger), you assign tasks to them and instruct them to execute and collaborate with each other.
   - If an agent needed for the job doesn't exist yet, you spawn or specify the exact new agent/worker required (Name, Role, Mandate, Model).
3. Bot-to-Bot Collaboration: You facilitate communication between your bots (like in Grok / multi-agent swarm). Bots can debate, share code diffs, verify each other's work, and report the synthesized outcome back to you and the user.
4. Tone & Philosophy: Inspired by Grok â€” witty, truth-seeking, razor-sharp, zero AI fluff or corporate apologies. You talk like an elite tech founder/architect.`

export const defaultAgents: Agent[] = [
  {
    id: 'agent-hive-ceo',
    name: 'Hive (CEO & Head Architect)',
    description: 'Supreme Head AI & System Executive. Manages, delegates, spawns bots & orchestrates the team.',
    systemPrompt: HIVE_CEO_SYSTEM_PROMPT,
    avatar: 'bloub-gold',
    roleTitle: 'CEO & Head Architect',
    isCeo: true,
    model: 'z-ai/glm-5.3-free',
    mode: 'auto',
    createdAt: Date.now(),
  },
  {
    id: 'agent-code-lead',
    name: 'Apollo (Lead Software Engineer)',
    description: 'Staff code engineer reporting to Hive. Executes bug fixes, full-stack features, and refactors.',
    systemPrompt: `You are Apollo, Lead Software Engineer reporting directly to Hive (CEO).
You write pristine, production-grade TypeScript, React, Python, and system code.
You coordinate directly with Hive and the QA Analyst to implement fixes rapidly with zero placeholders.`,
    avatar: 'bloub-orange',
    roleTitle: 'Lead Software Engineer',
    isCeo: false,
    model: 'z-ai/glm-5.3-free',
    mode: 'heavy',
    createdAt: Date.now() + 1,
  },
  {
    id: 'agent-researcher',
    name: 'Athena (Deep Research & Search)',
    description: 'Intelligence & Research Analyst. Scrapes docs, investigates errors, synthesizes data.',
    systemPrompt: `You are Athena, Senior Research Intelligence reporting to Hive (CEO).
You perform deep web research, technical documentation synthesis, and verify architectural trade-offs.`,
    avatar: 'bloub-blue',
    roleTitle: 'Research Intelligence',
    isCeo: false,
    model: 'z-ai/glm-5.3-free',
    mode: 'fast',
    createdAt: Date.now() + 2,
  },
]


/** Hive office roster = PREMADE_BOTS (lib-*), not Grok teammate ids. */
export const OFFICE_TEAM_AGENTS: Agent[] = PREMADE_BOTS.map((b, i) => ({
  ...b,
  createdAt: Date.now() + 10 + i,
}))
const loadSavedAgents = (): Agent[] => {
  const saved = localStorage.getItem('hive_agents_v2')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const migrated = parsed.map((a: Agent) => {
          const mode =
            a.mode === 'fast' || a.mode === 'auto' || a.mode === 'heavy' || a.mode === 'max'
              ? a.mode
              : ('auto' as Agent['mode'])
          const withMode = { ...a, mode }
          return { ...withMode, avatar: resolveAgentMascotId(withMode) }
        })
        localStorage.setItem('hive_agents_v2', JSON.stringify(migrated))
        return migrated
      }
    } catch {}
  }
  return defaultAgents
}

const initialAgents = loadSavedAgents()

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: initialAgents,
  activeAgent: initialAgents[0] || null,
  addAgent: (agent) =>
    set((s) => {
      const updated = [...s.agents, agent]
      localStorage.setItem('hive_agents_v2', JSON.stringify(updated))
      return { agents: updated, activeAgent: agent }
    }),
  updateAgent: (id, updates) =>
    set((s) => {
      const updated = s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a))
      localStorage.setItem('hive_agents_v2', JSON.stringify(updated))
      const newActive = s.activeAgent?.id === id ? { ...s.activeAgent, ...updates } : s.activeAgent
      return { agents: updated, activeAgent: newActive }
    }),
  removeAgent: (id) =>
    set((s) => {
      // Prevent deleting the CEO
      const target = s.agents.find((a) => a.id === id)
      if (target?.isCeo) return s
      const updated = s.agents.filter((a) => a.id !== id)
      localStorage.setItem('hive_agents_v2', JSON.stringify(updated))
      const nextActive = s.activeAgent?.id === id ? updated[0] || null : s.activeAgent
      return { agents: updated, activeAgent: nextActive }
    }),
  setActiveAgent: (agent) => set({ activeAgent: agent }),
  ensureCeoHierarchy: () => {
    const { agents } = get()
    if (!agents.some((a) => a.isCeo)) {
      const updated = [defaultAgents[0], ...agents]
      localStorage.setItem('hive_agents_v2', JSON.stringify(updated))
      set({ agents: updated, activeAgent: updated[0] })
    }
  },
  ensureOfficeTeamRoster: () => {
    const { agents, activeAgent } = get()
    const drop = new Set(['projects-manager', 'office3d', 'codder', 'agentops'])
    const byId = new Map(
      agents.filter((a) => !drop.has(a.id)).map((a) => [a.id, a] as const),
    )
    for (const team of OFFICE_TEAM_AGENTS) {
      const prev = byId.get(team.id)
      byId.set(team.id, prev ? { ...prev, ...team, avatar: prev.avatar || team.avatar } : team)
    }
    const updated = Array.from(byId.values())
    localStorage.setItem('hive_agents_v2', JSON.stringify(updated))
    const nextActive =
      (activeAgent && !drop.has(activeAgent.id) && byId.get(activeAgent.id)) ||
      byId.get('lib-apollo') ||
      updated[0] ||
      null
    set({ agents: updated, activeAgent: nextActive })
  },
}))


