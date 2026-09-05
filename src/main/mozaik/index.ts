import type { BrowserWindow } from 'electron'
import { registerHiveBridge } from './bridge'
import { joinHiveSwarm } from './participants'
import { startMozaikRuntime } from './runtime'

export function startHiveRuntime(getWindow: () => BrowserWindow | null) {
  startMozaikRuntime()
  joinHiveSwarm()
  registerHiveBridge(getWindow)
}
