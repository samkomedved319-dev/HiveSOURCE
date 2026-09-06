const { app, BrowserWindow, BrowserView } = require("electron");
const fs = require("fs");
const path = require("path");

const OFFICE_URL = process.env.HIVE_OFFICE_URL || "http://127.0.0.1:5174/";
const OUT = process.env.SMOKE_OUT || path.join(__dirname, "_office_electron_smoke.png");
const LOG = process.env.SMOKE_LOG || path.join(__dirname, "_office_electron_smoke.json");

app.disableHardwareAcceleration(false);

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: true,
    backgroundColor: "#0b0c0e",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  const view = new BrowserView({
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.setBrowserView(view);
  view.setBounds({ x: 0, y: 0, width: 1400, height: 900 });
  view.setBackgroundColor("#0b0c0e");

  const logs = [];
  view.webContents.on("console-message", (_e, level, message) => {
    logs.push({ level, message: String(message).slice(0, 300) });
  });
  view.webContents.on("did-fail-load", (_e, code, desc, url) => {
    logs.push({ fail: { code, desc, url } });
  });

  const loadResult = await view.webContents.loadURL(OFFICE_URL).then(() => "ok").catch((e) => String(e));
  await new Promise((r) => setTimeout(r, 7000));

  const url = view.webContents.getURL();
  const title = view.webContents.getTitle();
  const img = await view.webContents.capturePage();
  fs.writeFileSync(OUT, img.toPNG());

  // Probe agents.json from the view origin
  let agents = null;
  try {
    agents = await view.webContents.executeJavaScript(`
      fetch("/agents.json").then(r => r.json()).then(j => (j.agents||[]).map(a => a.id))
    `);
  } catch (e) {
    agents = ["error:" + e.message];
  }

  let canvasInfo = null;
  try {
    canvasInfo = await view.webContents.executeJavaScript(`
      (() => {
        const c = document.querySelector("canvas");
        const badge = document.querySelector(".scene-badge")?.textContent || "";
        return { hasCanvas: !!c, w: c?.width||0, h: c?.height||0, badge };
      })()
    `);
  } catch (e) {
    canvasInfo = { error: e.message };
  }

  fs.writeFileSync(LOG, JSON.stringify({
    loadResult, url, title, agents, canvasInfo,
    outBytes: fs.statSync(OUT).size,
    logs: logs.slice(-40),
  }, null, 2));

  app.quit();
});

app.on("window-all-closed", () => app.quit());
