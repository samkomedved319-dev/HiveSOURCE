# Build a Windows installer (Hive Setup.exe)

Do this **on the Windows PC** that already runs `npm run dev`.

## 1. Tools

- Node.js 22 or newer (`node -v`)
- Git
- This repo at `C:\Users\samko\Desktop\HiveSOURCE`
- For a signed installer later: a Windows code-signing certificate (optional)

## 2. Get a clean tree

```powershell
cd C:\Users\samko\Desktop\HiveSOURCE
git pull origin main
npm install
```

Confirm `npm run dev` still opens the app, then close it.

## 3. Build the installer

```powershell
npm run dist:win
```

That command:

1. Bundles the React UI (`vite build` → `dist/renderer`)
2. Compiles Electron main + preload (`dist/main`, `dist/preload`)
3. Runs electron-builder with the **NSIS** target

Output folder:

```
C:\Users\samko\Desktop\HiveSOURCE\release\
```

You want:

- `Hive Setup 0.0.3.exe` — the installer (this is what you ship)
- Sometimes also `Hive-0.0.3-win.zip` / unpacked `win-unpacked\`

## 4. Install and test

1. Quit `npm run dev`
2. Double-click `Hive Setup 0.0.3.exe`
3. Choose a folder (one-click is off so you can pick)
4. Launch **Hive** from the Start Menu
5. Send two chat messages, open Office, send a floor task, check Settings → Updates

## 5. Ship an update

1. Bump `"version"` in `package.json` (example `0.0.4`)
2. Commit + push to GitHub
3. Run `npm run dist:win` again
4. Upload the new `Hive Setup x.y.z.exe` to GitHub **Releases**
5. Installed copies use Settings → **Check now** against `package.json` on `main`

## 6. Common failures

| What you see | Fix |
|---|---|
| `electron-builder` not found | `npm install` at the repo root |
| Build wants Wine on Linux | Build on Windows; this repo is a Windows app |
| App opens blank | You started `electron .` without `npm run build` first |
| Missing OpenRouter | Set the key in Settings after install; `.env` is not inside the installer |

## 7. Optional icon

Put `build/icon.ico` in the repo and add to `package.json` under `"build"`:

```json
"win": { "target": "nsis", "icon": "build/icon.ico" }
```
