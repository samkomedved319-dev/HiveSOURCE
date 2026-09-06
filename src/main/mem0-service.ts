import fs from 'fs'
import path from 'path'
import { app, ipcMain } from 'electron'
import { mem0Key } from './keys'

type LocalMem = { id: string; memory: string; at: number; userId: string }

function localPath() {
  try {
    return path.join(app.getPath('userData'), 'hive-memory.json')
  } catch {
    return path.join(process.cwd(), 'hive-memory.json')
  }
}

function loadLocal(): LocalMem[] {
  try {
    return JSON.parse(fs.readFileSync(localPath(), 'utf8'))
  } catch {
    return []
  }
}

function saveLocal(items: LocalMem[]) {
  try {
    fs.writeFileSync(localPath(), JSON.stringify(items.slice(-400), null, 0))
  } catch {}
}

async function mem0Add(messages: { role: string; content: string }[], userId: string) {
  const key = mem0Key()
  if (!key) {
    const items = loadLocal()
    const text = messages.map((m) => m.content).join(' ').slice(0, 500)
    if (text.trim()) items.push({ id: `m-${Date.now()}`, memory: text.trim(), at: Date.now(), userId })
    saveLocal(items)
    return { ok: true, local: true }
  }
  const res = await fetch('https://api.mem0.ai/v1/memories/', {
    method: 'POST',
    headers: {
      Authorization: `Token ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ messages, user_id: userId, agent_id: 'hive', app_id: 'hive-desktop' }),
  })
  if (!res.ok) return { ok: false, error: await res.text() }
  return { ok: true, data: await res.json().catch(() => null) }
}

async function mem0Search(query: string, userId: string) {
  const key = mem0Key()
  const q = String(query || '').trim()
  if (q.length < 12) return { ok: true, memories: [] as string[] }
  if (!key) {
    const tokens = q.toLowerCase().split(/\s+/).filter((w) => w.length >= 4)
    if (tokens.length < 2) return { ok: true, memories: [] as string[], local: true }
    const hits = loadLocal()
      .filter((m) => {
        if (m.userId !== userId) return false
        const mem = m.memory.toLowerCase()
        const hitsN = tokens.filter((w) => mem.includes(w)).length
        return hitsN >= 2
      })
      .slice(-3)
      .map((m) => m.memory)
    return { ok: true, memories: hits, local: true }
  }
  const res = await fetch('https://api.mem0.ai/v2/memories/search/', {
    method: 'POST',
    headers: {
      Authorization: `Token ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, user_id: userId, limit: 8 }),
  })
  if (!res.ok) {
    const res3 = await fetch('https://api.mem0.ai/v3/memories/search/', {
      method: 'POST',
      headers: {
        Authorization: `Token ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, filters: { user_id: userId }, top_k: 8 }),
    })
    if (!res3.ok) return { ok: false, memories: [] as string[], error: await res3.text() }
    const data = (await res3.json()) as { results?: { memory?: string }[] }
    return { ok: true, memories: (data.results || []).map((r) => r.memory || '').filter(Boolean) }
  }
  const data = (await res.json()) as { results?: { memory?: string }[] } | { memory?: string }[]
  const list = Array.isArray(data) ? data : data.results || []
  return { ok: true, memories: list.map((r) => (r as { memory?: string }).memory || '').filter(Boolean) }
}

export async function recallForPrompt(query: string, userId = 'hive-user') {
  if (String(query || '').trim().length < 12) return ''
  const found = await mem0Search(query, userId)
  if (!found.ok || !found.memories.length) return ''
  return found.memories.slice(0, 2).map((m, i) => `${i + 1}. ${m}`).join('\n')
}

export async function rememberTurn(userText: string, assistantText: string, userId = 'hive-user') {
  if (String(userText || '').trim().length < 12) return { ok: true }
  return mem0Add(
    [
      { role: 'user', content: userText.slice(0, 2000) },
      { role: 'assistant', content: assistantText.slice(0, 2000) },
    ],
    userId
  )
}

export function registerMem0Handlers() {
  ipcMain.handle('mem0:search', (_e, query: string) => mem0Search(String(query || ''), 'hive-user'))
  ipcMain.handle('mem0:add', (_e, messages: { role: string; content: string }[]) => mem0Add(messages || [], 'hive-user'))
  ipcMain.handle('mem0:status', () => ({ ok: true, cloud: Boolean(mem0Key()), local: true }))
}
