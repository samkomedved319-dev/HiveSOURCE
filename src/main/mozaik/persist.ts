import fs from 'fs'
import path from 'path'
import type { HiveTranscriptItem } from './runtime'
import type { SearchCitation } from '../search-service'

export type RoomSnap = {
  transcript: HiveTranscriptItem[]
  citations: SearchCitation[]
}

const rooms = new Map<string, RoomSnap>()
let filePath: string | null = null

function resolveFile() {
  if (filePath) return filePath
  try {
    const { app } = require('electron') as typeof import('electron')
    filePath = path.join(app.getPath('userData'), 'hive-swarm-rooms.json')
  } catch {
    filePath = path.join(process.cwd(), '.hive-swarm-rooms.json')
  }
  return filePath
}

export function loadRooms() {
  try {
    const raw = fs.readFileSync(resolveFile(), 'utf8')
    const data = JSON.parse(raw) as Record<string, RoomSnap>
    for (const [k, v] of Object.entries(data || {})) rooms.set(k, v)
  } catch {}
}

export function saveRooms() {
  try {
    const obj: Record<string, RoomSnap> = {}
    for (const [k, v] of rooms) obj[k] = { transcript: v.transcript.slice(-80), citations: v.citations }
    fs.writeFileSync(resolveFile(), JSON.stringify(obj))
  } catch {}
}

export function stashRoom(id: string, snap: RoomSnap) {
  rooms.set(id, { transcript: snap.transcript.slice(-80), citations: snap.citations })
  saveRooms()
}

export function loadRoom(id: string): RoomSnap {
  return rooms.get(id) || { transcript: [], citations: [] }
}
