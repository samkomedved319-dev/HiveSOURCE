# Project: ProjectHive — Grok Bot Mascot & Animated Launch Screen

## Architecture
ProjectHive is a desktop AI workspace built with Electron (main process) and React 19 + Vite 8 + Tailwind v4 (renderer process).
- **Main Process (`src/main/`)**:
  - Manages BrowserWindow lifecycle, system execution (`system-service.ts`), TTS (`tts-service.ts`), and OpenRouter AI completions (`openrouter-service.ts`).
  - Added: Web Search Service (`search-service.ts`) supporting OpenRouter web plugin with DuckDuckGo/Wikipedia fallback, returning structured citations (`url_citation`).
- **Preload Bridge (`src/preload/`)**:
  - Secure IPC exposure via `contextBridge.exposeInMainWorld('electronAPI', ...)`.
  - Channels: `ai.chat` (with search options & citations), `search.query`, `system.getVersion`, `system.exec`, `system.openApp`.
- **Renderer Process (`src/renderer/`)**:
  - **Launch Screen (`src/renderer/components/launch/LaunchScreen.tsx`)**: Displays glowing cyber-bee HIVE logo (`src/renderer/assets/hive_logo.jpg`), "npm run HIVE" animated terminal prompt, dynamic version tag from `package.json`, and smooth reveal transition to main workspace.
  - **Mascot Companion (`src/renderer/companion/` & `src/renderer/components/mascot/`)**:
    - `hex-mascot.js`: Canvas 2D engine with 26-point softbody physics, procedural faces, Web Audio procedural synth, and speech bubbles.
    - `HexCompanion.tsx`: React wrapper lifecycle.
    - `grokPersonality.ts`: Grok Bot personality module supplying witty, razor-sharp commentary for queries, code execution, errors, search states, and milestones.
    - `ChatView.tsx`: Mounts interactive mascot companion widget, synchronized with search events, chat messages, code generation, and physics interactions.
  - **Chat & Citations (`src/renderer/components/chat/`)**:
    - `MessageList.tsx` & `MessageItem.tsx`: Displays chat messages with interactive cited source cards.

