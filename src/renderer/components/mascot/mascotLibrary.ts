export type MascotId = 'bloub' | 'hex' | 'gold' | 'pulse' | 'scout' | 'critic'

export const MASCOT_LIBRARY: { id: MascotId; label: string; hint: string }[] = [
  { id: 'bloub', label: 'Bloub', hint: 'Animated Grok-style blob — bloub.vercel.app' },
  { id: 'hex', label: 'Hex', hint: 'Hive hex companion' },
  { id: 'gold', label: 'Gold Hive', hint: 'Classic gold mark' },
  { id: 'pulse', label: 'Pulse', hint: 'Risk watcher' },
  { id: 'scout', label: 'Scout', hint: 'Researcher' },
  { id: 'critic', label: 'Critic', hint: 'Reviewer' },
]

export const BLOUB_URL = 'https://bloub.vercel.app/'

export function mascotGlyph(id?: string) {
  switch (id) {
    case 'bloub':
      return '●'
    case 'hex':
      return '⬡'
    case 'gold':
      return '⬢'
    case 'pulse':
      return '◎'
    case 'scout':
      return '⌕'
    case 'critic':
      return '✦'
    default:
      return id || '⬡'
  }
}
