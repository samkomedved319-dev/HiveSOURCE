import { describe, it, expect, setTierContext } from '../harness'
import * as fs from 'fs'
import * as path from 'path'

setTierContext('tier1', 'F7: Glowing Cyber-Bee Logo')

describe('Tier 1 — F7: Glowing Cyber-Bee Logo Display', () => {
  const logoPath = path.resolve(process.cwd(), 'src/renderer/assets/hive_logo.jpg')
  const launchScreenPath = path.resolve(process.cwd(), 'src/renderer/components/launch/LaunchScreen.tsx')

  it('f7-01: hive_logo.jpg asset exists at verified path with size > 100 KB', () => {
    expect(fs.existsSync(logoPath)).toBe(true)
    const stats = fs.statSync(logoPath)
    expect(stats.size).toBeGreaterThan(100 * 1024)
  })

  it('f7-02: hive_logo.jpg has valid JPEG binary signature (FF D8 FF)', () => {
    const buffer = fs.readFileSync(logoPath)
    expect(buffer[0]).toBe(0xff)
    expect(buffer[1]).toBe(0xd8)
    expect(buffer[2]).toBe(0xff)
  })

  it('f7-03: LaunchScreen imports hive_logo.jpg via standard Vite asset URL resolution', () => {
    expect(fs.existsSync(launchScreenPath)).toBe(true)
    const content = fs.readFileSync(launchScreenPath, 'utf8')
    expect(content.includes('hive_logo.jpg')).toBe(true)
  })

  it('f7-04: LaunchScreen contains rotating outer hexagon SVG circuit rings around logo', () => {
    const content = fs.readFileSync(launchScreenPath, 'utf8')
    expect(content.includes('polygon')).toBe(true)
    expect(content.includes('rotate: 360')).toBe(true)
    expect(content.includes('rotate: -360')).toBe(true)
  })

  it('f7-05: logo image element specifies ProjectHive cyber-bee accessible alt text', () => {
    const content = fs.readFileSync(launchScreenPath, 'utf8')
    expect(content.includes('alt="ProjectHive Cyber-Bee Logo"')).toBe(true)
  })
})
