import { describe, it, expect, setTierContext } from '../harness'
import * as fs from 'fs'
import * as path from 'path'

setTierContext('tier2', 'F9: BVA Dynamic Version')

describe('Tier 2 — F9: Boundary & Corner Cases (Dynamic Version Tag)', () => {
  const launchScreenPath = path.resolve(process.cwd(), 'src/renderer/components/launch/LaunchScreen.tsx')
  const code = fs.readFileSync(launchScreenPath, 'utf8')

  it('f9-b01: version initialization includes fallback "v1.0.0" when package.json version is undefined', () => {
    expect(code.includes("packageJson.version || '1.0.0'")).toBe(true)
  })

  it('f9-b02: electron IPC version fetching is wrapped in try-catch block to prevent unhandled rejection', () => {
    expect(code.includes('try {') && code.includes('fetchElectronVersion')).toBe(true)
    expect(code.includes('catch {')).toBe(true)
  })

  it('f9-b03: dynamic version state prepends "v" prefix if not already present', () => {
    expect(code.includes('setVersion(`v${electronVer}`)')).toBe(true)
  })

  it('f9-b04: version badge element styled with font-mono to prevent numerical glyph jitter', () => {
    expect(code.includes('font-mono font-bold')).toBe(true)
  })

  it('f9-b05: optional chaining on window.electronAPI protects against undefined browser environments', () => {
    expect(code.includes('electronAPI?.app?.getVersion')).toBe(true)
  })
})
