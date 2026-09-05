import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'

export default function FeedbackModal({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user)
  const [body, setBody] = useState('')
  const [rating, setRating] = useState(5)
  const [status, setStatus] = useState('')

  const send = async () => {
    const text = body.trim()
    if (!text) return
    setStatus('Sending…')
    const row = {
      email: user?.email || null,
      body: text,
      rating,
      status: 'pending',
    }
    const { error } = await supabase.from('feedback').insert(row)
    if (error) {
      setStatus(error.message)
      return
    }
    setStatus('Sent. An admin will review it on the Hive site.')
    setBody('')
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 420, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Send feedback</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>Reviews go to the Hive admin panel on the website.</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: rating === n ? 'var(--accent)' : 'transparent',
                color: rating === n ? '#111' : 'var(--text)',
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="What should we improve?"
          style={{ width: '100%', background: 'var(--panel-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: 10, fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{status}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
              Close
            </button>
            <button type="button" onClick={send} style={{ background: 'var(--accent)', border: 'none', color: '#111', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
