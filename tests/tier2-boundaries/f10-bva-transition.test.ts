import { describe, it, expect, setTierContext } from '../harness'
import * as fs from 'fs'
import * as path from 'path'

setTierContext('tier2', 'F10: BVA Reveal Transition')

describe('Tier 2 — F10: Boundary & Corner Cases (Reveal Transition)', () => {
  const launchScreenPath = path.resolve(process.cwd(), 'src/renderer/components/launch/LaunchScreen.tsx')
  const code = fs.readFileSync(launchScreenPath, 'utf8')

  it('f10-b01: handleFinish contains hasExited guard preventing duplicate onComplete invocations', () => {
    expect(code.includes('if (hasExited) return')).toBe(true)
    expect(code.includes('setHasExited(true)')).toBe(true)
    expect(code.includes('onComplete()')).toBe(true)
  })

  it('f10-b02: minDurationMs default is set to ~2400ms for readable brand pacing', () => {
    expect(code.includes('minDurationMs = 2400') || code.includes('minDurationMs: 2400')).toBe(true)
  })

  it('f10-b03: remainingMs calculation guarantees minimum 450ms exit buffer via Math.max', () => {
    expect(code.includes('Math.max(minDurationMs - elapsed, 450)')).toBe(true)
  })

  it('f10-b04: launch screen container specifies z-[9999] ensuring topmost viewport stacking', () => {
    expect(code.includes('z-[9999]')).toBe(true)
    expect(code.includes('fixed inset-0')).toBe(true)
  })

  it('f10-b05: accessibility attributes role="dialog" and aria-label are declared on root', () => {
    expect(code.includes('role="dialog"')).toBe(true)
    expect(code.includes('aria-label="Hive Application Launch Screen"')).toBe(true)
  })
})
