import { describe, it, expect, setTierContext } from '../harness'
import * as fs from 'fs'
import * as path from 'path'

setTierContext('tier1', 'F9: Dynamic Version Tag')

describe('Tier 1 — F9: Dynamic Version Tag Display', () => {
  const pkgPath = path.resolve(process.cwd(), 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const launchScreenPath = path.resolve(process.cwd(), 'src/renderer/components/launch/LaunchScreen.tsx')
  const code = fs.readFileSync(launchScreenPath, 'utf8')

  it('f9-01: package.json specifies a valid semver version string', () => {
    expect(typeof pkg.version).toBe('string')
    expect(/^\d+\.\d+\.\d+/.test(pkg.version)).toBe(true)
    expect(pkg.version).toBe('0.0.1')
  })

  it('f9-02: LaunchScreen imports package.json for dynamic version resolution', () => {
    expect(code.includes('packageJson')).toBe(true)
    expect(code.includes('package.json')).toBe(true)
  })

  it('f9-03: LaunchScreen renders accessible data-testid="launch-version-badge"', () => {
    expect(code.includes('data-testid="launch-version-badge"')).toBe(true)
  })

  it('f9-04: LaunchScreen attempts to query electronAPI.app.getVersion for desktop runtime version', () => {
    expect(code.includes('electronAPI') && code.includes('getVersion')).toBe(true)
  })

  it('f9-05: version badge contains animated pulsing indicator dot', () => {
    expect(code.includes('animate-ping')).toBe(true)
    expect(code.includes('rounded-full')).toBe(true)
  })
})
