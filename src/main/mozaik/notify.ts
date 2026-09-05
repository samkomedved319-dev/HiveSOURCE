type EmitFn = (channel: string, payload: unknown) => void

let emit: EmitFn | null = null

export function setHiveEmitter(fn: EmitFn | null) {
  emit = fn
}

export function emitHiveEvent(payload: unknown) {
  try {
    emit?.('hive:event', payload)
  } catch {}
}

export function emitHiveState(payload: unknown) {
  try {
    emit?.('hive:state', payload)
  } catch {}
}
