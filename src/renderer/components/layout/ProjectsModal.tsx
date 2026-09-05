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
      { id: 'p1', name: 'ProjectHive', description: 'AI Agent Bot Desktop Application & Canvas', updatedAt: 'Just now' }
    ]
  })
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const handleCreate = () => {
    if (!newName.trim()) return
    const p: ProjectItem = {
      id: `p-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || 'Custom AI workspace',
      updatedAt: 'Just now',
    }
    const updated = [p, ...projects]
    setProjects(updated)
    localStorage.setItem('hive_projects', JSON.stringify(updated))
    setNewName('')
    setNewDesc('')
    setShowCreate(false)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = projects.filter((p) => p.id !== id)
    setProjects(updated)
    localStorage.setItem('hive_projects', JSON.stringify(updated))
  }

  const inner = (
    <div
      style={{
        width: '100%',
        height: embedded ? '100%' : undefined,
        maxWidth: embedded ? 'none' : 720,
        background: 'var(--panel)',
        border: embedded ? 'none' : '1px solid var(--border)',
        borderRadius: embedded ? 0 : 12,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxHeight: embedded ? 'none' : '80vh',
        minHeight: 0,
      }}
    >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Projects</h3>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
              Manage workspaces and context for Hive
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {showCreate ? (
          <div
            style={{
              background: 'var(--panel-2)',
              border: '1px solid var(--border-soft)',
              borderRadius: 8,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Project Name"
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '7px 10px',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '7px 10px',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '5px 12px',
                  color: 'var(--text-dim)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 14px',
                  color: '#0D0E11',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            style={{
              background: 'var(--panel-2)',
              border: '1px dashed var(--border)',
              borderRadius: 8,
              padding: '10px 14px',
              color: 'var(--accent)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            + Create New Project
          </button>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflowY: 'auto',
            maxHeight: 300,
          }}
        >
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                onSelectProject?.(p.name)
                onClose()
              }}
              style={{
                background: 'var(--panel-2)',
                border: '1px solid var(--border-soft)',
                borderRadius: 8,
                padding: '12px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'border-color .15s',
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  {p.description}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{p.updatedAt}</span>
                <button
                  type="button"
                  onClick={(e) => handleDelete(p.id, e)}
                  title="Delete project"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-faint)',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
    </div>
  )

  if (embedded) {
    return <div style={{ height: '100%', minHeight: 0, overflow: 'auto', background: 'var(--bg)' }}>{inner}</div>
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{inner}</div>
    </div>
  )
}
