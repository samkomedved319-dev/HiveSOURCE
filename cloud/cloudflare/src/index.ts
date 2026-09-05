export interface Env {
  HIVEBOX: DurableObjectNamespace
  HIVE_CLOUD_TOKEN?: string
}

type Job = { id: string; agent: string; status: string; startedAt: number; endedAt?: number; output?: string }

export class HiveBox {
  state: DurableObjectState
  files = new Map<string, string>()
  jobs: Job[] = []
  logs: string[] = []
  constructor(state: DurableObjectState) { this.state = state }
  async load() {
    const snap = await this.state.storage.get<{ files: [string, string][]; logs: string[] }>('snap')
    if (snap) { this.files = new Map(snap.files); this.logs = snap.logs || [] }
  }
  async save() {
    await this.state.storage.put('snap', { files: [...this.files.entries()].slice(-80), logs: this.logs.slice(-80) })
  }
  log(line: string) { this.logs.push(`${new Date().toISOString()} ${line}`) }
  exec(command: string) {
    if (command === 'ls' || command.startsWith('ls ')) return [...this.files.keys()].join('\n') || '(empty disk)'
    if (command.startsWith('cat ')) return this.files.get(command.slice(4).trim()) ?? 'not found'
    if (command.startsWith('echo ')) return command.slice(5)
    if (command === 'pwd') return '/hive'
    if (command === 'uname') return 'HiveBox Cloudflare Durable Object'
    return 'blocked: only ls cat echo pwd uname on Cloudflare. Use Colab for a real shell.'
  }
  async fetch(request: Request) {
    await this.load()
    const url = new URL(request.url)
    const path = url.pathname
    if (path.endsWith('/status') && request.method === 'GET') {
      return json({ ok: true, kind: 'cloudflare', files: [...this.files.keys()], jobs: this.jobs.slice(-12), logs: this.logs.slice(-20) })
    }
    if (path.endsWith('/fs') && request.method === 'GET') {
      const file = url.searchParams.get('path') || ''
      if (!file) return json({ ok: true, files: [...this.files.keys()] })
      return json({ ok: true, path: file, content: this.files.get(file) ?? null })
    }
    if (path.endsWith('/fs') && request.method === 'POST') {
      const body = await request.json<{ path?: string; content?: string }>()
      const file = String(body.path || '').replace(/^\/+/, '')
      if (!file || file.includes('..')) return json({ ok: false, error: 'bad path' }, 400)
      this.files.set(file, String(body.content || ''))
      this.log('write ' + file)
      await this.save()
      return json({ ok: true, path: file })
    }
    if (path.endsWith('/exec') && request.method === 'POST') {
      const body = await request.json<{ command?: string }>()
      const command = String(body.command || '').trim()
      const output = this.exec(command)
      this.log('exec ' + command)
      await this.save()
      return json({ ok: true, command, output })
    }
    if (path.endsWith('/swarm') && request.method === 'POST') {
      const body = await request.json<{ text?: string }>()
      const text = String(body.text || '').trim()
      const started = Date.now()
      const agents = ['Scout', 'Hive', 'Pulse']
      const results = await Promise.all(agents.map(async (agent, i) => {
        const t0 = Date.now()
        await new Promise((r) => setTimeout(r, 8 + i))
        return { agent, offsetMs: Date.now() - t0, output: `${agent}[+${Date.now() - t0}ms] ${text.slice(0, 80)}` }
      }))
      this.jobs.push(...results.map((r) => ({ id: r.agent + started, agent: r.agent, status: 'done', startedAt: started, output: r.output })))
      this.log('swarm')
      await this.save()
      return json({ ok: true, concurrent: true, startedAt: started, results })
    }
    return json({ ok: false, error: 'not found' }, 404)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } })
}

export default {
  async fetch(request: Request, env: Env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    }
    const token = env.HIVE_CLOUD_TOKEN
    if (token) {
      const got = request.headers.get('authorization') || ''
      if (got !== `Bearer ${token}`) return json({ ok: false, error: 'unauthorized' }, 401)
    }
    const url = new URL(request.url)
    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ ok: true, service: 'hive-cloud-computer', provider: 'cloudflare' })
    }
    const id = env.HIVEBOX.idFromName(url.searchParams.get('box') || 'default')
    return env.HIVEBOX.get(id).fetch(request)
  },
}
