import { app, BrowserWindow, globalShortcut, ipcMain, screen } from 'electron'
import path from 'path'
import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)

let buddyWin: BrowserWindow | null = null
let notchWin: BrowserWindow | null = null
let followTimer: NodeJS.Timeout | null = null

const BUDDY_SIZE = 76
const NOTCH_PILL_W = 264
const NOTCH_PILL_H = 46
const NOTCH_FULL_W = 576
const NOTCH_FULL_H = 480

/** Clamp a top-left point so a W×H box stays inside the display work area. */
function clampToArea(x: number, y: number, w: number, h: number) {
  const cursor = screen.getCursorScreenPoint()
  const area = screen.getDisplayNearestPoint(cursor).workArea
  const inset = 4
  return {
    x: Math.round(Math.min(Math.max(x, area.x + inset), area.x + area.width - w - inset)),
    y: Math.round(Math.min(Math.max(y, area.y + inset), area.y + area.height - h - inset)),
  }
}

// Eased cursor spring for the outer buddy (kills jitter + mislocation).
// Moves are pushed to the compositor only when the target actually moved:
// hammering setPosition every frame is what made the window swim and lag.
let followPos: { x: number; y: number } | null = null
let lastPushed: { x: number; y: number } | null = null

function startFollow() {
  if (followTimer) return
  snapFollowToCursor()
  lastPushed = followPos ? { ...followPos } : null
  followTimer = setInterval(() => {
    try {
      if (!buddyWin || buddyWin.isDestroyed() || !buddyWin.isVisible()) return
      const p = screen.getCursorScreenPoint()
      // Teleport catch-up: monitor switch / fast fling / display change.
      if (!followPos || Math.hypot(p.x - followPos.x, p.y - followPos.y) > 500) {
        snapFollowToCursor()
        lastPushed = followPos ? { ...followPos } : null
        return
      }
      const tx = p.x - BUDDY_SIZE / 2 + 20
      const ty = p.y - BUDDY_SIZE / 2 + 26
      followPos = { x: followPos.x + (tx - followPos.x) * 0.5, y: followPos.y + (ty - followPos.y) * 0.5 }
      const cx = Math.round(followPos.x)
      const cy = Math.round(followPos.y)
      if (lastPushed && Math.hypot(cx - lastPushed.x, cy - lastPushed.y) < 1) return
      const c = clampToArea(cx, cy, BUDDY_SIZE, BUDDY_SIZE)
      buddyWin.setPosition(c.x, c.y)
      lastPushed = { x: c.x, y: c.y }
    } catch {}
  }, 30)
}

/** Buddy stays on after enable, even if Hive is hidden. */
let buddyEnabledSetting = false
let getMainWindow: () => BrowserWindow | null = () => null

export function syncBuddyWithMain() {
  try {
    syncBuddy(buddyEnabledSetting)
  } catch {}
}

function syncBuddy(show: boolean) {
  try {
    if (show) {
      const win = ensureBuddyWindow()
      snapFollowToCursor()
      if (!win.isVisible()) win.showInactive()
      startFollow()
    } else {
      stopFollow()
      followPos = null
      lastPushed = null
      if (buddyWin && !buddyWin.isDestroyed() && buddyWin.isVisible()) buddyWin.hide()
      hideNotch()
    }
  } catch {}
}

function snapFollowToCursor() {
  try {
    const p = screen.getCursorScreenPoint()
    followPos = { x: p.x - BUDDY_SIZE / 2 + 20, y: p.y - BUDDY_SIZE / 2 + 26 }
    if (buddyWin && !buddyWin.isDestroyed()) {
      const c = clampToArea(Math.round(followPos.x), Math.round(followPos.y), BUDDY_SIZE, BUDDY_SIZE)
      buddyWin.setPosition(c.x, c.y)
    }
  } catch {}
}

function stopFollow() {
  if (followTimer) {
    clearInterval(followTimer)
    followTimer = null
  }
}

