/**
 * ProjectHive E2E Test Harness & Assertion Engine
 * Comprehensive zero-dependency test runner supporting Tiers 1-4.
 */

export interface TestResult {
  id: string
  tier: 'tier1' | 'tier2' | 'tier3' | 'tier4'
  feature: string
  name: string
  status: 'passed' | 'failed' | 'skipped'
  durationMs: number
  error?: Error
}

export interface TestSuite {
  name: string
  tier: 'tier1' | 'tier2' | 'tier3' | 'tier4'
  feature: string
  tests: TestCase[]
}

export interface TestCase {
  name: string
  fn: () => Promise<void> | void
  timeoutMs?: number
}

class TestRegistry {
  private currentTier: 'tier1' | 'tier2' | 'tier3' | 'tier4' = 'tier1'
  private currentFeature = 'General'
  private currentSuiteName = ''
  private suites: TestSuite[] = []
  private results: TestResult[] = []

  setContext(tier: 'tier1' | 'tier2' | 'tier3' | 'tier4', feature: string) {
    this.currentTier = tier
    this.currentFeature = feature
  }

  describe(name: string, fn: () => void) {
    const prevSuite = this.currentSuiteName
    this.currentSuiteName = name
    let suite = this.suites.find(
      (s) => s.name === name && s.tier === this.currentTier && s.feature === this.currentFeature
    )
    if (!suite) {
      suite = {
        name,
        tier: this.currentTier,
        feature: this.currentFeature,
        tests: [],
      }
      this.suites.push(suite)
    }

    try {
      fn()
    } finally {
      this.currentSuiteName = prevSuite
    }
  }

  it(name: string, fn: () => Promise<void> | void, timeoutMs = 8000) {
    let suite = this.suites.find(
      (s) => s.name === this.currentSuiteName && s.tier === this.currentTier && s.feature === this.currentFeature
    )
    if (!suite) {
      suite = {
        name: this.currentSuiteName || `${this.currentFeature} Suite`,
        tier: this.currentTier,
        feature: this.currentFeature,
        tests: [],
      }
      this.suites.push(suite)
    }

    suite.tests.push({ name, fn, timeoutMs })
  }

  getSuites(): TestSuite[] {
    return this.suites
  }

  clear() {
    this.suites = []
    this.results = []
  }

  async runAll(): Promise<{
    passed: number
    failed: number
    skipped: number
    total: number
    results: TestResult[]
    durationMs: number
  }> {
    const startTime = Date.now()
    this.results = []

    for (const suite of this.suites) {
      for (const test of suite.tests) {
        const testId = `${suite.tier}::${suite.feature}::${test.name}`
        const testStart = Date.now()

        try {
          // Timeout race
          const timeoutPromise = new Promise((_, reject) => {
            const timer = setTimeout(() => {
              reject(new Error(`Test timed out after ${test.timeoutMs || 8000}ms`))
            }, test.timeoutMs || 8000)
            if (typeof timer.unref === 'function') timer.unref()
          })

          await Promise.race([Promise.resolve(test.fn()), timeoutPromise])

          this.results.push({
            id: testId,
            tier: suite.tier,
            feature: suite.feature,
            name: test.name,
            status: 'passed',
            durationMs: Date.now() - testStart,
          })
        } catch (err: any) {
          this.results.push({
            id: testId,
            tier: suite.tier,
            feature: suite.feature,
            name: test.name,
            status: 'failed',
            durationMs: Date.now() - testStart,
            error: err instanceof Error ? err : new Error(String(err)),
          })
        }
      }
    }

    const passed = this.results.filter((r) => r.status === 'passed').length
    const failed = this.results.filter((r) => r.status === 'failed').length
    const skipped = this.results.filter((r) => r.status === 'skipped').length
    const total = this.results.length

    return {
      passed,
      failed,
      skipped,
      total,
      results: this.results,
      durationMs: Date.now() - startTime,
    }
  }
}

export const registry = new TestRegistry()

export function setTierContext(tier: 'tier1' | 'tier2' | 'tier3' | 'tier4', feature: string) {
  registry.setContext(tier, feature)
}

