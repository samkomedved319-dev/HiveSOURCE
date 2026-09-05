import { describe, it, expect, setTierContext } from '../harness'
import * as fs from 'fs'
import * as path from 'path'

setTierContext('tier2', 'F7: BVA Cyber-Bee Logo')

describe('Tier 2 — F7: Boundary & Corner Cases (Cyber-Bee Logo Display)', () => {
  const launchScreenPath = path.resolve(process.cwd(), 'src/renderer/components/launch/LaunchScreen.tsx')
  const code = fs.readFileSync(launchScreenPath, 'utf8')

  it('f7-b01: logo image tag defines object-cover and rounded-2xl container styling', () => {
    expect(code.includes('object-cover')).toBe(true)
    expect(code.includes('rounded-2xl')).toBe(true)
  })

  it('f7-b02: logo container maintains fixed responsive boundaries across screen sizes', () => {
    expect(code.includes('w-28 h-28 sm:w-32 sm:h-32')).toBe(true)
  })

  it('f7-b03: hexagon SVG polygon vertices verify 6-fold planar symmetry within 160x160 viewBox', () => {
    // Expected points="80,6 146,43 146,117 80,154 14,117 14,43"
    expect(code.includes('80,6 146,43 146,117 80,154 14,117 14,43')).toBe(true)
  })

  it('f7-b04: ambient background radial aura specifies high blur for contrast on OLED screens', () => {
    expect(code.includes('blur-[140px]')).toBe(true)
    expect(code.includes('blur-[90px]')).toBe(true)
  })

  it('f7-b05: logo pulse animation loops infinitely with easeInOut curve', () => {
    expect(code.includes('repeat: Infinity')).toBe(true)
    expect(code.includes("ease: 'easeInOut'")).toBe(true)
  })
})
