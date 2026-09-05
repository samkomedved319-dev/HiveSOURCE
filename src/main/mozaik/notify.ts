import { Notification } from 'electron'

type EmitFn = (channel: string, payload: unknown) => void

let emit: EmitFn | null = null
let focused: () => boolean = () => true

export function setHiveEmitter(fn: EmitFn | null) {
  emit = fn
}

export function setFocusProbe(fn: () => boolean) {
  focused = fn
}

export function notifyDesktop(title: string, body: string) {
  try {
    if (focused()) return
    if (!Notification.isSupported()) return
    const n = new Notification({ title, body: body.slice(0, 180), silent: false })
    n.show()
  } catch {}
}

export function emitHiveEvent(payload: unknown) {
  try {
    emit?.('hive:event', payload)
    const ev = payload as { type?: string; producerName?: string; text?: string }
    if (ev?.type === 'model.answer' && ev.producerName === 'Hive' && ev.text) {
      notifyDesktop('Hive is done', ev.text)
    }
  } catch {}
}

export function emitHiveState(payload: unknown) {
  try {
    emit?.('hive:state', payload)
  } catch {}
}
