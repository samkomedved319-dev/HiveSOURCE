import React, { useEffect, useRef, useState } from 'react'
import BloubEngineAvatar from '../mascot/BloubEngineAvatar'
import { broadcastBuddyPhase, getBuddyModel, getBuddySpeed, useBuddyColor, type BuddyLivePhase } from '../mascot/CursorBuddy'
import type { StateId } from '../../bot/states'

type BuddyPhase = BuddyLivePhase

interface LogLine {
  id: number
  kind: 'cmd' | 'act' | 'out' | 'err'
  text: string
}

const PHASE_STATE: Record<BuddyPhase, StateId> = {
  idle: 'idle',
  listening: 'wide',
  thinking: 'thinking',
  clicking: 'exclaim',
  typing: 'wide',
  running: 'orbit',
  done: 'idle',
  error: 'alert',
}

const PHASE_LABEL: Record<BuddyPhase, string> = {
  idle: 'Ask Hive Buddy — /open /run /click /type, or just ask',
  listening: 'Listening… speak now',
  thinking: 'Thinking…',
  clicking: 'Clicking…',
  typing: 'Typing…',
  running: 'Running…',
  done: 'Done',
  error: 'Something glitched — try again',
}

const PHASE_COLOR: Record<BuddyPhase, string> = {
  idle: '#8A8D96',
  listening: '#F04438',
  thinking: '#FAFAFA',
  clicking: '#F59E0B',
  typing: '#F59E0B',
  running: '#F59E0B',
  done: '#10B981',
  error: '#F04438',
}

const BUDDY_PROMPT = `You are Hive Buddy, a Jarvis-style desktop operator inside the Hive app. The user speaks briefly and you act on their PC. Answer in one or two short sentences. When the user wants a PC action, ALSO emit machine blocks after your sentence:

\`\`\`system_exec
<powershell command>
\`\`\`
\`\`\`buddy_click
X Y
\`\`\`
\`\`\`buddy_type
<text to type into the focused window>
\`\`\`

Rules: coordinates are app-window client pixels — only emit buddy_click when the user gives numbers. Never emit destructive commands (format, del /s, rm -rf, mkfs). Prefer Start-Process for opening apps and URLs.`

let logId = 0

interface BuddyOverlayProps {
  /** Rendered inside the notch popover: static layout, open on mount. */
  embedded?: boolean
  startOpen?: boolean
  onClose?: () => void
}

