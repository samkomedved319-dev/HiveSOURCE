import React, { useState } from 'react'

interface ProjectsModalProps {
  onClose: () => void
  onSelectProject?: (name: string) => void
  embedded?: boolean
}

interface ProjectItem {
  id: string
  name: string
  description: string
  notes?: string
  path?: string
  updatedAt: string
}

export default function ProjectsModal({ onClose, onSelectProject, embedded }: ProjectsModalProps) {
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    const saved = localStorage.getItem('hive_projects')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return [
      {
        id: 'p1',
        name: 'ProjectHive',
        description: 'AI Agent Bot Desktop Application & Canvas',
        notes: 'Windows desktop companion. Hive CEO plus Scout, Pulse, Critic, Apollo.',
        path: '',
        updatedAt: 'Just now',
      },
    ]
  })
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [activeId, setActiveId] = useState(projects[0]?.id || '')

  const save = (next: ProjectItem[]) => {
    setProjects(next)
    localStorage.setItem('hive_projects', JSON.stringify(next))
  }

  const active = projects.find((p) => p.id === activeId) || projects[0]

  const patch = (partial: Partial<ProjectItem>) => {
    if (!active) return
    save(
      projects.map((p) =>
        p.id === active.id ? { ...p, ...partial, updatedAt: 'Just now' } : p
      )
    )
  }

  const handleCreate = () => {
    if (!newName.trim()) return
    const p: ProjectItem = {
      id: `p-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || 'Custom AI workspace',
      notes: '',
      path: '',
      updatedAt: 'Just now',
    }
    save([p, ...projects])
    setActiveId(p.id)
    setNewName('')
    setNewDesc('')
    setShowCreate(false)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = projects.filter((p) => p.id !== id)
    save(next)
    if (activeId === id) setActiveId(next[0]?.id || '')
  }

  const list = (
    <div style={{ width: embedded ? 280 : '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, padding: embedded ? '20px 16px' : 0, borderRight: embedded ? '1px solid var(--border-soft)' : 'none', background: 'var(--panel)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Projects</h3>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>Workspaces Hive can work in</p>
        </div>
        {!embedded && (
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}>
            ✕
          </button>
        )}
      </div>

      {showCreate ? (
        <div style={{ background: 'var(--panel-2)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Project name" style={field} />
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Short description" style={field} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setShowCreate(false)} style={ghostBtn}>
              Cancel
            </button>
            <button type="button" onClick={handleCreate} style={accentBtn}>
              Create
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowCreate(true)} style={{ ...ghostBtn, borderStyle: 'dashed', color: 'var(--accent)', width: '100%', padding: '10px 12px' }}>
          + Create New Project
        </button>
      )}

      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActiveId(p.id)}
            style={{
              textAlign: 'left',
              background: p.id === activeId ? 'var(--panel-2)' : 'transparent',
              border: `1px solid ${p.id === activeId ? 'var(--accent)' : 'var(--border-soft)'}`,
              borderRadius: 8,
              padding: '12px 14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
              <span
                onClick={(e) => handleDelete(p.id, e)}
                style={{ color: 'var(--text-faint)', fontSize: 12 }}
              >
                ✕
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{p.description}</div>
          </button>
        ))}
      </div>
    </div>
  )

  const detail = active ? (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'auto', padding: '28px 32px', background: 'var(--bg)' }}>
      <div style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--text-faint)', textTransform: 'uppercase' }}>Project</div>
      <input
        value={active.name}
        onChange={(e) => patch({ name: e.target.value })}
        style={{ ...bare, fontSize: 26, fontWeight: 700, marginTop: 6 }}
      />
      <textarea
        value={active.description}
        onChange={(e) => patch({ description: e.target.value })}
        rows={2}
        style={{ ...bare, fontSize: 14, color: 'var(--text-dim)', marginTop: 8, resize: 'vertical' }}
      />

      <label style={label}>Folder on this PC (optional)</label>
      <input
        value={active.path || ''}
        onChange={(e) => patch({ path: e.target.value })}
        placeholder="C:\Users\samko\Desktop\…"
        style={{ ...field, width: '100%' }}
      />

      <label style={label}>Brief for Hive</label>
      <textarea
        value={active.notes || ''}
        onChange={(e) => patch({ notes: e.target.value })}
        placeholder="What this project is, what Hive should know, constraints…"
        rows={10}
        style={{ ...field, width: '100%', resize: 'vertical', minHeight: 160, lineHeight: 1.5 }}
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button
          type="button"
          onClick={() => onSelectProject?.(active.name)}
          style={accentBtn}
        >
          Open chat about this
        </button>
        <button type="button" onClick={onClose} style={ghostBtn}>
          Back to chats
        </button>
      </div>
    </div>
  ) : (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>Create a project to start.</div>
  )

  if (embedded) {
    return (
      <div style={{ height: '100%', minHeight: 0, display: 'flex', background: 'var(--bg)' }}>
        {list}
        {detail}
      </div>
    )
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(960px, 96vw)', height: 'min(640px, 88vh)', display: 'flex', background: 'var(--panel)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {list}
        {detail}
      </div>
    </div>
  )
}

const field: React.CSSProperties = {
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '8px 10px',
  color: 'var(--text)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
}

const bare: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text)',
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
  display: 'block',
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: 'var(--text-faint)',
  margin: '18px 0 6px',
  letterSpacing: '.04em',
  textTransform: 'uppercase',
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 14px',
  color: 'var(--text-dim)',
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const accentBtn: React.CSSProperties = {
  background: 'var(--accent)',
  border: 'none',
  borderRadius: 8,
  padding: '8px 14px',
  color: '#0D0E11',
  fontWeight: 650,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
