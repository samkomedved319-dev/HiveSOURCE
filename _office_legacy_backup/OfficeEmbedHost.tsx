import React, { useEffect, useState } from 'react'

const OFFICE_URL = 'http://127.0.0.1:5174/'

/**
 * Host for the live HiveOffice Vite app.
 * In Electron: opens a BrowserView over the content area (rail stays visible).
 * Fallback: iframe to the same URL when IPC is unavailable.
 */
export default function OfficeEmbedHost({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'browserView' | 'iframe' | 'error'>('iframe')
  const [status, setStatus] = useState('Connecting to HiveOffice…')

  useEffect(() => {
    let cancelled = false
    const open = async () => {
      const api = window.electronAPI?.office3d
      if (api?.open) {
        try {
          const res = await api.open()
          if (cancelled) return
          if (res?.ok) {
            setMode('browserView')
            setStatus(`HiveOffice · ${res.url || OFFICE_URL}`)
            return
          }
          setStatus(res?.error || 'BrowserView failed — using iframe')
        } catch (e) {
          if (cancelled) return
          setStatus(e instanceof Error ? e.message : 'IPC failed — using iframe')
        }
      }
      if (!cancelled) {
        setMode('iframe')
        setStatus(`HiveOffice · ${OFFICE_URL}`)
      }
    }
    void open()
    return () => {
      cancelled = true
      try {
        void window.electronAPI?.office3d?.close?.()
      } catch {}
    }
  }, [])

  const handleClose = () => {
    try {
      void window.electronAPI?.office3d?.close?.()
    } catch {}
    onClose()
  }

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg, #0b0c0e)',
        position: 'relative',
      }}
    >
      {/* Hive-chrome strip — matches TitleBar height / drag region */}
      <div
        style={{
          height: 44,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px 0 16px',
          borderBottom: '1px solid var(--border-soft, rgba(255,255,255,0.08))',
          background: 'var(--bg, #0b0c0e)',
          WebkitAppRegion: 'drag',
          userSelect: 'none',
        } as React.CSSProperties}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--accent, #F2C14E)', fontWeight: 600, fontSize: 13 }}>
            3D Office
          </span>
          <span style={{ color: 'var(--text-faint, #888)', fontSize: 12 }}>{status}</span>
        </div>
        <button
          type="button"
          title="Close HiveOffice"
          onClick={handleClose}
          style={{
            WebkitAppRegion: 'no-drag',
            height: 28,
            padding: '0 12px',
            borderRadius: 8,
            border: '1px solid var(--border-soft, rgba(255,255,255,0.12))',
            background: 'var(--panel-2, #17181C)',
            color: 'var(--text-dim, #ccc)',
            cursor: 'pointer',
            fontSize: 12,
          } as React.CSSProperties}
        >
          Back to chat
        </button>
      </div>

      {mode === 'browserView' ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-faint, #666)',
            fontSize: 13,
            background: '#0b0c0e',
          }}
        >
          {/* BrowserView paints above this; keep dark so flash is Hive-colored */}
          Loading HiveOffice…
        </div>
      ) : (
        <iframe
          title="HiveOffice"
          src={OFFICE_URL}
          style={{
            flex: 1,
            width: '100%',
            border: 'none',
            background: '#0b0c0e',
          }}
          allow="fullscreen; autoplay; clipboard-read; clipboard-write"
          onError={() => setMode('error')}
        />
      )}

      {mode === 'error' && (
        <div style={{ padding: 24, color: '#f88' }}>
          Could not reach {OFFICE_URL}. Keep HiveOffice Vite running on :5174.
        </div>
      )}
    </div>
  )
}
