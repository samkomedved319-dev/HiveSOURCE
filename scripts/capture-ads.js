// Ad-asset capture for Hive (run: npx electron scripts/capture-ads.js).
// Produces in screenshots/: hive-search.png (citations), hive-settings.png,
// hive-notch.png (transparent pill), hive-buddy-float.png (transparent blob),
// hive-demo.webm (7s send -> thinking -> reply), hive-hero.webm (6s idle hero).
const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

const root = path.join(__dirname, '..')
const dir = path.join(root, 'screenshots')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const js = (obj) => JSON.stringify(obj).replace(/\\/g, '\\\\').replace(/'/g, "\\'")

async function shot(win, name, waitMs = 2500) {
  await sleep(waitMs)
  const img = await win.webContents.capturePage()
  const out = path.join(dir, name)
  fs.writeFileSync(out, img.toPNG())
  console.log('saved', out)
}

async function mainWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    show: false,
    webPreferences: { offscreen: true },
  })
  await win.loadFile(path.join(root, 'dist', 'renderer', 'index.html'))
  return win
}

async function seedSearch(win) {
  const now = Date.now()
  const convs = [{ id: 'c-search', title: 'AI news research', group: 'Today' }]
  const msgs = {
    'c-search': [
      {
        id: 'm-1', agentId: 'agent-hive-ceo',
        content: 'Search the web for the latest AI news and cite your sources',
        role: 'user', timestamp: now - 120000, type: 'text', via: 'local',
      },
      {
        id: 'm-2', agentId: 'agent-hive-ceo',
        content: 'Here is the latest verified signal from across the web.',
        role: 'assistant', timestamp: now - 60000, type: 'text', via: 'local',
        botName: 'Hive (CEO & Head Architect)', botAvatar: '👑', botRole: 'CEO & Head Architect',
        isWebSearch: true, searchQuery: 'latest AI news',
        citations: [
          { url: 'https://example.com/ai-breakthrough', title: 'Major AI breakthrough announced', content: 'Researchers unveiled a new reasoning model that tops every benchmark.' },
          { url: 'https://example.com/desktop-agents', title: 'Desktop agents go mainstream', content: 'AI assistants that click and type are now shipping to consumers.' },
        ],
      },
    ],
  }
  await win.webContents.executeJavaScript(
    `localStorage.setItem('hive_conversations', '${js(convs)}');` +
      `localStorage.setItem('hive_active_conv', 'c-search');` +
      `localStorage.setItem('hive_conv_messages', '${js(msgs)}');`
  )
}

async function overlayWindow(query, w, h, retries = 3) {
  // One shared transparent window for every overlay shot: creating and
  // destroying transparent offscreen windows repeatedly crashes the GPU
  // process, so we navigate a single window instead.
  if (!global.__overlayWin || global.__overlayWin.isDestroyed()) {
    global.__overlayWin = new BrowserWindow({
      width: w,
      height: h,
      show: false,
      transparent: true,
      frame: false,
      webPreferences: { offscreen: true },
    })
  }
  const win = global.__overlayWin
  win.setSize(w, h)
  let lastErr = null
  for (let i = 0; i < retries; i++) {
    try {
      const devUrl = process.env.VITE_DEV_SERVER_URL
      if (devUrl) await win.loadURL(`${devUrl}?overlay=${query}`)
      else {
        const fileUrl =
          'file:///' +
          path.join(root, 'dist', 'renderer', 'index.html').replace(/\\/g, '/') +
          `?overlay=${query}`
        await win.loadURL(fileUrl)
      }
      return win
    } catch (e) {
      lastErr = e
      await sleep(1500)
    }
  }
  throw lastErr
}

async function settle() {
  // Let a destroyed transparent window fully release before opening the next.
  await sleep(1500)
}

