# E2E Test Infra: ProjectHive

## Test Philosophy
- Opaque-box, requirement-driven. Derived from `ORIGINAL_REQUEST.md` and user-facing specifications.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Interaction Testing + Real-World Workload Testing.
- Pass/fail semantics: zero errors, exit code 0, 100% assertions passing.

## Feature Inventory & Test Coverage
| # | Feature | Source (Requirement) | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Real-World) |
|---|---------|----------------------|:----------------:|:-----------------:|:-----------------:|:-------------------:|
| 1 | Web Search Backend & Fallbacks | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | Citation Synthesis & Rendering | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 3 | Mascot Searching Animation State | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 4 | Grok Bot Personality & Banter | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 5 | Mascot Docked Widget Mounting | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 6 | Interactive Physics & Speech Flaps | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 7 | Glowing Cyber-Bee Logo Display | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 8 | Animated Terminal "npm run HIVE" | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 9 | Dynamic Version Tag Display | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 10 | Smooth Workspace Reveal Transition | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test runner: Automated Node/TypeScript test suite (`npm run test:e2e` or `npx tsx scripts/test-runner.ts` / Vitest).
- Test case format:
  - Unit & Integration modules verifying contracts, data structures, state machines, and components.
  - Snapshot / contract verification ensuring no regressions or missing elements.
- Verification channels:
  - Process exit codes
  - Contract validation on search & personality engines
  - Static asset & build output verification (`npm run build`)
  - Component rendering verification

## Test Coverage Thresholds
- Tier 1: ≥5 test cases per feature (50 tests total)
- Tier 2: ≥5 boundary and edge test cases per feature (50 tests total)
- Tier 3: ≥10 pairwise interaction test cases
- Tier 4: ≥6 realistic end-to-end workload scenarios
- **Total test cases**: ≥116 tests

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Expected Outcome |
|---|----------|--------------------|------------------|
| 1 | Fresh Application Startup | F7, F8, F9, F10 | Launch screen renders logo, types terminal command, reads v1.0.0, reveals workspace cleanly |
| 2 | User Search Query Flow | F1, F2, F3, F4, F5 | Mascot enters radar searching state, Grok banter displayed, search results returned with citations |
| 3 | Coding & Execution Reaction | F4, F5, F6 | Mascot enters coding state, typing arms animate, witty coding banter in speech bubble |
| 4 | Interactive Mascot Play | F4, F5, F6 | User drags, pokes, pets mascot; softbody rim deforms, speech bubble flaps, audio blips trigger |
| 5 | Error Recovery Scenario | F4, F5, F6 | Network error or execution error triggers error state (warning badge, X eyes, witty recovery banter) |
| 6 | Full Project Build Verification | F1-F10 | `npm run build` succeeds cleanly with code 0 and all modules bundled |
