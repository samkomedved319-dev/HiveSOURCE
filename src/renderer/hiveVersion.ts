export const HIVE_VERSION = '0.0.1.3'

export type ReleaseNote = { type: 'new' | 'fix' | 'improve'; text: string }

export const LOCAL_WHATS_NEW: ReleaseNote[] = [
  { type: 'new', text: 'First-login tutorial walks through chat, workers, office, and Buddy.' },
  { type: 'improve', text: 'Buddy Model is Fast, Auto, or No — no more model names.' },
  { type: 'improve', text: 'Integrations, Auth, and the Chrome extension section are hidden from Settings.' },
  { type: 'fix', text: 'Uninstalling Hive clears login, so a reinstall asks you to sign in again.' },
]