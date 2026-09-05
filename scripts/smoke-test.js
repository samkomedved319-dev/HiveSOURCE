// Headless interaction smoke test (run: npx electron scripts/smoke-test.js).
// Boots the built app offscreen, sends a chat message through the real DOM,
// and asserts: user bubble renders, mock assistant reply renders, zero console errors.
const { app, BrowserWindow } = require('electron')
const path = require('path')

app.disableHardwareAcceleration()
app.whenReady().then(async () => {
  const root = path.join(__dirname, '..')
  const errors = []
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    show: false,
    webPreferences: { offscreen: true },
  })
  win.webContents.on('console-message', (_e, _level, message, line, sourceId) => {
    if (/error|uncaught|failed/i.test(message)) errors.push(`${sourceId}:${line} ${message}`)
  })
  win.webContents.on('render-process-gone', (_e, details) => {
    errors.push(`render-process-gone: ${details.reason}`)
  })
  const failSafe = setTimeout(() => {
    console.error('SMOKE TIMEOUT')
    app.exit(1)
  }, 90000)
  try {
    await win.loadFile(path.join(root, 'dist', 'renderer', 'index.html'))
    await win.webContents.executeJavaScript(
      `localStorage.removeItem('hive_conversations');` +
        `localStorage.removeItem('hive_active_conv');` +
        `localStorage.removeItem('hive_conv_messages');`
    )
    win.reload()
    await new Promise((resolve) => win.webContents.once('did-finish-load', resolve))
    await new Promise((r) => setTimeout(r, 4000))

    // Type into the real composer and press Enter (React-controlled textarea).
    const sent = await win.webContents.executeJavaScript(`(() => {
      const ta = document.querySelector('textarea[placeholder="Message Hive…"]');
      if (!ta) return 'NO-TEXTAREA';
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, 'smoke test ping');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      return 'SENT';
    })()`)
    if (sent !== 'SENT') throw new Error(`composer not drivable: ${sent}`)
    await new Promise((r) => setTimeout(r, 3000))

    const check = await win.webContents.executeJavaScript(`(() => {
      const body = document.body.innerText;
      // Open the bots roster from the rail: it must render in the main column.
      const workersBtn = Array.from(document.querySelectorAll('button'))
        .find((b) => b.title === 'AI Workers & Specialists');
      if (workersBtn) workersBtn.click();
      return {
        userBubble: body.includes('smoke test ping'),
        assistantReply: body.includes('thinking mode'),
        composerAlive: !!document.querySelector('textarea[placeholder="Message Hive…"]'),
        workersClicked: !!workersBtn,
      };
    })()`)
    await new Promise((r) => setTimeout(r, 1200))
    const bots = await win.webContents.executeJavaScript(`(() => {
      const body = document.body.innerText;
      return {
        botsPanel: body.includes('AI Workers & Bots'),
        rosterItem: body.includes('Apollo'),
      };
    })()`)
    console.log('smoke:', JSON.stringify(check))
    console.log('bots:', JSON.stringify(bots))
    console.log('smoke:', JSON.stringify(check))
    console.log('bots:', JSON.stringify(bots))
    console.log('console-errors:', errors.length ? errors : 'none')
    clearTimeout(failSafe)
    if (!check.userBubble || !check.assistantReply || !check.composerAlive || !bots.botsPanel || !bots.rosterItem || errors.length > 0) {
      console.error('SMOKE FAILED')
      app.exit(1)
    }
    console.log('SMOKE PASSED')
    app.exit(0)
  } catch (e) {
    console.error('SMOKE ERROR', e)
    clearTimeout(failSafe)
    app.exit(1)
  }
})