async function recordClip(win, name, seconds, act) {
  await win.webContents.executeJavaScript(`(() => {
    window.__chunks = [];
    const c = document.createElement('canvas');
    c.width = 1600; c.height = 900;
    document.body.appendChild(c);
    c.style.cssText = 'position:fixed;inset:0;z-index:99999;opacity:0;pointer-events:none;';
    const ctx = c.getContext('2d');
    window.__pushFrame = (url) => new Promise((res) => {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, 1600, 900); res(); };
      img.onerror = () => res();
      img.src = url;
    });
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find((m) => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } });
    const stream = c.captureStream(10);
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 4000000 } : undefined);
    rec.ondataavailable = (e) => { if (e.data && e.data.size) window.__chunks.push(e.data); };
    window.__stopRec = () => new Promise((res) => {
      rec.onstop = async () => {
        const blob = new Blob(window.__chunks, { type: 'video/webm' });
        const buf = new Uint8Array(await blob.arrayBuffer());
        let bin = '';
        const CH = 32768;
        for (let i = 0; i < buf.length; i += CH) bin += String.fromCharCode.apply(null, buf.subarray(i, i + CH));
        res(btoa(bin));
      };
      rec.stop();
    });
    window.__rec = rec;
    rec.start(250);
  })()`)
  const frames = Math.round(seconds * 8)
  for (let i = 0; i < frames; i++) {
    if (i === Math.round(frames * 0.15) && act) await act(win)
    const img = await win.webContents.capturePage()
    await win.webContents.executeJavaScript(
      `window.__pushFrame(${JSON.stringify(img.toDataURL())})`
    )
    await sleep(125)
  }
  const b64 = await win.webContents.executeJavaScript('window.__stopRec()')
  const out = path.join(dir, name)
  fs.writeFileSync(out, Buffer.from(b64, 'base64'))
  console.log('saved', out, fs.statSync(out).size, 'bytes')
}

async function sendHello(win) {
  await win.webContents.executeJavaScript(`(() => {
    const ta = document.querySelector('textarea[placeholder="Message Hive…"]');
    if (!ta) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, 'What can you do?');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  })()`)
}

app.disableHardwareAcceleration()
app.whenReady().then(async () => {
  const failSafe = setTimeout(() => {
    console.error('capture timed out')
    app.exit(1)
  }, 420000)
  try {
    fs.mkdirSync(dir, { recursive: true })
    const skipShots = !!process.env.SKIP_SHOTS

    // One persistent main window for every full-app step: repeated
    // create/destroy cycles destabilize headless rendering.
    const main = await mainWindow()
    async function resetMain(seedJs) {
      await main.webContents.executeJavaScript(seedJs)
      main.reload()
      await new Promise((r) => main.webContents.once('did-finish-load', r))
      await sleep(3500)
    }
    const cleanSeed =
      `localStorage.removeItem('hive_conversations');` +
      `localStorage.removeItem('hive_active_conv');` +
      `localStorage.removeItem('hive_conv_messages');`

    if (!skipShots) {
    // 1. search + citations hero shot
    await seedSearch(main)
    main.reload()
    await new Promise((r) => main.webContents.once('did-finish-load', r))
    await shot(main, 'hive-search.png', 5000)

    // 2. settings modal (click the rail gear)
    await main.webContents.executeJavaScript(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.title === 'Settings');
      if (btn) btn.click();
    })()`)
    await shot(main, 'hive-settings.png', 2000)
    }

    // 3. notch pill (transparent)
    try {
      const w2 = await overlayWindow('notch', 700, 220)
      await shot(w2, 'hive-notch.png', 2500)
      await settle()
    } catch (e) {
      console.error('notch step failed, continuing:', e.message || e)
    }

    // 4. floating buddy (transparent, same window navigated)
    try {
      const w3 = await overlayWindow('buddy', 220, 220)
      await shot(w3, 'hive-buddy-float.png', 3000)
      await settle()
    } catch (e) {
      console.error('buddy step failed, continuing:', e.message || e)
    }
    try {
      if (global.__overlayWin && !global.__overlayWin.isDestroyed()) global.__overlayWin.destroy()
    } catch {}

    // 5. demo video: question -> thinking -> reply
    try {
      await resetMain(cleanSeed)
      await recordClip(main, 'hive-demo.webm', 8, sendHello)
      await settle()
    } catch (e) {
      console.error('demo video step failed, continuing:', e.message || e)
    }

    // 6. hero idle video (breathing mascot, suggestion chips)
    try {
      await resetMain(cleanSeed)
      await recordClip(main, 'hive-hero.webm', 6, null)
    } catch (e) {
      console.error('hero video step failed, continuing:', e.message || e)
    }

    clearTimeout(failSafe)
    app.exit(0)
  } catch (e) {
    console.error('capture failed', e)
    clearTimeout(failSafe)
    app.exit(1)
  }
})
