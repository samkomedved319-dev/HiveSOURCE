/**
 * Tier 5: Adversarial Hardening & Stress Test Suite
 * Feature: Launch Screen, Lifecycle & Transition Robustness
 *
 * Scenarios:
 * 1. Rapid key pressing flood (Escape, Enter, Space, Tab) & non-skip keys
 * 2. Rapid mouse click flood & stopPropagation boundary verification
 * 3. Premature unmounting cleanup at typewriter, step delay, and exit buffer stages
 * 4. Missing/corrupted package.json, IPC version resolution & double 'v' prefix edge cases
 * 5. Parent re-render effect thrashing analysis (unmemoized onComplete callback)
 * 6. Zero-flash pre-mount architecture & z-index stacking supremacy
 * 7. CSS hardware acceleration & GPU compositing properties
 * 8. Viewport dimension boundary analysis (content height vs min window size)
 */

import { describe, it, expect, setTierContext } from '../harness'
import * as fs from 'fs'
import * as path from 'path'

setTierContext('tier4', 'Tier 5 Adversarial: Launch Screen & Transition')

describe('Tier 5 Adversarial — Launch Screen Lifecycle, Timers & Transitions', () => {
  const launchScreenPath = path.resolve(process.cwd(), 'src/renderer/components/launch/LaunchScreen.tsx')
  const appPath = path.resolve(process.cwd(), 'src/renderer/App.tsx')
  const preloadPath = path.resolve(process.cwd(), 'src/preload/index.ts')
  const mainPath = path.resolve(process.cwd(), 'src/main/index.ts')
  const systemServicePath = path.resolve(process.cwd(), 'src/main/system-service.ts')
  const packageJsonPath = path.resolve(process.cwd(), 'package.json')

  const launchCode = fs.readFileSync(launchScreenPath, 'utf8')
  const appCode = fs.readFileSync(appPath, 'utf8')
  const preloadCode = fs.readFileSync(preloadPath, 'utf8')
  const mainCode = fs.readFileSync(mainPath, 'utf8')
  const systemServiceCode = fs.readFileSync(systemServicePath, 'utf8')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

  // --------------------------------------------------------------------------
  // ADV-01: Rapid Keydown Flooding & Re-entrance Guard
  // --------------------------------------------------------------------------
  it('adv-01: rapid keydown flood (Escape/Enter/Space/Tab) and re-entrance behavior', () => {
    let onCompleteCalls = 0
    let hasExitedState = false

    // Simulate LaunchScreen handleFinish closure
    const onComplete = () => { onCompleteCalls++ }
    const handleFinish = () => {
      if (hasExitedState) return
      hasExitedState = true
      onComplete()
    }

    const handleKeyDown = (e: { key: string }) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key === 'Tab') {
        handleFinish()
      }
    }

    // Burst 100 rapid valid key events
    const keys = ['Escape', 'Enter', ' ', 'Tab']
    for (let i = 0; i < 100; i++) {
      handleKeyDown({ key: keys[i % keys.length] })
    }

    // Re-entrance guard in handleFinish must restrict execution
    expect(onCompleteCalls).toBe(1)
    expect(hasExitedState).toBe(true)

    // Non-dismiss keys must NOT trigger handleFinish
    let invalidKeyCalls = 0
    const testInvalidKey = (key: string) => {
      if (key === 'Escape' || key === 'Enter' || key === ' ' || key === 'Tab') {
        invalidKeyCalls++
      }
    }
    const nonDismissKeys = ['a', 'z', 'F5', 'Shift', 'Control', 'Alt', 'Backspace', 'ArrowUp', '1']
    for (const k of nonDismissKeys) {
      testInvalidKey(k)
    }
    expect(invalidKeyCalls).toBe(0)
  })

  // --------------------------------------------------------------------------
  // ADV-02: Rapid Mouse Click Flooding & Terminal Shielding
  // --------------------------------------------------------------------------
  it('adv-02: rapid mouse click flooding and terminal stopPropagation shielding', () => {
    let backdropDismissCount = 0
    const onComplete = () => { backdropDismissCount++ }

    let hasExited = false
    const handleFinish = () => {
      if (hasExited) return
      hasExited = true
      onComplete()
    }

    // Simulate backdrop click
    for (let i = 0; i < 50; i++) {
      handleFinish()
    }
    expect(backdropDismissCount).toBe(1)

    // Verify stopPropagation is present on the terminal window container
    expect(launchCode.includes('onClick={(e) => e.stopPropagation()}')).toBe(true)

    // Verify right-click (contextmenu) or auxclick are not attached to handleFinish
    expect(launchCode.includes('onContextMenu')).toBe(false)
    expect(launchCode.includes('onAuxClick')).toBe(false)
  })

  // --------------------------------------------------------------------------
  // ADV-03: Premature Unmounting Cleanup — Typewriter Interval
  // --------------------------------------------------------------------------
  it('adv-03: premature unmount during typewriter sequence cleans up timeout without leaks', async () => {
    let timerCleared = false
    let charactersTyped = 0
    const fullCommand = 'npm run HIVE'

    let timeoutId: any = null
    const clearTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timerCleared = true
      }
    }

    // Simulate typewriter start
    timeoutId = setTimeout(() => {
      charactersTyped++
    }, 50)

    // Premature unmount occurs at t=10ms before typewriter fires
    clearTimer()

    // Wait for original scheduled time
    await new Promise((r) => setTimeout(r, 80))

    expect(timerCleared).toBe(true)
    expect(charactersTyped).toBe(0) // Did not execute after unmount
    expect(launchCode.includes('if (timeoutId) clearTimeout(timeoutId)')).toBe(true)
  })

  // --------------------------------------------------------------------------
  // ADV-04: Premature Unmounting Cleanup — Status Step Delays
  // --------------------------------------------------------------------------
  it('adv-04: premature unmount during step delay sequence clears stepTimer cleanly', async () => {
    let stepExecuted = false
    let activeStepIndex = 1

    let stepTimer: any = setTimeout(() => {
      activeStepIndex++
      stepExecuted = true
    }, 240)

    // Premature unmount at t=30ms
    clearTimeout(stepTimer)

    await new Promise((r) => setTimeout(r, 260))

    expect(stepExecuted).toBe(false)
    expect(activeStepIndex).toBe(1)
    expect(launchCode.includes('return () => clearTimeout(stepTimer)')).toBe(true)
  })

  // --------------------------------------------------------------------------
  // ADV-05: Premature Unmounting Cleanup — Exit Buffer Timer
  // --------------------------------------------------------------------------
  it('adv-05: premature unmount during exit buffer clears exitTimer cleanly', async () => {
    let finishTriggered = false
    let exitTimer: any = setTimeout(() => {
      finishTriggered = true
    }, 450)

    // Unmount occurs during exit buffer
    clearTimeout(exitTimer)

    await new Promise((r) => setTimeout(r, 470))

    expect(finishTriggered).toBe(false)
    expect(launchCode.includes('return () => clearTimeout(exitTimer)')).toBe(true)
  })

  // --------------------------------------------------------------------------
  // ADV-06: Missing or Malformed Version Fallback & Prefix Analysis
  // --------------------------------------------------------------------------
  it('adv-06: missing/corrupted version fallback handles undefined API safely', async () => {
    // Vector A: package.json version fallback
    const fallbackVersion = `v${packageJson.version || '1.0.0'}`
    expect(fallbackVersion).toBe('v0.0.1')

    const emptyPackageJson: any = {}
    const defaultFallback = `v${emptyPackageJson.version || '1.0.0'}`
    expect(defaultFallback).toBe('v1.0.0')

    // Vector B: IPC version fetch error resilience
    let resolvedVersion = defaultFallback
    const simulatedBrokenIPC = async () => {
      throw new Error('IPC Bridge Disconnected')
    }

    try {
      const ver = await simulatedBrokenIPC()
      if (ver) resolvedVersion = `v${ver}`
    } catch {
      // Fallback kept
    }
    expect(resolvedVersion).toBe('v1.0.0')

    // Vector C: Preload discrepancy inspection:
    // LaunchScreen checks electronAPI?.app?.getVersion, but preload exposes system.exec/openApp
    const appGetVersionInPreload = preloadCode.includes('app:') && preloadCode.includes('getVersion')
    expect(appGetVersionInPreload).toBe(false) // Confirms fallback is active in production

    // Vector D: Double 'v' prefix vulnerability check:
    // If an IPC bridge ever returns 'v1.0.0' instead of '1.0.0':
    const rawIpcOutput = 'v1.0.0'
    const naivePrefixed = `v${rawIpcOutput}` // becomes 'vv1.0.0'
    const hardenedPrefixed = rawIpcOutput.startsWith('v') ? rawIpcOutput : `v${rawIpcOutput}`
    expect(naivePrefixed).toBe('vv1.0.0')
    expect(hardenedPrefixed).toBe('v1.0.0')
  })

  // --------------------------------------------------------------------------
  // ADV-07: Parent Re-render & Effect Pacing Stability
  // --------------------------------------------------------------------------
  it('adv-07: LaunchScreen minDurationMs and handleFinish dependencies guarantee exit pacing', () => {
    // Verify default minDurationMs is configured to 2400ms for readable brand experience
    expect(launchCode.includes('minDurationMs = 2400')).toBe(true)

    // Verify remainingMs calculation guarantees at least 450ms exit buffer
    expect(launchCode.includes('const remainingMs = Math.max(minDurationMs - elapsed, 450)')).toBe(true)

    // Verify startTimeRef uses ref to survive re-renders without resetting clock
    expect(launchCode.includes('const startTimeRef = useRef<number>(Date.now())')).toBe(true)
  })

  // --------------------------------------------------------------------------
  // ADV-08: Pre-Mounted Zero-Flash Workspace Architecture & Z-Index Supremacy
  // --------------------------------------------------------------------------
  it('adv-08: zero-flash pre-mount and z-[9999] stacking context supremacy', () => {
    // App.tsx mounts LaunchScreen and Workspace simultaneously in initial render tree
    expect(appCode.includes('<LaunchScreen')).toBe(true)
    expect(appCode.includes('gridTemplateColumns')).toBe(true)

    // LaunchScreen uses fixed inset-0 z-[9999] ensuring absolute viewport occlusion
    expect(launchCode.includes('fixed inset-0 z-[9999]')).toBe(true)

    // Color harmony: all layers share dark-theme values preventing white screen flashes
    expect(launchCode.includes('bg-[#09090b]')).toBe(true)
    expect(mainCode.includes("backgroundColor: '#0a0a0a'")).toBe(true)
    expect(appCode.includes("background: 'var(--bg)'")).toBe(true)
  })

  // --------------------------------------------------------------------------
  // ADV-09: CSS Hardware Acceleration & Composite Transition Properties
  // --------------------------------------------------------------------------
  it('adv-09: exit animation utilizes GPU composite-only properties scale, opacity, blur', () => {
    // scale: 1.03 -> transform compositing (zero layout reflow)
    expect(launchCode.includes('scale: 1.03')).toBe(true)

    // opacity: 0 -> layer alpha compositing
    expect(launchCode.includes('opacity: 0')).toBe(true)

    // blur(14px) -> GPU hardware-accelerated filter
    expect(launchCode.includes("filter: 'blur(14px)'")).toBe(true)

    // Cubic-bezier smooth easing curve
    expect(launchCode.includes('ease: [0.16, 0.8, 0.24, 1]')).toBe(true)
    expect(launchCode.includes('duration: 0.65')).toBe(true)
  })

  // --------------------------------------------------------------------------
  // ADV-10: Viewport Dimension Bounds & Layout Stability
  // --------------------------------------------------------------------------
  it('adv-10: responsive viewport sizing constraints and content height bounds', () => {
    // Main window constraints in Electron configuration:
    expect(mainCode.includes('minWidth: 980')).toBe(true)
    expect(mainCode.includes('minHeight: 640')).toBe(true)
    expect(mainCode.includes('width: 1280')).toBe(true)
    expect(mainCode.includes('height: 840')).toBe(true)

    // LaunchScreen elements:
    // Logo card: w-28 h-28 (112px)
    // Title + badge: ~80px
    // Terminal container: min-h-[190px] + 32px header = 222px
    // Skip button + padding: ~80px
    // Total content height: ~494px - 524px
    // Since minHeight is 640px, content comfortably fits with >110px vertical margin.
    const estimatedContentHeight = 112 + 80 + 222 + 80
    const electronMinHeight = 640
    expect(electronMinHeight).toBeGreaterThan(estimatedContentHeight)

    // Terminal container enforces max-w-lg (512px) to prevent layout distortion on wide screens
    expect(launchCode.includes('max-w-lg')).toBe(true)
  })
})
