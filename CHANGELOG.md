# Changelog

## 0.0.1.5 — 2026-09-06

- Model menu: GLM 5.3 (Fast) and Nemotron Nano (Reasoning) as first-class Hive Free choices
- Animated 1,000,000-token Hive Free meter in Settings and the title bar
- Owner-only Admin panel (hidden for everyone else): reset usage, grant tokens, approve / deny
- Cloud quota table so a reset applies on the person’s next Hive session


## 0.0.1.4 — 2026-09-06

- Hive Free TokenRouter: `z-ai/glm-5.3-free` and `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`
- 1,000,000 tokens per day; window starts on the first AI message and resets 24 hours later
- Fast/Auto use GLM; Heavy/Max use Nemotron Nano
- Public download page (no GitHub sign-in): website `/download-win.html`

## 0.0.1.3 — 2026-09-06

- First-login tutorial
- Buddy Model: Fast / Auto / No
- Integrations, Auth, and Chrome extension hidden from Settings
- Uninstall wipes app data so a reinstall asks for login
- Update and restart still applies from GitHub Releases

## 0.0.1.2 — 2026-09-06

- Update and restart in one click (downloads the installer, applies it, relaunches Hive)
- What’s New popup after each update
- Hive logo in the left rail no longer opens the office — use the Office tab
- Windows app / taskbar / installer use the Hive bee, not Electron
- electron-builder 26 installer config fixed (`signExecutable` instead of invalid `signDlls`)

## 0.0.2 — 2026-09-05

- Command palette (`Ctrl+K`): new chat, group, Buddy, canvas, settings, workers, notch
- Empty-state demo chip for the hackathon concurrency prompt
- Swarm strip shows when 2+ agents are overlapping

## 0.0.1 — 2026-09-05

First public cut of Hive as a Mozaik concurrent-agent desktop companion.

- Scout, Hive, and Pulse `runLoop` together on one user message; Critic reacts to Hive; Sentry intercepts
- Live ops timeline with overlap timestamps
- Streaming tokens into each agent's chat bubble
- Per-conversation swarm rooms persisted on disk
- Telegram inbound messages go through the same `sendMessage` path
- Tray **Ask Hive** opens the notch without the full window
- Website login via `hive://` + Supabase waitlist
- Human Allow/Deny for Operator machine tools
