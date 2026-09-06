const { app, BrowserWindow, BrowserView } = require("electron");
const fs = require("fs");
const path = require("path");

app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-webgl");
app.commandLine.appendSwitch("use-gl", "angle");

const OFFICE_URL = "http://127.0.0.1:5174/";
const OUT = path.join(__dirname, "_office_electron_smoke2.png");
const LOG = path.join(__dirname, "_office_electron_smoke2.json");

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1400, height: 900, show: true, backgroundColor: "#0b0c0e",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  const view = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      offscreen: false,
    },
  });
  win.setBrowserView(view);
  view.setBounds({ x: 0, y: 0, width: 1400, height: 900 });
  await view.webContents.loadURL(OFFICE_URL);
  await new Promise((r) => setTimeout(r, 10000));

  const probe = await view.webContents.executeJavaScript(`
    (() => {
      const c = document.querySelector("canvas");
      const root = document.querySelector(".scene-root");
      const gl = c && (c.getContext("webgl2") || c.getContext("webgl") || c.getContext("webgl", { failIfMajorPerformanceCaveat: false }));
      let glInfo = null;
      if (c) {
        const g = c.getContext("webgl2") || c.getContext("webgl");
        // R3F already owns context; just report attrs
        glInfo = {
          width: c.width, height: c.height,
          client: [c.clientWidth, c.clientHeight],
          style: [c.style.width, c.style.height],
        };
      }
      return {
        webgl: !!window.WebGLRenderingContext,
        webgl2: !!window.WebGL2RenderingContext,
        canvas: glInfo,
        root: root ? { w: root.clientWidth, h: root.clientHeight, display: getComputedStyle(root).display } : null,
        errors: (window.__hiveErrors || []),
        badge: document.querySelector(".scene-badge")?.textContent || "",
      };
    })()
  `);

  // force a resize event
  await view.webContents.executeJavaScript(`window.dispatchEvent(new Event("resize"))`);
  await new Promise((r) => setTimeout(r, 2000));
  const after = await view.webContents.executeJavaScript(`
    (() => {
      const c = document.querySelector("canvas");
      return c ? { width: c.width, height: c.height, client: [c.clientWidth, c.clientHeight] } : null;
    })()
  `);

  const img = await view.webContents.capturePage();
  fs.writeFileSync(OUT, img.toPNG());
  fs.writeFileSync(LOG, JSON.stringify({ probe, after, bytes: fs.statSync(OUT).size }, null, 2));
  app.quit();
});
