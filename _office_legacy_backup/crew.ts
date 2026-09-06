import type { HiveSwarmEvent } from '../../types'

export type AgentMood = 'idle' | 'thinking' | 'searching' | 'talking' | 'coding' | 'done'

export type FloorAgent = {
  id: string
  botId: string
  name: string
  color: string
  shirt: string
  pants: string
  hair: string
  job: string
  role: string
  status: 'idle' | 'working' | 'blocked' | 'away'
  desk: [number, number, number]
  meet: [number, number, number]
}

export const FLOOR_CREW: FloorAgent[] = [
  { id: 'projects-manager', botId: 'c652c653-5f9b-4a2e-ac07-af32c2afb3b1', name: 'Projects Manager', color: '#6366F1', shirt: '#312e81', pants: '#1e1b4b', hair: '#111827', job: 'board', role: 'Runs team projects from Notion.', status: 'idle', desk: [-7.2, 0, -2.6], meet: [6.2, 0, -3.2] },
  { id: 'office3d', botId: '72b3983a-af80-4874-8051-334ed35ce747', name: 'Office3D', color: '#0EA5E9', shirt: '#0c4a6e', pants: '#082f49', hair: '#0f172a', job: 'scene', role: 'Three.js R3F scene specialist.', status: 'working', desk: [0, 0, -2.6], meet: [6.8, 0, -2.1] },
  { id: 'codder', botId: 'e0949414-f31b-4ccf-a098-056b54d6ba6e', name: 'Codder', color: '#22C55E', shirt: '#14532d', pants: '#052e16', hair: '#111827', job: 'code', role: 'Coding engineer build and run.', status: 'working', desk: [-3.6, 0, 1.8], meet: [8.0, 0, -2.1] },
  { id: 'agentops', botId: 'b3b2b536-0981-4360-8fbd-0235c3e54afc', name: 'AgentOps', color: '#F59E0B', shirt: '#78350f', pants: '#451a03', hair: '#1c1917', job: 'ops', role: 'Agent roster chat and HQ wiring.', status: 'idle', desk: [-3.6, 0, -2.6], meet: [7.4, 0, -3.2] },
]

export function moodFromEvent(ev: HiveSwarmEvent): AgentMood {
  if (ev.type === 'function_call.started') return 'searching'
  if (ev.type === 'inference.started' || ev.type === 'inference.stream') {
    return ev.producerName === 'Codder' || ev.producerName === 'Apollo' ? 'coding' : 'thinking'
  }
  if (ev.type === 'model.answer') return 'talking'
  return 'idle'
}

export function pickOfficeSpeaker(task: string): string {
  const t = task.toLowerCase()
  if (t.includes('scene') || t.includes('avatar') || t.includes('webgl') || t.includes('office3d')) return 'Office3D'
  if (t.includes('code') || t.includes('vite') || t.includes('electron') || t.includes('codder')) return 'Codder'
  if (t.includes('roster') || t.includes('agentops') || t.includes('hq')) return 'AgentOps'
  return 'Projects Manager'
}
