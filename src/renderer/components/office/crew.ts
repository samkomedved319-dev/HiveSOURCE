import type { HiveSwarmEvent } from '../../types'

export type AgentMood = 'idle' | 'thinking' | 'searching' | 'talking' | 'coding' | 'done'

export type FloorAgent = {
  id: string
  name: string
  color: string
  shirt: string
  pants: string
  hair: string
  job: string
  desk: [number, number, number]
  meet: [number, number, number]
}

export const FLOOR_CREW: FloorAgent[] = [
  { id: 'scout', name: 'Scout', color: '#5B8DEF', shirt: '#1e3a5f', pants: '#0f172a', hair: '#1a1a1a', job: 'search', desk: [-7.2, 0, -2.6], meet: [6.2, 0, -3.2] },
  { id: 'athena', name: 'Athena', color: '#38BDF8', shirt: '#0e4a6e', pants: '#1a1a2e', hair: '#3E2723', job: 'intel', desk: [-3.6, 0, -2.6], meet: [7.4, 0, -3.2] },
  { id: 'hive', name: 'Hive', color: '#F2C14E', shirt: '#5c4a16', pants: '#1a1712', hair: '#111', job: 'lead', desk: [0, 0, -2.6], meet: [6.8, 0, -2.1] },
  { id: 'pulse', name: 'Pulse', color: '#FB7185', shirt: '#6b1d32', pants: '#211', hair: '#4A148C', job: 'check', desk: [-7.2, 0, 1.8], meet: [5.6, 0, -2.1] },
  { id: 'apollo', name: 'Apollo', color: '#F97316', shirt: '#7c2d12', pants: '#3E2723', hair: '#1a1a1a', job: 'code', desk: [-3.6, 0, 1.8], meet: [8.0, 0, -2.1] },
  { id: 'critic', name: 'Critic', color: '#C084FC', shirt: '#3b0764', pants: '#1a1a2e', hair: '#2e1065', job: 'review', desk: [0, 0, 1.8], meet: [6.8, 0, -4.2] },
]

export function moodFromEvent(ev: HiveSwarmEvent): AgentMood {
  if (ev.type === 'function_call.started') return 'searching'
  if (ev.type === 'inference.started' || ev.type === 'inference.stream') {
    return ev.producerName === 'Apollo' ? 'coding' : 'thinking'
  }
  if (ev.type === 'model.answer') return 'talking'
  return 'idle'
}
