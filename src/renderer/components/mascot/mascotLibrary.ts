import type { ShapeId } from '../../bot/skins'
import type { StateId } from '../../bot/states'

/** Premade Bloub skins — official shapes + palette from bloub.vercel.app */
export interface BloubMascot {
  id: string
  name: string
  hint: string
  ink: string
  paper: string
  shape: ShapeId
  /** Rest face. Action poses are applied live (think / search / done). */
  pose: StateId
}

export const BLOUB_MASCOTS: BloubMascot[] = [
  { id: 'bloub-ink', name: 'Bloub', hint: 'Classic ink blob', ink: '#0a0a0c', paper: '#f1efe9', shape: 'cercle', pose: 'idle' },
  { id: 'bloub-gold', name: 'Hive', hint: 'Gold hex CEO', ink: '#f0b429', paper: '#0a0a0c', shape: 'hexagone', pose: 'idle' },
  { id: 'bloub-orange', name: 'Buddy', hint: 'Cursor companion', ink: '#f08a24', paper: '#0a0a0c', shape: 'galet', pose: 'idle' },
  { id: 'bloub-blue', name: 'Scout', hint: 'Researcher', ink: '#3b93f0', paper: '#0a0a0c', shape: 'squircle', pose: 'idle' },
  { id: 'bloub-rose', name: 'Pulse', hint: 'Skeptic', ink: '#e152b0', paper: '#0a0a0c', shape: 'goutte', pose: 'idle' },
  { id: 'bloub-violet', name: 'Critic', hint: 'Reviewer', ink: '#8b5cf6', paper: '#0a0a0c', shape: 'triangle', pose: 'idle' },
  { id: 'bloub-green', name: 'Operator', hint: 'Machine hands', ink: '#3ecf8e', paper: '#0a0a0c', shape: 'capsule', pose: 'idle' },
  { id: 'bloub-cream', name: 'Ghost', hint: 'Light body', ink: '#f1efe9', paper: '#0a0a0c', shape: 'nuage', pose: 'idle' },
  { id: 'bloub-red', name: 'Sentry', hint: 'Alerts', ink: '#e8483f', paper: '#0a0a0c', shape: 'cercle', pose: 'idle' },
  { id: 'bloub-teal', name: 'Relay', hint: 'Messenger', ink: '#2fbfa0', paper: '#0a0a0c', shape: 'capsule', pose: 'idle' },
  { id: 'bloub-brown', name: 'Pebble', hint: 'Soft galet', ink: '#8b5e3c', paper: '#f1efe9', shape: 'galet', pose: 'idle' },
  { id: 'bloub-gray', name: 'Steel', hint: 'Quiet worker', ink: '#a3a3a3', paper: '#0a0a0c', shape: 'squircle', pose: 'idle' },
]

export const DEFAULT_MASCOT_ID = 'bloub-gold'

const EMOJI_TO_MASCOT: Record<string, string> = {
  '👑': 'bloub-gold',
  '⚡': 'bloub-orange',
  '🔬': 'bloub-blue',
  '🤖': 'bloub-ink',
}

const AGENT_TO_MASCOT: Record<string, string> = {
  'agent-hive-ceo': 'bloub-gold',
  'agent-code-lead': 'bloub-orange',
  'agent-researcher': 'bloub-blue',
}

export function getMascot(id?: string | null): BloubMascot {
  if (id && BLOUB_MASCOTS.some((m) => m.id === id)) {
    return BLOUB_MASCOTS.find((m) => m.id === id)!
  }
  if (id && EMOJI_TO_MASCOT[id]) {
    return BLOUB_MASCOTS.find((m) => m.id === EMOJI_TO_MASCOT[id])!
  }
  return BLOUB_MASCOTS[1]
}

export function resolveAgentMascotId(agent: { id?: string; avatar?: string; name?: string }): string {
  if (agent.avatar && BLOUB_MASCOTS.some((m) => m.id === agent.avatar)) return agent.avatar
  if (agent.avatar && EMOJI_TO_MASCOT[agent.avatar]) return EMOJI_TO_MASCOT[agent.avatar]
  if (agent.id && AGENT_TO_MASCOT[agent.id]) return AGENT_TO_MASCOT[agent.id]
  const n = (agent.name || '').toLowerCase()
  if (n.includes('apollo')) return 'bloub-orange'
  if (n.includes('athena')) return 'bloub-blue'
  if (n.includes('hive')) return 'bloub-gold'
  return DEFAULT_MASCOT_ID
}

export function getBuddyMascotId(): string {
  try {
    return localStorage.getItem('hive_buddy_mascot') || DEFAULT_MASCOT_ID
  } catch {
    return DEFAULT_MASCOT_ID
  }
}