## Code Layout
```
src/
├── main/
│   ├── index.ts                     # Electron main entry & window lifecycle
│   ├── openrouter-service.ts        # OpenRouter AI gateway (enhanced with web plugin & citations)
│   ├── search-service.ts            # Dedicated search fallback and query parser
│   ├── system-service.ts            # System commands & version retrieval
│   └── tts-service.ts               # Edge Neural TTS
├── preload/
│   └── index.ts                     # Preload IPC definitions (ai, search, system)
└── renderer/
    ├── assets/
    │   └── hive_logo.jpg            # Cyber-bee HIVE logo
    ├── companion/
    │   ├── hex-mascot.js            # Core HTML5 Canvas mascot engine
    │   └── grokPersonality.ts       # Grok Bot witty commentary & personality engine
    ├── components/
    │   ├── launch/
    │   │   └── LaunchScreen.tsx     # Animated startup screen with terminal typing & logo reveal
    │   ├── mascot/
    │   │   ├── HexCompanion.tsx     # React wrapper for Hex mascot engine
    │   │   └── MascotWidget.tsx     # Docked/floating interactive mascot container with controls
    │   └── chat/
    │       ├── ChatView.tsx         # Chat view with mascot integration & search trigger
    │       ├── MessageItem.tsx      # Message rendering with citation cards
    │       └── MessageList.tsx      # Chat message feed
    ├── stores/
    │   ├── agentStore.ts            # Agent profiles (Hive CEO, Apollo, Athena)
    │   └── chatStore.ts             # Chat state & mascot speech store
    ├── types.ts                     # Shared interfaces (Message, SearchCitation, MascotState)
    └── App.tsx                      # Top-level component coordinating launch screen and workspace
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Real-time Web Search Backend | IPC search integration using OpenRouter web plugin with DuckDuckGo fallback returning structured citations | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Search Synthesis & Cited Sources UI | Chat synthesis rendering cited source cards with title, url, snippet | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Mascot Searching State & Sonar Animation | Mascot switches to `searching` state with radar visor, orbiting magnifier, and sonar audio blips during web searches | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Grok Bot Personality & Banter Engine | Witty, intelligent commentary for queries, code execution, errors, milestones, and physical gestures | M2 | ORIGINAL_REQUEST §R1 |
| 5 | Mascot Docked/Floating Chat Integration | Mount `<HexCompanion>` in `ChatView.tsx` with drag, minimize, and sound toggle controls | M2 | ORIGINAL_REQUEST §R1 |
| 6 | Interactive Physics & Speech Flaps | 26-point softbody jelly rim, poke/pet/drag physics, and typewriter speech bubble with mouth flaps | M2 | ORIGINAL_REQUEST §R1 |
| 7 | Glowing Cyber-Bee Logo Display | Display `src/renderer/assets/hive_logo.jpg` with glowing neon pulse animation | M3 | ORIGINAL_REQUEST §R2 |
| 8 | Animated Terminal "npm run HIVE" | Typewriter terminal animation with blinking cursor and stylized terminal container | M3 | ORIGINAL_REQUEST §R2 |
| 9 | Dynamic Version Tag Display | Read version dynamically from `package.json` (e.g. `v1.0.0`) and display in launch screen | M3 | ORIGINAL_REQUEST §R2 |
| 10 | Smooth Workspace Reveal Transition | Zero-stutter reveal transition with scale/blur fade out into main chat workspace | M3 | ORIGINAL_REQUEST §R2 |
| 11 | E2E Testing Suite (Tiers 1-4) | Comprehensive automated test suite for search, mascot, physics, launch screen, and build | M4 | System Quality |
| 12 | Final Integration & Adversarial Hardening | End-to-end verification, Tier 5 adversarial tests, and clean Forensic Audit | M5 | System Quality |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Web Search & Citation Pipeline | Main search service, OpenRouter web plugin, preload bridge, types, citation cards, mascot search trigger | none | DONE |
| 2 | M2: Grok Bot Mascot & Chat Mounting | Grok personality engine, mount mascot in ChatView, physics/reaction wiring, speech bubble flaps | M1 | DONE |
| 3 | M3: Animated Launch Screen & Branding | LaunchScreen component, cyber-bee logo, terminal animation, dynamic version, reveal transition | none | DONE |
| 4 | M4: E2E Test Suite Creation | Automated test infrastructure, Tiers 1-4 test cases covering all inventoried features | M1, M2, M3 | DONE |
| 5 | M5: Final Verification & Audit | Pass 100% E2E tests, Tier 5 adversarial hardening, Forensic Audit verification | M4 | DONE |

## Interface Contracts
### Main ↔ Renderer Search Bridge
```typescript
export interface SearchCitation {
  url: string;
  title: string;
  content: string;
}

export interface SearchResult {
  ok: boolean;
  query: string;
  content: string;
  citations: SearchCitation[];
  error?: string;
}

// In preload:
window.electronAPI.search = {
  query: (query: string) => Promise<SearchResult>
}

// In ai.chat:
window.electronAPI.ai.chat = (
  messages: Array<{ role: string; content: string }>,
  model?: string,
  options?: { webSearch?: boolean }
) => Promise<{
  ok: boolean;
  content: string;
  citations?: SearchCitation[];
  error?: string;
}>
```

### Grok Personality ↔ Mascot Interface
```typescript
export interface GrokCommentary {
  state: 'idle' | 'thinking' | 'searching' | 'coding' | 'working' | 'done' | 'error' | 'sleep';
  face?: 'happy' | 'excited' | 'cool' | 'wink' | 'think' | 'surprised';
  speech: string;
  durationMs?: number;
}

export interface GrokPersonalityEngine {
  onQuery(text: string, agentId?: string): GrokCommentary;
  onSearchStart(query: string): GrokCommentary;
  onSearchDone(query: string, citationsCount: number): GrokCommentary;
  onCodeGeneration(): GrokCommentary;
  onDone(): GrokCommentary;
  onError(err: string): GrokCommentary;
  onPoke(): GrokCommentary;
  onPet(): GrokCommentary;
}
```

### Launch Screen Contract
```typescript
export interface LaunchScreenProps {
  onComplete: () => void;
  minDurationMs?: number; // default ~2200ms
}
```
