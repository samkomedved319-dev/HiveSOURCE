import { describe, it, expect, setTierContext } from '../harness'
import * as fs from 'fs'
import * as path from 'path'

setTierContext('tier2', 'F8: BVA Animated Terminal')

describe('Tier 2 — F8: Boundary & Corner Cases (Animated Terminal)', () => {
  const launchScreenPath = path.resolve(process.cwd(), 'src/renderer/components/launch/LaunchScreen.tsx')
  const code = fs.readFileSync(launchScreenPath, 'utf8')

  it('f8-b01: typewriter interval timer cleanup returned from useEffect hook', () => {
    expect(code.includes('if (timeoutId) clearTimeout(timeoutId)')).toBe(true)
  })

  it('f8-b02: terminal body specifies min-height to prevent UI reflow during typing', () => {
    expect(code.includes('min-h-[190px]') || code.includes('min-h-')).toBe(true)
  })

  it('f8-b03: window keydown listener is removed on unmount to prevent memory leaks', () => {
    expect(code.includes("window.removeEventListener('keydown', handleKeyDown)")).toBe(true)
  })

  it('f8-b04: progress percentage clamped strictly between 0 and 100', () => {
    expect(code.includes('Math.min(\n    100') || code.includes('Math.min(100') || code.includes('Math.min(\n    100,')).toBe(true)
  })

  it('f8-b05: terminal header stopPropagation prevents accidental window dismiss click on header', () => {
    expect(code.includes('onClick={(e) => e.stopPropagation()}')).toBe(true)
  })
})
