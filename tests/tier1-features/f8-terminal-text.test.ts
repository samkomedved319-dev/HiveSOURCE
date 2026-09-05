import { describe, it, expect, setTierContext } from '../harness'
import * as fs from 'fs'
import * as path from 'path'

setTierContext('tier1', 'F8: Animated Terminal')

describe('Tier 1 — F8: Animated Terminal "npm run HIVE"', () => {
  const launchScreenPath = path.resolve(process.cwd(), 'src/renderer/components/launch/LaunchScreen.tsx')
  const code = fs.readFileSync(launchScreenPath, 'utf8')

  it('f8-01: fullCommand variable is configured to "npm run HIVE"', () => {
    expect(code.includes("fullCommand = 'npm run HIVE'") || code.includes('fullCommand = "npm run HIVE"')).toBe(true)
  })

  it('f8-02: STATUS_STEPS includes system runtime initialization checklist', () => {
    expect(code.includes('STATUS_STEPS')).toBe(true)
    expect(code.includes('Initializing Hive Core')).toBe(true)
    expect(code.includes('Mounting Grok Mascot')).toBe(true)
    expect(code.includes('Synthesizing Neural Matrix')).toBe(true)
    expect(code.includes('HIVE READY')).toBe(true)
  })

  it('f8-03: terminal window header features macOS traffic light dots and bash title', () => {
    expect(code.includes('bg-red-500')).toBe(true)
    expect(code.includes('bg-amber-500')).toBe(true)
    expect(code.includes('bg-emerald-500')).toBe(true)
    expect(code.includes('hive-core ~ bash')).toBe(true)
  })

  it('f8-04: terminal command line includes shell user prompt and terminal data test ID', () => {
    expect(code.includes('samko@hive-os')).toBe(true)
    expect(code.includes('~/project-hive')).toBe(true)
    expect(code.includes('data-testid="launch-terminal-command"')).toBe(true)
  })

  it('f8-05: status steps render [OK] and [READY] progression tags', () => {
    expect(code.includes("[OK]") || code.includes("tag: 'OK'")).toBe(true)
    expect(code.includes("[READY]") || code.includes("tag: 'READY'")).toBe(true)
    expect(code.includes('animate-pulse')).toBe(true)
  })
})