/** Transparent click-through window trailing the GLOBAL cursor, all screens. */
function ensureBuddyWindow() {
  if (buddyWin && !buddyWin.isDestroyed()) return buddyWin
  const isDev = !app.isPackaged
  buddyWin = new BrowserWindow({
    width: BUDDY_SIZE,
    height: BUDDY_SIZE,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    show: false,
    hasShadow: false,
    resizable: false,
    fullscreenable: false,
    hiddenInMissionControl: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
  buddyWin.setIgnoreMouseEvents(true)
  buddyWin.setVisibleOnAllWorkspaces(true)
  buddyWin.setAlwaysOnTop(true)
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
  if (isDev) {
    buddyWin.loadURL(`${devUrl}?overlay=buddy`).catch(() => {})
  } else {
    buddyWin.loadFile(path.join(__dirname, '../renderer/index.html'), { query: { overlay: 'buddy' } }).catch(() => {})
  }
  buddyWin.on('closed', () => {
    buddyWin = null
    stopFollow()
  })
  return buddyWin
}

/** Escape free text for WScript.Shell SendKeys. */
function escapeSendKeys(text: string): string {
  return text
    .slice(0, 500)
    .replace(/\{/g, '{{}')
    .replace(/\}/g, '{}}')
    .replace(/\+/g, '{+}')
    .replace(/\^/g, '{^}')
    .replace(/%/g, '{%}')
    .replace(/~/g, '{~}')
    .replace(/\(/g, '{(}')
    .replace(/\)/g, '{)}')
    .replace(/\[/g, '{[}')
    .replace(/\]/g, '{]}')
    .replace(/'/g, "''")
}

export function registerBuddyHandlers(getWindow: () => BrowserWindow | null) {
  getMainWindow = getWindow
  // Global push-to-talk summon: bare Ctrl+Shift is modifiers-only and cannot
  // be registered, so Ctrl+Shift+J pops the notch — the main app never opens.
  try {
    globalShortcut.register('CommandOrControl+Shift+J', () => {
      try {
        showNotch()
      } catch {}
    })
  } catch {
    // Hotkey slot taken by another app — overlay stays reachable from chat.
  }

  // Left-click at app-window client coordinates (converted to physical px).
  ipcMain.handle('system:click', async (_e, cx: number, cy: number) => {
    try {
      const win = getWindow()
      if (!win) return { ok: false, error: 'No window' }
      if (!Number.isFinite(cx) || !Number.isFinite(cy)) return { ok: false, error: 'Bad coordinates' }
      const b = win.getBounds()
      const sx = Math.round(b.x + cx)
      const sy = Math.round(b.y + cy)
      const display = screen.getDisplayNearestPoint({ x: sx, y: sy })
      const k = display.scaleFactor || 1
      const px = Math.round(sx * k)
      const py = Math.round(sy * k)
      const script = [
        'Add-Type -AssemblyName System.Windows.Forms',
        `$pos = New-Object System.Drawing.Point(${px}, ${py})`,
        '[System.Windows.Forms.Cursor]::Position = $pos',
        'Add-Type -MemberDefinition \'[DllImport("user32.dll")]public static extern void mouse_event(int flags,int dx,int dy,int data,System.UIntPtr extra);\' -Name "HiveBuddyMouse" -Namespace Win32',
        '[Win32.HiveBuddyMouse]::mouse_event(0x02,0,0,0,[System.UIntPtr]::Zero)',
        'Start-Sleep -Milliseconds 80',
        '[Win32.HiveBuddyMouse]::mouse_event(0x04,0,0,0,[System.UIntPtr]::Zero)',
      ].join('; ')
      await execPromise(script, { timeout: 20000, shell: 'powershell.exe' })
      return { ok: true }
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Click failed' }
    }
  })

  // Type into the currently focused window (user intent is explicit: they
  // typed the command). Destructive shell commands stay guarded in system:exec.
  ipcMain.handle('system:type', async (_e, text: string) => {
    try {
      if (typeof text !== 'string' || text.length === 0) return { ok: false, error: 'Empty text' }
      const safe = escapeSendKeys(text)
      const script = `$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys('${safe}')`
      await execPromise(script, { timeout: 20000, shell: 'powershell.exe' })
      return { ok: true }
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Type failed' }
    }
  })

  // System-wide buddy window visibility (Settings toggle).
  ipcMain.on('buddy:setOuterEnabled', (_e, on: boolean) => {
    try {
      buddyEnabledSetting = !!on
      syncBuddyWithMain()
    } catch {}
  })

  // Forward overlay phases to the outer buddy + notch island in sync.
  ipcMain.on('buddy:phase', (_e, phase: string) => {
    try {
      if (buddyWin && !buddyWin.isDestroyed()) buddyWin.webContents.send('buddy:phase', phase)
      if (notchWin && !notchWin.isDestroyed()) notchWin.webContents.send('buddy:phase', phase)
    } catch {}
  })

  // HeyLemon-style notch popover: top-of-screen island, app never opens.
  ipcMain.on('buddy:notch-hide', () => {
    try {
      hideNotch()
    } catch {}
  })
}

export function setBuddyMood(mood: string) {
  try {
    if (buddyWin && !buddyWin.isDestroyed()) buddyWin.webContents.send('buddy:phase', mood)
    if (notchWin && !notchWin.isDestroyed()) notchWin.webContents.send('buddy:phase', mood)
    const win = getMainWindow?.()
    if (win && !win.isDestroyed()) win.webContents.send('buddy:phase', mood)
  } catch {}
}

/** Tear down every buddy surface so nothing outlives the app. */
export function destroyBuddyWindows() {
  try {
    stopFollow()
    followPos = null
    lastPushed = null
    if (notchExpandTimer) {
      clearTimeout(notchExpandTimer)
      notchExpandTimer = null
    }
    if (buddyWin && !buddyWin.isDestroyed()) buddyWin.destroy()
    buddyWin = null
    if (notchWin && !notchWin.isDestroyed()) notchWin.destroy()
    notchWin = null
  } catch {}
}

export type NotchMode = 'pill' | 'full'

let notchMode: NotchMode = 'pill'
let notchAnim: NodeJS.Timeout | null = null
let notchExpandTimer: NodeJS.Timeout | null = null

function notchCenterX(w: number) {
  const cursor = screen.getCursorScreenPoint()
  const area = screen.getDisplayNearestPoint(cursor).workArea
  return Math.round(area.x + (area.width - w) / 2)
}

function notchTopY() {
  const cursor = screen.getCursorScreenPoint()
  const area = screen.getDisplayNearestPoint(cursor).workArea
  return Math.round(area.y + 10)
}

function sendNotchMode() {
  try {
    if (notchWin && !notchWin.isDestroyed()) notchWin.webContents.send('buddy:notch-mode', notchMode)
  } catch {}
}

/** Animated pill <-> island morph (~200ms ease-out). */
function morphNotch(toFull: boolean) {
  if (!notchWin || notchWin.isDestroyed()) return
  if (notchAnim) {
    clearInterval(notchAnim)
    notchAnim = null
  }
  const fromW = toFull ? NOTCH_PILL_W : NOTCH_FULL_W
  const fromH = toFull ? NOTCH_PILL_H : NOTCH_FULL_H
  const toW = toFull ? NOTCH_FULL_W : NOTCH_PILL_W
  const toH = toFull ? NOTCH_FULL_H : NOTCH_PILL_H
  const steps = 12
  let i = 0
  notchAnim = setInterval(() => {
    try {
      i += 1
      const k = 1 - Math.pow(1 - Math.min(1, i / steps), 3)
      const w = Math.round(fromW + (toW - fromW) * k)
      const h = Math.round(fromH + (toH - fromH) * k)
      if (!notchWin || notchWin.isDestroyed() || !notchWin.isVisible()) {
        if (notchAnim) clearInterval(notchAnim)
        notchAnim = null
        return
      }
      notchWin.setSize(w, h)
      notchWin.setPosition(notchCenterX(w), notchTopY())
      if (i >= steps) {
        if (notchAnim) clearInterval(notchAnim)
        notchAnim = null
      }
    } catch {}
  }, 16)
}

function ensureNotchWindow() {
  if (notchWin && !notchWin.isDestroyed()) return notchWin
  const isDev = !app.isPackaged
  notchWin = new BrowserWindow({
    width: NOTCH_PILL_W,
    height: NOTCH_PILL_H,
    x: notchCenterX(NOTCH_PILL_W),
    y: notchTopY(),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    hasShadow: false,
    resizable: false,
    fullscreenable: false,
    hiddenInMissionControl: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
  notchWin.setVisibleOnAllWorkspaces(true)
  notchWin.setAlwaysOnTop(true)
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
  if (isDev) {
    notchWin.loadURL(`${devUrl}?overlay=notch`).catch(() => {})
  } else {
    notchWin.loadFile(path.join(__dirname, '../renderer/index.html'), { query: { overlay: 'notch' } }).catch(() => {})
  }
  // Click-away dismisses the island.
  notchWin.on('blur', () => {
    try {
      hideNotch()
    } catch {}
  })
  notchWin.on('closed', () => {
    notchWin = null
  })
  return notchWin
}

export function showNotch() {
  const win = ensureNotchWindow()
  if (notchExpandTimer) {
    clearTimeout(notchExpandTimer)
    notchExpandTimer = null
  }
  // Pop the pill first (Dynamic-Island style), then expand into the panel.
  notchMode = 'pill'
  sendNotchMode()
  win.setSize(NOTCH_PILL_W, NOTCH_PILL_H)
  win.setPosition(notchCenterX(NOTCH_PILL_W), notchTopY())
  if (!win.isVisible()) win.show()
  win.focus()
  notchExpandTimer = setTimeout(() => {
    try {
      if (!notchWin || notchWin.isDestroyed() || !notchWin.isVisible()) return
      notchMode = 'full'
      sendNotchMode()
      morphNotch(true)
      notchWin.focus()
    } catch {}
  }, 260)
}

function hideNotch() {
  try {
    if (notchExpandTimer) {
      clearTimeout(notchExpandTimer)
      notchExpandTimer = null
    }
    if (!notchWin || notchWin.isDestroyed() || !notchWin.isVisible()) return
    // Collapse back to the pill, then vanish.
    notchMode = 'pill'
    sendNotchMode()
    morphNotch(false)
    setTimeout(() => {
      try {
        if (notchWin && !notchWin.isDestroyed()) notchWin.hide()
      } catch {}
    }, 220)
  } catch {}
}
