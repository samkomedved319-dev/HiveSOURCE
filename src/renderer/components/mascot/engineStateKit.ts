import type { StateId } from '../../bot/states'

/**
 * Maps Hive app/mascot states onto live Bloub engine states so the avatar
 * visibly works through activity: idle rest, thinking morph, orbit rings for
 * search scans, play for code/work, exclaim pop for done, alert for errors.
 */
export type HiveActivityState =
  | 'idle'
  | 'thinking'
  | 'searching'
  | 'coding'
  | 'working'
  | 'done'
  | 'error'
  | 'sleep'

export const ENGINE_STATE_FOR_ACTIVITY: Record<HiveActivityState, StateId> = {
  idle: 'idle',
  thinking: 'thinking',
  searching: 'orbit',
  coding: 'play',
  working: 'play',
  done: 'exclaim',
  error: 'alert',
  sleep: 'sleep',
}

export function getEngineState(state: HiveActivityState): StateId {
  return ENGINE_STATE_FOR_ACTIVITY[state] ?? 'idle'
}
