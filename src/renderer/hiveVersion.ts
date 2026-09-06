export const HIVE_VERSION = '0.0.1.6'

export type ReleaseNote = { type: 'new' | 'fix' | 'improve'; text: string }

export const LOCAL_WHATS_NEW: ReleaseNote[] = [
  { type: 'fix', text: 'Hive Free uses only GLM 5.3. Nemotron is off — it returned zero credits.' },
  { type: 'fix', text: 'Bring your own OpenRouter, OpenAI, or Anthropic key in Settings → Models. Tutorial now covers this.' },
  { type: 'new', text: 'Loop agents live in main chat again — create, Start, Pause without leaving the thread.' },
  { type: 'improve', text: 'GLM thinking is off for normal chat so replies are actual answers, not empty credit burns.' },
]
