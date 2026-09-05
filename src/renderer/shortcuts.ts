export type ShortcutId = 'palette' | 'newChat' | 'sidebar' | 'hivebox' | 'settings' | 'buddy'

export type Binding = {
  ctrl: boolean
  shift: boolean
  alt: boolean
  key: string
}

export const SHORTCUT_META: { id: ShortcutId; label: string; global?: boolean }[] = [
  { id: 'palette', label: 'Command palette' },
  { id: 'newChat', label: 'New chat' },
  { id: 'sidebar', label: 'Toggle conversation list' },
  { id: 'hivebox', label: 'Toggle HiveBox', global: true },
  { id: 'settings', label: 'Open settings' },
  { id: 'buddy', label: 'Buddy notch (voice + PC)', global: true },
]

export const DEFAULT_SHORTCUTS: Record<ShortcutId, Binding> = {
  palette: { ctrl: true, shift: false, alt: false, key: 'k' },
  newChat: { ctrl: true, shift: false, alt: false, key: 'n' },
  sidebar: { ctrl: true, shift: false, alt: false, key: 'b' },
  hivebox: { ctrl: true, shift: true, alt: false, key: 'h' },
  settings: { ctrl: true, shift: false, alt: false, key: ',' },
  buddy: { ctrl: true, shift: true, alt: false, key: 'j' },
}

const STORE = 'hive_shortcuts_v1'

export function loadShortcuts(): Record<ShortcutId, Binding> {
  try {
    const raw = localStorage.getItem(STORE)
    if (!raw) return { ...DEFAULT_SHORTCUTS }
    const parsed = JSON.parse(raw) as Partial<Record<ShortcutId, Binding>>
    return { ...DEFAULT_SHORTCUTS, ...parsed }
  } catch {
    return { ...DEFAULT_SHORTCUTS }
  }
}

export function saveShortcuts(next: Record<ShortcutId, Binding>) {
  localStorage.setItem(STORE, JSON.stringify(next))
}

export function bindingFromEvent(e: KeyboardEvent): Binding | null {
  if (e.key === 'Control' || e.key === 'Shift' || e.key === 'Alt' || e.key === 'Meta') return null
  return {
    ctrl: e.ctrlKey || e.metaKey,
    shift: e.shiftKey,
    alt: e.altKey,
    key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
  }
}

export function sameBinding(a: Binding, b: Binding) {
  return a.ctrl === b.ctrl && a.shift === b.shift && a.alt === b.alt && a.key.toLowerCase() === b.key.toLowerCase()
}

export function matchesBinding(e: KeyboardEvent, b: Binding) {
  const ctrl = e.ctrlKey || e.metaKey
  if (ctrl !== b.ctrl || e.shiftKey !== b.shift || e.altKey !== b.alt) return false
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
  return k.toLowerCase() === b.key.toLowerCase()
}

export function formatBinding(b: Binding): string[] {
  const keys: string[] = []
  if (b.ctrl) keys.push('Ctrl')
  if (b.shift) keys.push('Shift')
  if (b.alt) keys.push('Alt')
  keys.push(b.key.length === 1 ? b.key.toUpperCase() : b.key)
  return keys
}

export function toAccelerator(b: Binding): string {
  const parts: string[] = []
  if (b.ctrl) parts.push('CommandOrControl')
  if (b.alt) parts.push('Alt')
  if (b.shift) parts.push('Shift')
  const k = b.key.length === 1 ? b.key.toUpperCase() : b.key
  parts.push(k === ',' ? 'Comma' : k)
  return parts.join('+')
}
