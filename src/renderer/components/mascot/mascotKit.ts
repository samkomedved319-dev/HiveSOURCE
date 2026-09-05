/**
 * mascotKit — maps app/mascot states onto the 4-pose BloubMascot sheet.
 * Keeps the Hex canvas engine untouched; this is the lightweight SVG kit
 * for headers, pills, empty states and anywhere the full engine is too heavy.
 */
import type { BloubPose } from './BloubMascot'

export type KitAppState =
  | 'idle'
  | 'thinking'
  | 'searching'
  | 'coding'
  | 'working'
  | 'done'
  | 'error'
  | 'sleep'

/** Sheet pose per app state. `done` celebrates on the idle blob; `sleep` reuses thinking (closed eyes). */
export const KIT_POSE_FOR_STATE: Record<KitAppState, BloubPose> = {
  idle: 'idle',
  thinking: 'thinking',
  searching: 'thinking',
  coding: 'working',
  working: 'working',
  done: 'idle',
  error: 'alert',
  sleep: 'thinking',
}

/** Accent per state — Grok blue for search/think, amber for work/code, red for alert. */
export const KIT_ACCENT_FOR_STATE: Record<KitAppState, string> = {
  idle: '#F2C14E',
  thinking: '#F2C14E',
  searching: '#F08A24',
  coding: '#F59E0B',
  working: '#F59E0B',
  done: '#10B981',
  error: '#F04438',
  sleep: '#6B7280',
}

export function getKitPose(state: KitAppState): BloubPose {
  return KIT_POSE_FOR_STATE[state] ?? 'idle'
}

export function getKitAccent(state: KitAppState): string {
  return KIT_ACCENT_FOR_STATE[state] ?? '#F2C14E'
}
