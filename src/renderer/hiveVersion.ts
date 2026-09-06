export const HIVE_VERSION = '0.0.1.5'

export type ReleaseNote = { type: 'new' | 'fix' | 'improve'; text: string }

export const LOCAL_WHATS_NEW: ReleaseNote[] = [
  { type: 'new', text: 'Pick GLM 5.3 or Nemotron Nano right in the model menu — both are Hive Free.' },
  { type: 'new', text: 'Animated 1,000,000-token meter. Remaining count, bonus, and reset countdown.' },
  { type: 'new', text: 'Owner-only Admin panel: reset someone’s pool, grant +100k, approve or deny.' },
]
