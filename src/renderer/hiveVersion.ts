export const HIVE_VERSION = '0.0.1.2'

export type ReleaseNote = { type: 'new' | 'fix' | 'improve'; text: string }

export const LOCAL_WHATS_NEW: ReleaseNote[] = [
  { type: 'new', text: 'Click Update and restart — Hive installs and comes back on its own.' },
  { type: 'new', text: 'What’s New popup after each update, with what was added and fixed.' },
  { type: 'improve', text: 'Hive logo in the left rail is branding now — it no longer opens the office.' },
  { type: 'fix', text: 'Windows app, taskbar, and installer use the Hive bee instead of the Electron atom.' },
  { type: 'fix', text: 'Installer build works with electron-builder 26 (no more invalid win config).' },
]
