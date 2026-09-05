/**
 * Master E2E Test Suite Runner for ProjectHive
 * Executable via: npx tsx scripts/run-e2e-tests.ts
 */

import { setupDOMEnvironment } from '../tests/mocks/dom-env'

// 1. Initialize DOM & Browser Mock Environment before importing components
setupDOMEnvironment()

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('🐝  PROJECT HIVE — E2E TEST SUITE RUNNER  🐝')
  console.log('='.repeat(70))
  console.log(`Node.js: ${process.version} | Architecture: ${process.arch} | Platform: ${process.platform}`)
  console.log('Loading test suites across Tiers 1-4...\n')

  const importStart = Date.now()

  // Import test harness
  const { registry } = await import('../tests/harness')

  // Tier 1: Feature Coverage (10 files, 5 tests each = 50 tests)
  await import('../tests/tier1-features/f1-web-search.test')
  await import('../tests/tier1-features/f2-citations.test')
  await import('../tests/tier1-features/f3-mascot-search.test')
  await import('../tests/tier1-features/f4-grok-personality.test')
  await import('../tests/tier1-features/f5-mascot-docked.test')
  await import('../tests/tier1-features/f6-physics-speech.test')
  await import('../tests/tier1-features/f7-logo-display.test')
  await import('../tests/tier1-features/f8-terminal-text.test')
  await import('../tests/tier1-features/f9-dynamic-version.test')
  await import('../tests/tier1-features/f10-reveal-transition.test')

  // Tier 2: Boundary & Corner Cases (10 files, 5 tests each = 50 tests)
  await import('../tests/tier2-boundaries/f1-bva-search.test')
  await import('../tests/tier2-boundaries/f2-bva-citations.test')
  await import('../tests/tier2-boundaries/f3-bva-mascot-search.test')
  await import('../tests/tier2-boundaries/f4-bva-grok.test')
  await import('../tests/tier2-boundaries/f5-bva-mascot-docked.test')
  await import('../tests/tier2-boundaries/f6-bva-physics.test')
  await import('../tests/tier2-boundaries/f7-bva-logo.test')
  await import('../tests/tier2-boundaries/f8-bva-terminal.test')
  await import('../tests/tier2-boundaries/f9-bva-version.test')
  await import('../tests/tier2-boundaries/f10-bva-transition.test')

  // Tier 3: Pairwise Interactions (1 file, 10 tests = 10 tests)
  await import('../tests/tier3-pairwise/pairwise-interactions.test')

  // Tier 4: Real-World Scenarios (1 file, 6 tests = 6 tests)
  await import('../tests/tier4-scenarios/real-world-scenarios.test')

  console.log(`Loaded all test specifications in ${Date.now() - importStart}ms.\n`)
  console.log('Executing test harness...\n')

  const results = await registry.runAll()

  // Group and display results by tier
  const tiers: Array<{ key: 'tier1' | 'tier2' | 'tier3' | 'tier4'; label: string }> = [
    { key: 'tier1', label: 'TIER 1: FEATURE COVERAGE (CONTRACTS & DATA STRUCTURES)' },
    { key: 'tier2', label: 'TIER 2: BOUNDARY VALUE & CORNER CASE COVERAGE' },
    { key: 'tier3', label: 'TIER 3: PAIRWISE CROSS-FEATURE INTERACTION TESTS' },
    { key: 'tier4', label: 'TIER 4: REAL-WORLD END-TO-END APPLICATION SCENARIOS' },
  ]

  for (const tier of tiers) {
    const tierResults = results.results.filter((r) => r.tier === tier.key)
    if (tierResults.length === 0) continue

    const tierPassed = tierResults.filter((r) => r.status === 'passed').length
    const tierFailed = tierResults.filter((r) => r.status === 'failed').length

    console.log(`\x1b[1m\x1b[36m${'―'.repeat(70)}\x1b[0m`)
    console.log(`\x1b[1m\x1b[36m▶ ${tier.label} [${tierPassed}/${tierResults.length} PASS]\x1b[0m`)
    console.log(`\x1b[1m\x1b[36m${'―'.repeat(70)}\x1b[0m`)

    for (const r of tierResults) {
      if (r.status === 'passed') {
        console.log(`  \x1b[32m✔\x1b[0m \x1b[90m[PASS]\x1b[0m ${r.feature} → \x1b[1m${r.name}\x1b[0m \x1b[90m(${r.durationMs}ms)\x1b[0m`)
      } else {
        console.log(`  \x1b[31m✖\x1b[0m \x1b[31m[FAIL]\x1b[0m ${r.feature} → \x1b[1m${r.name}\x1b[0m \x1b[90m(${r.durationMs}ms)\x1b[0m`)
        if (r.error) {
          console.log(`    \x1b[31mError: ${r.error.message}\x1b[0m`)
          if (r.error.stack) {
            const stackLines = r.error.stack.split('\n').slice(1, 4).join('\n')
            console.log(`    \x1b[90m${stackLines}\x1b[0m`)
          }
        }
      }
    }
    console.log('')
  }

  if (results.failed > 0) {
    console.log('\x1b[31mFAILURES DETAIL LIST:\x1b[0m')
    for (const r of results.results) {
      if (r.status === 'failed') {
        console.log(`\x1b[31m✖ [${r.tier}] ${r.feature} → ${r.name}\x1b[0m\n  Error: ${r.error?.message}`)
      }
    }
    console.log('')
  }

  // Summary Report
  console.log('='.repeat(70))
  console.log('📊  TEST EXECUTION SUMMARY REPORT')
  console.log('='.repeat(70))
  console.log(`Total Test Cases Executed : ${results.total}`)
  console.log(`Passed Test Cases         : \x1b[32m${results.passed}\x1b[0m`)
  console.log(`Failed Test Cases         : ${results.failed > 0 ? `\x1b[31m${results.failed}\x1b[0m` : `\x1b[32m0\x1b[0m`}`)
  console.log(`Skipped Test Cases        : ${results.skipped}`)
  console.log(`Total Execution Time      : ${results.durationMs}ms`)
  console.log(`Overall Pass Rate         : ${((results.passed / results.total) * 100).toFixed(1)}%`)
  console.log('='.repeat(70))

  if (results.total < 116) {
    console.error(`\x1b[31m❌ FAILURE: Total test count (${results.total}) is below required minimum (116).\x1b[0m`)
    process.exit(1)
  }

  if (results.failed > 0) {
    console.error(`\x1b[31m❌ FAILURE: ${results.failed} test(s) failed.\x1b[0m`)
    process.exit(1)
  }

  console.log('\x1b[32m✨ SUCCESS: All 116+ E2E tests passed cleanly with 100% assertion success!\x1b[0m\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('\x1b[31mFATAL TEST RUNNER ERROR:\x1b[0m', err)
  process.exit(1)
})
