# Build a Windows installer (beginner)

Your source folder stays. The installer is a **new file** next to it.

## Customize the name first (optional)

Open `package.json`. Two lines control the name people see:

```json
"productName": "Hive"
```

and under `"build"` the same `"productName": "Hive"`.

Change both to e.g. `"Hive Desktop"`. The Setup file will be:

`Hive Desktop-Setup-0.0.3.exe`

Also bump `"version"` (example `"0.0.4"`) when you ship an update.

## Make the installer

1. Close Hive if `npm run dev` is running (Ctrl+C in the terminal).
2. Open PowerShell:

```powershell
cd C:\Users\samko\Desktop\HiveSOURCE
git pull origin main
npm install
npm run dist:win
```

3. Wait. First time can take several minutes.
4. Open this folder:

`C:\Users\samko\Desktop\HiveSOURCE\release\`

5. The file you send people is:

`Hive-Setup-0.0.3.exe`  
(or `Hive Desktop-Setup-…` if you renamed it)

6. Double-click it to install. Start Menu → Hive.

`Desktop\HiveSOURCE` is still there. You did not lose source.

## If it fails

- “electron-builder not found” → run `npm install` again in HiveSOURCE.
- Do this on **Windows**, not on a phone or in the cloud.
