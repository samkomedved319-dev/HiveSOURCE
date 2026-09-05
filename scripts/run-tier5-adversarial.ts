/**
 * Tier 5 Adversarial Test Runner
 * Executable via: npx tsx scripts/run-tier5-adversarial.ts
 */

import { setupDOMEnvironment } from '../tests/mocks/dom-env'

setupDOMEnvironment()

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('🐝  PROJECT HIVE — TIER 5 ADVERSARIAL STRESS TEST RUNNER  🐝')
  console.log('='.repeat(70))

  const { registry } = await import('../tests/harness')
  registry.clear()

  await import('../tests/tier5-adversarial/tier5-launch-screen-adversarial.test')

  const results = await registry.runAll()

  console.log(`\nExecuted ${results.total} Tier 5 Adversarial Stress Tests in ${results.durationMs}ms:`)
  for (const r of results.results) {
    if (r.status === 'passed') {
      console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${r.feature} → \x1b[1m${r.name}\x1b[0m (${r.durationMs}ms)`)
    } else {
      console.log(`  \x1b[31m✖ [FAIL]\x1b[0m ${r.feature} → \x1b[1m${r.name}\x1b[0m (${r.durationMs}ms)`)
      if (r.error) console.log(`    Error: ${r.error.message}`)
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log(`Passed: ${results.passed} | Failed: ${results.failed} | Skipped: ${results.skipped}`)
  console.log('='.repeat(70) + '\n')

  if (results.failed > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal Tier 5 Runner Error:', err)
  process.exit(1)
})
