export const HIVE_VERSION = '0.0.1.4'

export type ReleaseNote = { type: 'new' | 'fix' | 'improve'; text: string }

export const LOCAL_WHATS_NEW: ReleaseNote[] = [
  { type: 'new', text: 'Hive Free: GLM 5.3 and Nemotron Nano via TokenRouter. No key needed.' },
  { type: 'new', text: '1,000,000 tokens per day. The window starts at your first AI message and resets 24 hours later.' },
  { type: 'improve', text: 'Installer download page — no GitHub account required if you have the link.' },
]