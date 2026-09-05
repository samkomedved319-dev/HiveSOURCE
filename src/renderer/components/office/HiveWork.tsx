import React, { useEffect, useState } from 'react'

export default function HiveWork() {
  const [root, setRoot] = useState('')
  const [pathInput, setPathInput] = useState('')
  const [files, setFiles] = useState<{ name: string; dir: boolean }[]>([])
  const [task, setTask] = useState('')
  const [log, setLog] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const refresh = async (folder?: string) => {
    const st = folder
      ? await window.electronAPI?.workspace?.set?.(folder)
      : await window.electronAPI?.workspace?.status?.()
    if (st?.ok && st.root) {
      setRoot(st.root)
      const list = await window.electronAPI?.workspace?.list?.('.')
      setFiles(list?.entries || [])
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const pick = async () => {
    const res = await window.electronAPI?.workspace?.pick?.()
    if (res?.ok && res.root) {
      setRoot(res.root)
      const list = await window.electronAPI?.workspace?.list?.('.')
      setFiles(list?.entries || [])
    }
  }

  const attachPath = async () => {
    if (!pathInput.trim()) return
    await refresh(pathInput.trim())
  }

  const runTask = async () => {
    const t = task.trim()
    if (!t || !root) return
    setBusy(true)
    setLog((p) => [`You: ${t}`, ...p])
    setTask('')
    const listing = files.map((f) => (f.dir ? `/${f.name}` : f.name)).join(', ')
    const res = await window.electronAPI?.ai?.chat?.(
      [
        {
          role: 'system',
          content: `You are Hive coding crew on the user's PC. Project root: ${root}\nTop files: ${listing}\nIf you need to edit, reply with a block:\n\`\`\`write path/relative.ext\nfile contents\n\`\`\`\nAsk permission in one short line first. Do not invent paths outside the project.`,
        },
        { role: 'user', content: t },
      ],
      undefined,
      { webSearch: false }
    )
    const text = res?.ok ? res.content || '' : res?.error || 'Task failed'
    setLog((p) => [`Hive: ${text.slice(0, 1200)}`, ...p])
    const write = text.match(/```write\s+([^\n]+)\n([\s\S]*?)```/)
    if (write) {
      const rel = write[1].trim()
      const body = write[2]
      setLog((p) => [`Asking to write ${rel}…`, ...p])
      const w = await window.electronAPI?.workspace?.write?.(rel, body)
      setLog((p) => [w?.ok ? `Wrote ${rel}` : `Write blocked: ${w?.error}`, ...p])
    }
    setBusy(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, padding: 12, gap: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.45 }}>
        Attach a folder. Hive asks before any write — like Cursor / Copilot.
      </div>
      <button type="button" onClick={() => void pick()} style={btn()}>
        Choose project folder
      </button>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={pathInput}
          onChange={(e) => setPathInput(e.target.value)}
          placeholder="Or paste a path… C:\\Users\\…\\project"
          style={inp()}
        />
        <button type="button" onClick={() => void attachPath()} style={btn()}>
          Set
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--accent)', wordBreak: 'break-all' }}>{root || 'No folder yet'}</div>
      <div style={{ flex: '0 0 120px', overflow: 'auto', border: '1px solid var(--border-soft)', borderRadius: 8, padding: 8, fontSize: 11.5, color: 'var(--text-dim)' }}>
        {files.length === 0 && 'Files appear after you attach a folder.'}
        {files.map((f) => (
          <div key={f.name}>{f.dir ? '📁' : '📄'} {f.name}</div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: 8, fontSize: 12 }}>
        {log.map((l, i) => (
          <div key={i} style={{ whiteSpace: 'pre-wrap', color: l.startsWith('You') ? 'var(--text)' : 'var(--text-dim)' }}>
            {l}
          </div>
        ))}
      </div>
      <textarea
        value={task}
        onChange={(e) => setTask(e.target.value)}
        placeholder={root ? 'Task: fix the login bug…' : 'Attach a folder first'}
        disabled={!root || busy}
        style={{ ...inp(), minHeight: 64, resize: 'none' }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void runTask()
          }
        }}
      />
    </div>
  )
}

function btn(): React.CSSProperties {
  return {
    background: 'var(--accent)',
    color: 'var(--accent-fg)',
    border: 'none',
    borderRadius: 8,
    padding: '7px 10px',
    cursor: 'pointer',
    fontWeight: 650,
    fontFamily: 'inherit',
    fontSize: 12,
  }
}
function inp(): React.CSSProperties {
  return {
    flex: 1,
    background: 'var(--panel-2)',
    border: '1px solid var(--border-soft)',
    color: 'var(--text)',
    borderRadius: 8,
    padding: '7px 8px',
    fontFamily: 'inherit',
    fontSize: 12,
  }
}
