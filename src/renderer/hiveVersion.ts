export const HIVE_VERSION = '0.0.1.5'

export type ReleaseNote = { type: 'new' | 'fix' | 'improve'; text: string }

export const LOCAL_WHATS_NEW: ReleaseNote[] = [
  { type: 'improve', text: '“Hey?” is one fast reply. Scout / Pulse / Critic stay idle unless the job needs a swarm.' },
  { type: 'new', text: 'Bots panel: create a Loop agent with a goal and interval. It only runs when you press Start.' },
  { type: 'fix', text: 'Hive no longer dumps old memories into small talk.' },
  { type: 'fix', text: 'Hive Free chat is live again — GLM answers, Nemotron falls back if it is out of credit.' },
]
