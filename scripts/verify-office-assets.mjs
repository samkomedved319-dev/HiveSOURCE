import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist', 'renderer')
const agents = path.join(dist, 'agents.json')
const logos = path.join(dist, 'logos')

function fail(msg) {
  console.error('[verify-office-assets]', msg)
  process.exit(1)
}

if (!fs.existsSync(agents)) fail('missing dist/renderer/agents.json — Vite publicDir did not copy HQ roster')
const data = JSON.parse(fs.readFileSync(agents, 'utf8'))
const ids = (data.agents || []).map((a) => a.id)
const need = ['lib-apollo','lib-athena','lib-hermes','lib-hephaestus','lib-iris','lib-mnemosyne']
const missing = need.filter((id) => !ids.includes(id))
if (missing.length) fail('agents.json missing PREMADE ids: ' + missing.join(','))
if (!fs.existsSync(logos)) fail('missing dist/renderer/logos')
console.log('[verify-office-assets] OK', ids.join(','))
