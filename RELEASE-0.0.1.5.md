# Hive 0.0.1.5 — ship checklist

This is a mini update on top of 0.0.1.4. Installers go on **Hive-Desktop**
(https://github.com/samkomedved319-dev/Hive-Desktop), not hive-releases.

You still build the Windows installer on **your PC**.

## What 0.0.1.5 adds

- Model picker shows the two Hive Free models as cards: **GLM 5.3 (Fast)** and **Nemotron Nano (Reasoning)**
- Animated 1,000,000-token meter in Settings and a compact ring in the title bar
- **Admin panel** only your account can see (email contains `samkomedved`). Other accounts never get the icon or the command.
- From Admin you can search people, **Reset** their daily pool, grant **+100k**, give a **5M day**, Approve / Deny

---

## 1. Run the SQL (once)

1. Open [Supabase](https://supabase.com/dashboard) → project `nqkmnmwbmikbgopwkvse` → **SQL Editor**
2. Paste everything in `supabase/quota.sql`
3. Click **Run**
4. Confirm your profile has `is_admin = true` (the script sets it for `*samkomedved*` emails)

Without this step, Admin can open but the people list will be empty.

## 2. Pull the code on your Windows machine

```bat
cd C:\Users\medvedova\Desktop\Samko\HiveSOURCE
git pull origin main
```

You should see `HIVE_VERSION = '0.0.1.5'` in `src/main/hive-version.ts`.

## 3. Build the installer

```bat
bun install
bun run dist:win
```

When it finishes, the file is:

`release\Hive-Setup-0.0.1.5.exe`

## 4. Publish on Hive-Desktop (the installer repo)

1. Open https://github.com/samkomedved319-dev/Hive-Desktop/releases/new
2. Tag: `v0.0.1.5`
3. Title: `Hive 0.0.1.5`
4. Attach `Hive-Setup-0.0.1.5.exe`
5. Publish release
6. Mark this release as **latest**

Use the **tag** URL, never `/releases/latest/download/…`. That latest shortcut 404s when the newest tag does not contain that filename (that was the 0.0.1.4 bug — Hive-Desktop latest is still 0.0.1.3).

Correct URL after the file is attached:

`https://github.com/samkomedved319-dev/Hive-Desktop/releases/download/v0.0.1.5/Hive-Setup-0.0.1.5.exe`

## 5. Point the in-app updater at the new file

Edit `latest.json` on **HiveSOURCE** `main` (and copy the same JSON into **Hive-Desktop** `latest.json`) **only after** the `.exe` is attached:

```json
{
  "version": "0.0.1.5",
  "downloadUrl": "https://github.com/samkomedved319-dev/Hive-Desktop/releases/download/v0.0.1.5/Hive-Setup-0.0.1.5.exe",
  "notes": [
    { "type": "new", "text": "Pick GLM 5.3 or Nemotron Nano from the model menu." },
    { "type": "new", "text": "Animated 1,000,000-token Hive Free meter." },
    { "type": "new", "text": "Owner-only Admin panel: reset usage, grant tokens, approve people." }
  ]
}
```

Do **not** change `latest.json` until the `.exe` is actually attached, or Update will 404 again.

## 6. Try it

1. Sign in with **your** Hive account
2. A shield icon appears at the bottom of the left rail — that is Admin. Nobody else sees it
3. Settings → Models: two model cards + the animated 1M ring
4. Title bar pill: pick GLM 5.3 or Nemotron Nano, plus Fast / Auto / Heavy / Max
5. Admin → search an email → **Reset** (their next message starts a fresh 1M window)

People already on 0.0.1.3 / 0.0.1.4 click **Update and restart** in Hive. That downloads 0.0.1.5 from Hive-Desktop.
