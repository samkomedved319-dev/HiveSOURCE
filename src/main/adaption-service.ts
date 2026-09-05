const ADAPTION_API = 'https://api.prod.adaptionlabs.ai/api/v1'
export const ADAPTION_APP = 'https://adaptionlabs.ai/app/datasets'
export const MOZAIK_CLOUD_DOCS = 'https://mozaik.jigjoy.ai'
import { mozaikCloudBase, mozaikCloudKey } from './keys'

function adaptionKey() {
  return process.env.ADAPTION_API_KEY || ''
}

async function adaptionGet(path: string) {
  const key = adaptionKey()
  if (!key) {
    return { ok: false, error: 'Set ADAPTION_API_KEY. Create a key at https://adaptionlabs.ai/app/datasets' }
  }
  const res = await fetch(`${ADAPTION_API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  const text = await res.text()
  let data: unknown = text
  try {
    data = JSON.parse(text)
  } catch {}
  if (!res.ok) return { ok: false, error: `Adaption ${res.status}`, data }
  return { ok: true, data }
}

export async function listAdaptionDatasets(query?: string) {
  const q = query ? `?q=${encodeURIComponent(query)}&limit=20` : '?limit=20'
  return adaptionGet(`/datasets${q}`)
}

export async function getAdaptionDataset(id: string) {
  if (!id) return { ok: false, error: 'dataset_id required' }
  return adaptionGet(`/datasets/${encodeURIComponent(id)}`)
}

export async function previewAdaptionDataset(id: string) {
  if (!id) return { ok: false, error: 'dataset_id required' }
  const key = adaptionKey()
  if (!key) return { ok: false, error: 'Set ADAPTION_API_KEY' }
  const res = await fetch(
    `${ADAPTION_API}/datasets/${encodeURIComponent(id)}/download?fileFormat=jsonl`,
    { headers: { Authorization: `Bearer ${key}` } }
  )
  if (!res.ok) return { ok: false, error: `Adaption download ${res.status}` }
  const text = await res.text()
  const lines = text.split('\n').filter(Boolean).slice(0, 8)
  return { ok: true, preview: lines, rows: lines.length }
}

export function mozaikCloudStatus() {
  const keyed = Boolean(mozaikCloudKey())
  const base = mozaikCloudBase() || MOZAIK_CLOUD_DOCS
  return {
    ok: true,
    managed: keyed,
    base,
    dashboard: 'https://app.jigjoy.ai/',
    docs: MOZAIK_CLOUD_DOCS,
    mem0: 'https://mozaik.jigjoy.ai/mem0',
    note: keyed
      ? 'Mozaik Cloud is connected. Hive inference can use MOZAIK_CLOUD_BASE_URL.'
      : 'Local Mozaik runtime is on. Optional: set Mozaik Cloud URL + key in Settings → Models, and Mem0 for long-term memory.',
  }
}
