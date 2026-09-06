# Build a Windows installer (beginner)

Your source folder stays. The installer is a **new file**. It does not eat your source.

## Rename the installer

Open `package.json`. These two lines control the name:

1. `"productName": "Hive"` — the app name in Start Menu
2. `"artifactName": "${productName}-Setup-${version}.${ext}"` — the Setup file name

Examples:

| productName | version | File you get |
|---|---|---|
| Hive | 0.0.1 | `Hive-Setup-0.0.1.exe` |
| Hive Desktop | 0.0.1 | `Hive Desktop-Setup-0.0.1.exe` |
| Hive | 0.0.2 | `Hive-Setup-0.0.2.exe` |

To rename: change `productName` and/or `version`, save, then rebuild.

NSIS shortcut name can also be set under `"nsis"`:

```json
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "shortcutName": "Hive"
}
```

## Make the installer

1. Close Hive if it is running (Ctrl+C in the terminal).
2. PowerShell:

```powershell
cd C:\Users\samko\Desktop\HiveSOURCE
git pull origin main
npm install
npm run dist:win
```

Or double-click `make-installer.bat` in HiveSOURCE.

3. Wait. First time can take several minutes.
4. Open:

`C:\Users\samko\Desktop\HiveSOURCE\release\`

5. Send judges this file:

`Hive-Setup-0.0.1.exe`

6. Double-click to install. Start Menu → Hive.

`Desktop\HiveSOURCE` is still there.

## Official Windows window

This build uses the real Windows title bar: minimize, maximize/restore, close, and drag the edges to resize. Close quits the app.
