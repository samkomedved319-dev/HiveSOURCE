import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { registerTelegramHandlers } from './telegram-service'
import { registerOpenRouterHandlers } from './openrouter-service'
import { registerLiveKitHandlers } from './livekit-service'
import { registerSystemControlHandlers } from './system-service'
import { registerBuddyHandlers, syncBuddyWithMain } from './buddy-service'
import { registerSearchHandlers } from './search-service'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

const isDev = !app.isPackaged
const gotLock = isDev ? true : app.requestSingleInstanceLock()

if (!gotLock) {
  process.exit(0)
} else if (!isDev) {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 640,
    frame: false,
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

  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      // Approve microphone and audio capture
      return callback(true)
    }
    callback(false)
  })

  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error(`[Electron] Failed to load window: ${code} - ${desc}`)
  })

  // Show window immediately once loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: 'detach' })
    }
  })

  // Fallback show if ready-to-show takes too long
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show()
    }
  }, 1500)

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })

  // Buddy lives and dies with the main window: hidden/minimized app = no buddy.
  mainWindow.on('show', () => syncBuddyWithMain())
  mainWindow.on('hide', () => syncBuddyWithMain())
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
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit() } },
  ]))
  tray.on('double-click', () => {
    if (mainWindow?.isVisible?.()) mainWindow.hide()
    else { mainWindow?.show(); mainWindow?.focus() }
  })
}

app.whenReady().then(() => {
  registerTelegramHandlers()
  registerOpenRouterHandlers()
  registerLiveKitHandlers()
  registerSystemControlHandlers()
  registerBuddyHandlers(() => mainWindow)
  registerSearchHandlers()
  createWindow()
  createTray()

  try {
    globalShortcut.register('CommandOrControl+Shift+H', () => {
      if (mainWindow?.isVisible?.() && mainWindow?.isFocused?.()) mainWindow?.hide()
      else { mainWindow?.show(); mainWindow?.focus() }
    })
  } catch {}

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else mainWindow?.show()
  })
})

app.on('before-quit', () => { isQuitting = true })
app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', () => { if (process.platform !== 'win32' || isQuitting) app.quit() })

// Window controls
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)