export function describe(name: string, fn: () => void) {
  registry.describe(name, fn)
}

export function it(name: string, fn: () => Promise<void> | void, timeoutMs?: number) {
  registry.it(name, fn, timeoutMs)
}

export const test = it

// Assertion Matchers
class Assertion<T> {
  constructor(private actual: T, private isNot = false) {}

  get not(): Assertion<T> {
    return new Assertion(this.actual, !this.isNot)
  }

  toBe(expected: any) {
    const pass = Object.is(this.actual, expected)
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not to be' : 'to be'} ${JSON.stringify(expected)}`)
    }
  }

  toEqual(expected: any) {
    const actualStr = JSON.stringify(this.actual)
    const expectedStr = JSON.stringify(expected)
    const pass = actualStr === expectedStr
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected equality:\nExpected: ${expectedStr}\nReceived: ${actualStr}`)
    }
  }

  toBeDefined() {
    const pass = this.actual !== undefined
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected value ${this.isNot ? 'to be undefined' : 'to be defined'}, got: ${this.actual}`)
    }
  }

  toBeUndefined() {
    const pass = this.actual === undefined
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected value ${this.isNot ? 'not to be undefined' : 'to be undefined'}, got: ${this.actual}`)
    }
  }

  toBeNull() {
    const pass = this.actual === null
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected value ${this.isNot ? 'not to be null' : 'to be null'}, got: ${this.actual}`)
    }
  }

  toBeTruthy() {
    const pass = Boolean(this.actual)
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not to be truthy' : 'to be truthy'}`)
    }
  }

  toBeFalsy() {
    const pass = !this.actual
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not to be falsy' : 'to be falsy'}`)
    }
  }

  toBeGreaterThan(n: number) {
    const pass = (this.actual as unknown as number) > n
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not to be >' : 'to be >'} ${n}`)
    }
  }

  toBeGreaterThanOrEqual(n: number) {
    const pass = (this.actual as unknown as number) >= n
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not to be >=' : 'to be >='} ${n}`)
    }
  }

  toBeLessThan(n: number) {
    const pass = (this.actual as unknown as number) < n
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not to be <' : 'to be <'} ${n}`)
    }
  }

  toBeLessThanOrEqual(n: number) {
    const pass = (this.actual as unknown as number) <= n
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not to be <=' : 'to be <='} ${n}`)
    }
  }

  toContain(item: any) {
    let pass = false
    if (typeof this.actual === 'string') {
      pass = this.actual.includes(String(item))
    } else if (Array.isArray(this.actual)) {
      pass = this.actual.includes(item)
    } else if (this.actual && typeof this.actual === 'object') {
      pass = item in this.actual
    }
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected collection ${this.isNot ? 'not to contain' : 'to contain'} ${JSON.stringify(item)}`)
    }
  }

  toMatch(pattern: RegExp | string) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    const pass = regex.test(String(this.actual))
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected "${this.actual}" ${this.isNot ? 'not to match' : 'to match'} regex ${regex}`)
    }
  }

  toThrow(expectedError?: string | RegExp) {
    if (typeof this.actual !== 'function') {
      throw new Error(`expect(fn).toThrow requires a function, received ${typeof this.actual}`)
    }
    let threw = false
    let thrownError: any = null
    try {
      ;(this.actual as Function)()
    } catch (err) {
      threw = true
      thrownError = err
    }

    if (this.isNot) {
      if (threw) {
        throw new Error(`Expected function not to throw, but it threw: ${thrownError?.message || thrownError}`)
      }
    } else {
      if (!threw) {
        throw new Error(`Expected function to throw an error, but it returned cleanly`)
      }
      if (expectedError) {
        const msg = thrownError?.message || String(thrownError)
        if (typeof expectedError === 'string') {
          if (!msg.includes(expectedError)) {
            throw new Error(`Expected error message to contain "${expectedError}", but got "${msg}"`)
          }
        } else if (!expectedError.test(msg)) {
          throw new Error(`Expected error message to match ${expectedError}, but got "${msg}"`)
        }
      }
    }
  }
}

export function expect<T>(actual: T): Assertion<T> {
  return new Assertion(actual)
}
