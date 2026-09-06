export const HIVE_VERSION = '0.0.1.6'

export type ReleaseNote = { type: 'new' | 'fix' | 'improve'; text: string }

export const LOCAL_WHATS_NEW: ReleaseNote[] = [
  { type: 'fix', text: 'Sign in opens hivetools.pro inside Hive — not GitHub.' },
  { type: 'fix', text: 'Hive Free usage is tied to your account. Update or relogin does not mint a new 1M limit.' },
  { type: 'improve', text: 'Usage meter shows remaining tokens, reset time, and account-sync status.' },
  { type: 'improve', text: '\u201cHey?\u201d is one fast reply. Scout / Pulse / Critic stay idle unless the job needs a swarm.' },
]