export default function BuddyOverlay({ embedded = false, startOpen = false, onClose }: BuddyOverlayProps = {}) {
  const [open, setOpen] = useState(startOpen)
  const [phase, setPhase] = useState<BuddyPhase>('idle')
  const [input, setInput] = useState('')
  const [log, setLog] = useState<LogLine[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const recogRef = useRef<any>(null)
  const color = useBuddyColor()

  // Every phase change animates all buddy surfaces (overlay, cursor, outer).
  useEffect(() => {
    broadcastBuddyPhase(phase)
  }, [phase])

  useEffect(() => {
    const off = window.electronAPI?.buddy?.onSummon(() => {
      setOpen(true)
      setPhase('idle')
    })
    return () => {
      try {
        off?.()
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stopListening()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ])

  const push = (kind: LogLine['kind'], text: string) => {
    logId += 1
    const line = { id: logId, kind, text }
    setLog((prev) => [...prev.slice(-29), line])
  }

  const stopListening = () => {
    try {
      recogRef.current?.stop?.()
    } catch {}
    recogRef.current = null
    if (embedded) {
      try {
        onClose?.()
      } catch {}
      return
    }
    setPhase((p) => (p === 'listening' ? 'idle' : p))
    setOpen(false)
  }

  const toggleListen = () => {
    if (phase === 'listening') {
      stopListening()
      return
    }
    const SR =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition
    if (!SR) {
      push('err', 'Voice input is not available in this build — type your command instead.')
      setPhase('error')
      setTimeout(() => setPhase('idle'), 2500)
      return
    }
    try {
      const recog = new SR()
      recog.lang = 'en-US'
      recog.interimResults = false
      recog.maxAlternatives = 1
      recog.onresult = (e: any) => {
        const text = e.results?.[0]?.[0]?.transcript || ''
        if (text) {
          setInput(text)
          setPhase('idle')
        }
      }
      recog.onerror = () => {
        push('err', 'Mic recognition failed — type your command instead.')
        setPhase('error')
        setTimeout(() => setPhase('idle'), 2500)
      }
      recog.onend = () => {
        recogRef.current = null
        setPhase((p) => (p === 'listening' ? 'idle' : p))
      }
      recogRef.current = recog
      recog.start()
      setPhase('listening')
    } catch {
      push('err', 'Could not start the microphone — type your command instead.')
      setPhase('error')
      setTimeout(() => setPhase('idle'), 2500)
    }
  }

  const runSlash = async (text: string): Promise<boolean> => {
    const [cmd, ...rest] = text.trim().split(/\s+/)
    const arg = rest.join(' ')
    const lower = (cmd || '').toLowerCase()
    if (lower === '/open' && arg) {
      setPhase('running')
      const res = await window.electronAPI?.system?.openApp(arg)
      push(res?.ok ? 'out' : 'err', res?.ok ? `Opened ${arg}` : `Open failed: ${res?.error || 'bridge unavailable'}`)
      return true
    }
    if (lower === '/run' && arg) {
      setPhase('running')
      const res = await window.electronAPI?.system?.exec(arg)
      push(res?.ok ? 'out' : 'err', res?.ok ? (res?.stdout || '(no output)') : `Run failed: ${res?.error || 'bridge unavailable'}`)
      return true
    }
    if (lower === '/click') {
      const nums = arg.split(/\s+/).map(Number)
      if (nums.length >= 2 && nums.every(Number.isFinite)) {
        setPhase('clicking')
        const res = await window.electronAPI?.buddy?.click(nums[0], nums[1])
        push(res?.ok ? 'out' : 'err', res?.ok ? `Clicked ${nums[0]}, ${nums[1]}` : `Click failed: ${res?.error}`)
      } else {
        push('err', 'Usage: /click <x> <y>  (app-window pixels)')
      }
      return true
    }
    if (lower === '/type' && arg) {
      setPhase('typing')
      const res = await window.electronAPI?.buddy?.type(arg)
      push(res?.ok ? 'out' : 'err', res?.ok ? `Typed ${arg.length} chars` : `Type failed: ${res?.error}`)
      return true
    }
    return false
  }

  const runAi = async (text: string) => {
    setPhase('thinking')
    try {
      const bridge = window.electronAPI?.ai?.chat
      if (!bridge) {
        push('err', 'Buddy failed: AI bridge is not ready.')
        setPhase('error')
        return
      }
      const res = await bridge(
        [
          { role: 'system', content: BUDDY_PROMPT },
          { role: 'user', content: text },
        ],
        getBuddyModel()
      )
      if (!res.ok || !res.content) {
        push('err', `Buddy failed: ${res.error || 'no response'}`)
        setPhase('error')
        return
      }
      const content = res.content
      const execMatch = content.match(/```system_exec\n([\s\S]*?)```/)
      const clickMatch = content.match(/```buddy_click\n([\s\S]*?)```/)
      const typeMatch = content.match(/```buddy_type\n([\s\S]*?)```/)
      const summary = content.replace(/```[\s\S]*?```/g, '').trim().slice(0, 220)

      if (execMatch) {
        const cmd = execMatch[1].trim()
        setPhase('running')
        const out = await window.electronAPI?.system?.exec(cmd)
        push(out?.ok ? 'out' : 'err', out?.ok ? (out?.stdout || `(ran) ${cmd.slice(0, 80)}`) : `Run failed: ${out?.error || 'bridge unavailable'}`)
      }
      if (clickMatch) {
        const nums = clickMatch[1].trim().split(/\s+/).map(Number)
        if (nums.length >= 2 && nums.every(Number.isFinite)) {
          setPhase('clicking')
          const out = await window.electronAPI?.buddy?.click(nums[0], nums[1])
          push(out?.ok ? 'out' : 'err', out?.ok ? `Clicked ${nums[0]}, ${nums[1]}` : `Click failed: ${out?.error || 'bridge unavailable'}`)
        }
      }
      if (typeMatch) {
        setPhase('typing')
        const out = await window.electronAPI?.buddy?.type(typeMatch[1].replace(/^\n+/, '').slice(0, 500))
        push(out?.ok ? 'out' : 'err', out?.ok ? 'Typed into focused window' : `Type failed: ${out?.error || 'bridge unavailable'}`)
      }
      if (summary) push('out', summary)
      setPhase('done')
      try {
        await window.electronAPI?.tts?.speak(summary || 'Done')
      } catch {}
      setTimeout(() => setPhase((p) => (p === 'done' ? 'idle' : p)), 3000)
    } catch (e: any) {
      push('err', `Buddy error: ${e?.message || e}`)
      setPhase('error')
    }
  }

  const send = async () => {
    const text = input.trim()
    if (!text || phase === 'thinking') return
    setInput('')
    push('cmd', text)
    try {
      if (await runSlash(text)) {
        setPhase('done')
        setTimeout(() => setPhase((p) => (p === 'done' ? 'idle' : p)), 2500)
        return
      }
      if (getBuddySpeed() === 'no') {
        push('out', 'Buddy replies are off. Set Buddy Model to Fast or Auto in Settings.')
        setPhase('idle')
        return
      }
      await runAi(text)
    } catch (e: any) {
      push('err', `Buddy error: ${e?.message || e}`)
      setPhase('error')
    }
  }

  if (!open) return null

  return (
    <div
      style={
        embedded
          ? {
              width: '100%',
              background: 'rgba(20, 21, 26, 0.97)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
              animation: 'rise .25s var(--ease) forwards',
            }
          : {
              position: 'fixed',
              top: 56,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(560px, 92vw)',
              zIndex: 200,
              background: 'rgba(20, 21, 26, 0.97)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
            }
      }
      role="dialog"
      aria-label="Hive Buddy overlay"
    >
      {/* Header: avatar wears the phase */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border-soft)' }}>
        <BloubEngineAvatar size={30} crop={120} botState={PHASE_STATE[phase]} ink={color} fps={60} />
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: PHASE_COLOR[phase], flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: 'var(--text-dim)', flex: 1 }}>{PHASE_LABEL[phase]}</span>
        <button
          type="button"
          onClick={stopListening}
          title="Close (Esc)"
          style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 13, padding: 4 }}
        >
          ✕
        </button>
      </div>

      {/* Audit log */}
      {log.length > 0 && (
        <div style={{ maxHeight: 170, overflowY: 'auto', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {log.map((l) => (
            <div
              key={l.id}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11.5,
                lineHeight: 1.5,
                color: l.kind === 'err' ? '#F87171' : l.kind === 'cmd' ? '#FAFAFA' : l.kind === 'act' ? '#38BDF8' : '#9CA3AF',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {l.kind === 'cmd' ? '› ' : l.kind === 'err' ? '! ' : '· '}{l.text}
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px' }}>
        <button
          type="button"
          onClick={toggleListen}
          title={phase === 'listening' ? 'Stop listening' : 'Push to talk'}
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: `1px solid ${phase === 'listening' ? '#F04438' : 'var(--border)'}`,
            background: phase === 'listening' ? 'rgba(240,68,56,0.15)' : 'var(--panel-2)',
            color: phase === 'listening' ? '#F04438' : 'var(--text-dim)',
            cursor: 'pointer',
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          🎙
        </button>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send()
          }}
          placeholder="Ask Buddy, or /open /run /click /type…"
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: 13,
            fontFamily: 'inherit',
          }}
        />
        <button
          type="button"
          onClick={send}
          title="Send"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'var(--accent)',
            color: '#0D0E11',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
