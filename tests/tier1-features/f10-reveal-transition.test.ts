import { describe, it, expect, setTierContext } from '../harness'
import * as fs from 'fs'
import * as path from 'path'

setTierContext('tier1', 'F10: Workspace Reveal Transition')

describe('Tier 1 — F10: Smooth Workspace Reveal Transition', () => {
  const launchScreenPath = path.resolve(process.cwd(), 'src/renderer/components/launch/LaunchScreen.tsx')
  const code = fs.readFileSync(launchScreenPath, 'utf8')
  const appPath = path.resolve(process.cwd(), 'src/renderer/App.tsx')
  const appCode = fs.readFileSync(appPath, 'utf8')

  it('f10-01: LaunchScreen accepts onComplete and minDurationMs props', () => {
    expect(code.includes('interface LaunchScreenProps')).toBe(true)
    expect(code.includes('onComplete: () => void')).toBe(true)
    expect(code.includes('minDurationMs?: number')).toBe(true)
  })

  it('f10-02: exit animation specifies opacity 0, scale 1.03, and blur(14px) transition', () => {
    expect(code.includes('blur(14px)')).toBe(true)
    expect(code.includes('scale: 1.03')).toBe(true)
    expect(code.includes('opacity: 0')).toBe(true)
  })

  it('f10-03: keyboard event listener catches Escape, Enter, and Space keys for skip', () => {
    expect(code.includes("e.key === 'Escape'")).toBe(true)
    expect(code.includes("e.key === 'Enter'")).toBe(true)
    expect(code.includes("e.key === ' '")).toBe(true)
  })

  it('f10-04: click handler on container enables quick skip to workspace', () => {
    expect(code.includes('onClick={handleFinish}')).toBe(true)
    expect(code.includes('Press any key or click to enter workspace')).toBe(true)
  })

  it('f10-05: App.tsx wraps LaunchScreen in AnimatePresence for clean unmount transition', () => {
    expect(appCode.includes('AnimatePresence')).toBe(true)
    expect(appCode.includes('LaunchScreen')).toBe(true)
    expect(appCode.includes('isLaunching')).toBe(true)
  })
})
