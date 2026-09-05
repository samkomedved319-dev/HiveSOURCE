# Prompt for Gemini — Build "Hive" Electron App UI

Copy everything below into Gemini.

---

I'm building a Windows desktop AI chat app called **Hive** (similar to Grok's desktop app, but cleaner) using **Electron**. I have a finished visual design I need you to implement pixel-accurately as a real Electron app.

## Reference

I'm attaching `hive-prototype.html` — a static HTML/CSS/JS mockup showing the exact look, spacing, colors, and one motion moment (the canvas panel sliding open). Treat this file as the source of truth for visual design. Match colors, radii, spacing, and typography exactly as written in its `<style>` block.

## Design tokens (from the prototype — use these verbatim)

```css
--bg: #0D0E11;        /* app background */
--panel: #17181C;      /* sidebar, composer, message bubbles */
--panel-2: #1D1F24;    /* hover states, nested surfaces */
--border: #2A2C32;
--border-soft: #232529;
--text: #F5F6F7;
--text-dim: #8A8D96;
--text-faint: #55585F;
--accent: #F2C14E;     /* the ONLY accent color — used sparingly */
--accent-dim: #6B5A2A;
--radius: 10px;
font families: 'Inter' (UI/body/headers), 'JetBrains Mono' (code only)
```

Design philosophy: minimal, neutral, "pro tool" — closer to a code editor than a consumer chat app. One accent color used only for the active state indicator, send button, and the hexagon "thinking" icon. No card-soup, no gradients except the small avatar badge, no shadows. The hexagon shape from "Hive" appears exactly once, functionally, as the AI thinking/status indicator — never as decorative wallpaper or pattern.

## App structure to build

1. **Icon rail** (56px fixed width, left edge) — logo mark (hexagon outline SVG) at top, then 3 nav icons (Chat / Projects / Voice), spacer, Settings icon, user avatar circle at bottom.
2. **Conversation list panel** (240px, collapsible via keyboard shortcut `Cmd/Ctrl+B`) — search field, grouped by "Today" / "Previous 7 Days" etc, active item marked with a 2px accent-colored left bar (not a filled background).
3. **Main chat column** (flexible width) — top bar with model-selector pill (draggable region for window controls on Windows), message thread (centered, max-width 680px), composer pinned to bottom with auto-growing textarea, attach/tools icon buttons, circular accent send button.
4. **Canvas panel** (400px, slides in/out from the right with a smooth transform transition, not just opacity) — used for generated files, code, or future live tool output. Toggled from the top bar icon or automatically when Hive produces a file/artifact.

## Required animations (implement with CSS transitions/keyframes, respecting `prefers-reduced-motion`)

- **Canvas panel slide**: grid-template-columns transition, ~450ms, custom easing `cubic-bezier(.16,.8,.24,1)` — matches the prototype exactly.
- **Message entrance**: each new message fades up (8px translateY + opacity), staggered ~100ms per message, single orchestrated moment on load — not a scroll-triggered repeat.
- **Thinking indicator**: the hexagon outline icon rotates continuously (2.2s linear) while Hive is generating a response; a text label beside it pulses opacity to indicate "live" status.
- **Composer focus**: border color and a subtle glow ring transition on focus (not on every interaction — restraint).
- **Send button**: scale up slightly on hover, scale down on click (tactile, not decorative).
- Avoid adding any additional hover/entrance animation beyond what's in the prototype — the brief specifically wants restraint, not a decorated interface.

## Electron-specific requirements

- Use `contextIsolation: true` and a preload script — no direct Node access from the renderer.
- Implement custom window chrome: hide the native Windows titlebar, use `-webkit-app-region: drag` on the top bar (already marked in the prototype's CSS) with `-webkit-app-region: no-drag` on all interactive elements inside it, and build minimal custom minimize/maximize/close buttons in the top-right, styled to match the dark theme (not default Windows white icons).
- Set up IPC channels for: sending a chat message, receiving streamed tokens back (for the typing/thinking state), and opening/closing the canvas panel.
- Package structure: `main.js` (main process, window creation, IPC handlers), `preload.js` (safe bridge), `renderer/` (the UI from the prototype, split into components), `theme.css` (the token file, extracted from the prototype's `:root`).
- Target Windows packaging via `electron-builder`, NSIS installer, app icon derived from the hexagon logo mark in the prototype.

## What to deliver

1. Full Electron project scaffold (`package.json`, `main.js`, `preload.js`).
2. The renderer UI broken into clean HTML/CSS/JS (or React if you prefer, but keep it simple — no heavy framework needed for this scope) matching the prototype exactly.
3. `theme.css` with the tokens above as CSS custom properties.
4. Wire up fake/mock streaming responses for now (I'll connect the real model API myself) — but build the IPC plumbing so streaming tokens can update the message content live, with the thinking indicator shown until the first token arrives.
5. Make it responsive down to a minimum window width of ~900px (collapse the conversation list panel below that, keep icon rail + chat only).

Ask me before making any visual changes to color, spacing, or layout that aren't in the prototype — I want the design followed precisely, not reinterpreted.
