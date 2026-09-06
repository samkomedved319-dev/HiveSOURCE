const { chromium } = require("C:/Users/samko/Desktop/3D-Office/AI.Agents.Office.Map.WebGL/node_modules/playwright");
const fs = require("fs");
(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--use-angle=swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const logs = [];
  page.on("pageerror", (e) => logs.push("[pageerror] " + e.message));
  page.on("console", (m) => { if (m.type() === "error") logs.push("[error] " + m.text()); });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(2000);
  // Try click rail / office control
  const clicked = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll("button, [role=button], a, div, span"));
    const hit = nodes.find((el) => /3D Office|HiveOffice|office/i.test(el.textContent || "") && (el.textContent || "").length < 40);
    if (hit) { hit.dispatchEvent(new MouseEvent("click", { bubbles: true })); return hit.textContent.trim(); }
    return null;
  });
  await page.waitForTimeout(8000);
  const info = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    const badge = document.querySelector(".scene-badge")?.textContent || "";
    return {
      canvas: c ? { w: c.width, h: c.height, client: [c.clientWidth, c.clientHeight] } : null,
      badge,
      hasSceneRoot: !!document.querySelector(".scene-root"),
      title: document.title,
    };
  });
  await page.screenshot({ path: "C:/Users/samko/Desktop/HiveSOURCE/_native_office_smoke.png", fullPage: false });
  fs.writeFileSync("C:/Users/samko/Desktop/HiveSOURCE/_native_office_smoke.json", JSON.stringify({ clicked, info, logs: logs.slice(-30), bytes: fs.statSync("C:/Users/samko/Desktop/HiveSOURCE/_native_office_smoke.png").size }, null, 2));
  await browser.close();
})().catch((e) => {
  require("fs").writeFileSync("C:/Users/samko/Desktop/HiveSOURCE/_native_office_smoke.json", JSON.stringify({ fatal: String(e) }, null, 2));
  process.exit(1);
});
