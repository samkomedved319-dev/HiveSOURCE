import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, shell } from 'electron'
import path from 'path'
import { registerKeyHandlers } from './keys'
import { registerMem0Handlers } from './mem0-service'
import { registerTelegramHandlers } from './telegram-service'
import { registerOpenRouterHandlers } from './openrouter-service'
import { registerLiveKitHandlers } from './livekit-service'
import { registerSystemControlHandlers } from './system-service'
import { registerBuddyHandlers, syncBuddyWithMain, showNotch } from './buddy-service'
import { registerSearchHandlers } from './search-service'
import { startHiveRuntime } from './mozaik'
import { registerCloudComputerHandlers } from './cloud-computer'
import { registerWorkspaceHandlers } from './workspace-service'

function hushMozaikCloudLogs() {
  const skip = (args: unknown[]) => {
    const s = args.map((a) => (typeof a === 'string' ? a : '')).join(' ')
    return /mozaik cloud|mosaic cloud|no api key|telemetry disabled/i.test(s)
  }
  const wrap =
    (fn: (...a: unknown[]) => void) =>
    (...args: unknown[]) => {
      if (skip(args)) return
      fn(...args)
    }
  console.log = wrap(console.log.bind(console)) as typeof console.log
  console.info = wrap(console.info.bind(console)) as typeof console.info
  console.warn = wrap(console.warn.bind(console)) as typeof console.warn
}

hushMozaikCloudLogs()
process.env.MOZAIK_TELEMETRY = process.env.MOZAIK_TELEMETRY || '0'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let pendingAuthUrl: string | null = null

const isDev = !app.isPackaged
const HIVE_WEB_LOGIN = 'https://samkomedved319-dev.github.io/hive/?desktop=1'

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  process.exit(0)
}

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('hive', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('hive')
}

function parseHiveAuthUrl(raw: string): { access_token: string; refresh_token: string } | null {
  try {
    const normalized = raw.replace(/^hive:\/\//i, 'https://hive-auth/')
    const u = new URL(normalized)
    const hash = new URLSearchParams(u.hash.replace(/^#/, ''))
    const access =
      u.searchParams.get('access_token') || hash.get('access_token') || ''
    const refresh =
      u.searchParams.get('refresh_token') || hash.get('refresh_token') || ''
    if (!access || !refresh) return null
    return { access_token: access, refresh_token: refresh }
  } catch {
    return null
  }
}

function deliverAuthUrl(raw: string) {
  const tokens = parseHiveAuthUrl(raw)
  if (!tokens) return
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('auth:session', tokens)
  } else {
    pendingAuthUrl = raw
  }
}

app.on('second-instance', (_e, argv) => {
  const url = argv.find((a) => typeof a === 'string' && a.startsWith('hive://'))
  if (url) deliverAuthUrl(url)
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  }
})

app.on('open-url', (event, url) => {
  event.preventDefault()
  deliverAuthUrl(url)
})


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    autoHideMenuBar: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    title: 'Hive',
    icon: path.join(__dirname, '../../resources/icon.ico'),
    backgroundColor: '#0b0c0e',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  const indexPath = path.join(__dirname, '../renderer/index.html')
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'

  if (isDev) {
    mainWindow.loadURL(devServerUrl).catch(() => {
      console.log('Dev server not responding, loading built index.html')
      mainWindow?.loadFile(indexPath)
    })
  } else {
    mainWindow.loadFile(indexPath)
  }

  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media') return callback(true)
    callback(false)
  })

  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error(`[Electron] Failed to load window: ${code} - ${desc}`)
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    if (isDev) mainWindow?.webContents.openDevTools({ mode: 'detach' })
    if (pendingAuthUrl) {
      deliverAuthUrl(pendingAuthUrl)
      pendingAuthUrl = null
    }
  })

  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) mainWindow.show()
  }, 1500)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.on('show', () => syncBuddyWithMain())
  mainWindow.on('hide', () => {
    syncBuddyWithMain()
  })
  mainWindow.on('minimize', () => syncBuddyWithMain())
  mainWindow.on('restore', () => syncBuddyWithMain())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

function createTray() {
  let icon: Electron.NativeImage
  try {
    const p = path.join(__dirname, '../../resources/icon.ico')
    icon = nativeImage.createFromPath(p)
    if (icon.isEmpty()) icon = nativeImage.createEmpty()
  } catch {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('Hive')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show Hive', click: () => { mainWindow?.show(); mainWindow?.focus() } },
    { label: 'Ask Hive', click: () => { try { showNotch() } catch {} } },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit() } },
  ]))
  tray.on('double-click', () => {
    if (mainWindow?.isVisible?.()) mainWindow.hide()
    else { mainWindow?.show(); mainWindow?.focus() }
  })
}


// Permanent GPU/WebGL for native in-renderer office (R3F); must run before app ready.
app.commandLine.appendSwitch('ignore-gpu-blocklist')
app.commandLine.appendSwitch('enable-webgl')
app.whenReady().then(() => {
  registerKeyHandlers()
  registerMem0Handlers()
  registerTelegramHandlers()
  registerOpenRouterHandlers()
  registerLiveKitHandlers()
  registerSystemControlHandlers()
  registerBuddyHandlers(() => mainWindow)
  registerSearchHandlers()
  registerCloudComputerHandlers()
  registerWorkspaceHandlers()
  try {
    startHiveRuntime(() => mainWindow)
  } catch (err) {
    console.error('[Hive] Mozaik runtime failed to start', err)
  }
  createWindow()
  createTray()

  const launchUrl = process.argv.find((a) => a.startsWith('hive://'))
  if (launchUrl) pendingAuthUrl = launchUrl

  const registerGlobals = (hivebox = 'CommandOrControl+Shift+H', buddy = 'CommandOrControl+Shift+J') => {
    try {
      globalShortcut.unregisterAll()
    } catch {}
    try {
      globalShortcut.register(hivebox, () => {
        if (mainWindow?.isVisible?.() && mainWindow?.isFocused?.()) mainWindow?.hide()
        else {
          mainWindow?.show()
          mainWindow?.focus()
        }
      })
    } catch {}
    try {
      globalShortcut.register(buddy, () => {
        try {
          if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
            mainWindow.webContents.send('buddy:summon')
          } else {
            showNotch()
          }
        } catch {}
      })
    } catch {}
    try {
      globalShortcut.register(buddy.includes('J') ? buddy : 'CommandOrControl+Shift+J', () => {
        try {
          showNotch()
        } catch {}
      })
    } catch {}
  }
  registerGlobals()
  ipcMain.on('shortcuts:set', (_e, next: { hivebox?: string; buddy?: string }) => {
    registerGlobals(next?.hivebox || 'CommandOrControl+Shift+H', next?.buddy || 'CommandOrControl+Shift+J')
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else mainWindow?.show()
  })
})

app.on('before-quit', () => { isQuitting = true })
app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', () => { app.quit() })

ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)
ipcMain.on('auth:openWeb', () => {
  shell.openExternal(HIVE_WEB_LOGIN)
})

