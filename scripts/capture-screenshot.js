// Headless marketing screenshot for Hive (run: npx electron scripts/capture-screenshot.js [--empty]).
// Renders the built app offscreen, seeds a demo conversation (unless --empty),
// captures 1600x900 PNG into screenshots/.
const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

const emptyMode = process.argv.includes('--empty')
const outName = emptyMode ? 'hive-empty.png' : 'hive-chat.png'

app.disableHardwareAcceleration()
app.whenReady().then(async () => {
  const root = path.join(__dirname, '..')
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    show: false,
    webPreferences: { offscreen: true },
  })
  const failSafe = setTimeout(() => {
    console.error('capture timed out')
    app.exit(1)
  }, 90000)
  try {
    await win.loadFile(path.join(root, 'dist', 'renderer', 'index.html'))
    if (emptyMode) {
      await win.webContents.executeJavaScript(
        `localStorage.removeItem('hive_conversations');` +
          `localStorage.removeItem('hive_active_conv');` +
          `localStorage.removeItem('hive_conv_messages');`
      )
    }
    if (!emptyMode) {
    const now = Date.now()
    const seed = {
      convs: [{ id: 'c-demo', title: 'Hive Chat 1', group: 'Today' }],
      msgs: {
        'c-demo': [
          {
            id: 'm-1',
            agentId: 'agent-hive-ceo',
            content: 'Take control: open Notepad on my PC',
            role: 'user',
            timestamp: now - 120000,
            type: 'text',
            via: 'local',
          },
          {
            id: 'm-2',
            agentId: 'agent-hive-ceo',
            content:
              "On it — launching Notepad now.\n```powershell\nStart-Process notepad\n```\nDone. Anything else?",
            role: 'assistant',
            timestamp: now - 60000,
            type: 'text',
            via: 'local',
            botName: 'Hive (CEO & Head Architect)',
            botAvatar: '👑',
            botRole: 'CEO & Head Architect',
          },
        ],
      },
    }
    // Escape for embedding JSON inside a single-quoted JS string in the page:
    // backslashes first (keeps \n \" \uXXXX escapes intact), then quotes.
    const js = (obj) => JSON.stringify(obj).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    await win.webContents.executeJavaScript(
      `localStorage.setItem('hive_conversations', '${js(seed.convs)}');` +
        `localStorage.setItem('hive_active_conv', 'c-demo');` +
        `localStorage.setItem('hive_conv_messages', '${js(seed.msgs)}');`
    )
    } // end seed (empty mode boots clean)
    win.reload()
    await new Promise((resolve) => win.webContents.once('did-finish-load', resolve))
    await new Promise((r) => setTimeout(r, 6000))
    const img = await win.webContents.capturePage()
    const dir = path.join(root, 'screenshots')
    fs.mkdirSync(dir, { recursive: true })
    const out = path.join(dir, outName)
    fs.writeFileSync(out, img.toPNG())
    console.log('saved', out)
    clearTimeout(failSafe)
    app.exit(0)
  } catch (e) {
    console.error('capture failed', e)
    clearTimeout(failSafe)
    app.exit(1)
  }
})
