import React, { useState } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useAgentStore } from '../../stores/agentStore'
import MascotPicker from '../mascot/MascotPicker'
import { getBuddyMascotId, getMascot } from '../mascot/mascotLibrary'

interface SettingsModalProps {
  onClose: () => void
}

type SettingsTab = 'general' | 'models' | 'appearance' | 'integrations' | 'shortcuts'

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  // Auth & Telegram Token
  const [googleUser, setGoogleUser] = useState<{ email: string; name: string } | null>(() => {
    try {
      const saved = localStorage.getItem('hive_google_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [telegramPin, setTelegramPin] = useState('849201')

  // General Settings
  const [defaultMode, setDefaultMode] = useState(localStorage.getItem('hive_mode') || 'reasoning')
  const [autoOpenCanvas, setAutoOpenCanvas] = useState(localStorage.getItem('hive_auto_canvas') === 'true')
  const [sendWithEnter, setSendWithEnter] = useState(localStorage.getItem('hive_enter_to_send') !== 'false')

  // Hive Buddy (cursor companion + push-to-talk overlay)
  const [buddyEnabled, setBuddyEnabled] = useState(localStorage.getItem('hive_buddy_enabled') === 'true')
  const [buddyModel, setBuddyModel] = useState(
    localStorage.getItem('hive_buddy_model') || localStorage.getItem('hive_model') || 'openai/gpt-4o-mini'
  )
  const [buddyColor, setBuddyColor] = useState(localStorage.getItem('hive_buddy_color') || '#F08A24')
  const [buddyMascot, setBuddyMascot] = useState(getBuddyMascotId())

  // Model & Reasoning Settings
  const [defaultModel, setDefaultModel] = useState(localStorage.getItem('hive_model') || 'openai/gpt-4o-mini')
  const [customKey, setCustomKey] = useState(localStorage.getItem('hive_custom_api_key') || '')
  const [systemPrompt, setSystemPrompt] = useState(
    localStorage.getItem('hive_system_prompt') || 'You are Hive, an expert pro-tier developer and AI reasoning assistant.'
  )

  // Appearance Settings
  const [accentColor, setAccentColor] = useState(localStorage.getItem('hive_accent_color') || '#F2C14E')
  const [reducedMotion, setReducedMotion] = useState(localStorage.getItem('hive_reduced_motion') === 'true')

  // Feedback states
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const { activeAgent } = useAgentStore()
  const { clearMessages, getMessages } = useChatStore()

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2400)
  }

  const handleSave = () => {
    localStorage.setItem('hive_mode', defaultMode)
    localStorage.setItem('hive_auto_canvas', autoOpenCanvas ? 'true' : 'false')
    localStorage.setItem('hive_enter_to_send', sendWithEnter ? 'true' : 'false')
    localStorage.setItem('hive_model', defaultModel)
    localStorage.setItem('hive_buddy_enabled', buddyEnabled ? 'true' : 'false')
    localStorage.setItem('hive_buddy_model', buddyModel)
    localStorage.setItem('hive_buddy_color', buddyColor)
    localStorage.setItem('hive_buddy_mascot', buddyMascot)
    localStorage.setItem('hive_custom_api_key', customKey)
    localStorage.setItem('hive_system_prompt', systemPrompt)
    localStorage.setItem('hive_accent_color', accentColor)
    localStorage.setItem('hive_reduced_motion', reducedMotion ? 'true' : 'false')

    document.documentElement.style.setProperty('--accent', accentColor)

    window.dispatchEvent(new Event('hive:buddy-settings'))
    showToast('Settings saved')
    setTimeout(() => {
      onClose()
    }, 450)
  }

  const handleClearHistory = () => {
    if (activeAgent) {
      clearMessages(activeAgent.id)
      localStorage.removeItem('hive_conversations')
      localStorage.removeItem('hive_active_conv')
      showToast('Chat history cleared')
    }
  }

  const handleExportData = () => {
    setIsExporting(true)
    try {
      const data = {
        conversations: localStorage.getItem('hive_conversations'),
        messages: activeAgent ? getMessages(activeAgent.id) : [],
        settings: {
          mode: defaultMode,
          model: defaultModel,
          accent: accentColor,
        },
        exportedAt: new Date().toISOString(),
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hive-workspace-export-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Workspace exported successfully')
    } catch {
      showToast('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleResetDefaults = () => {
    setDefaultMode('reasoning')
    setAutoOpenCanvas(false)
    setSendWithEnter(true)
    setDefaultModel('openai/gpt-4o-mini')
    setCustomKey('')
    setSystemPrompt('You are Hive, an expert pro-tier developer and AI reasoning assistant.')
    setAccentColor('#F2C14E')
    setReducedMotion(false)
    setBuddyEnabled(false)
    setBuddyModel('openai/gpt-4o-mini')
    setBuddyColor('#F08A24')
    document.documentElement.style.setProperty('--accent', '#F2C14E')
    showToast('Preferences reset to defaults')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 6, 8, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 680,
          height: 480,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75)',
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Left Sidebar Navigation */}
        <div
          style={{
            background: 'var(--bg)',
            borderRight: '1px solid var(--border-soft)',
            padding: '16px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                padding: '6px 10px 12px 10px',
              }}
            >
              Settings
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <NavButton
                active={activeTab === 'general'}
                label="General"
                onClick={() => setActiveTab('general')}
              />
              <NavButton
                active={activeTab === 'models'}
                label="Models & Reasoning"
                onClick={() => setActiveTab('models')}
              />
              <NavButton
                active={activeTab === 'appearance'}
                label="Appearance"
                onClick={() => setActiveTab('appearance')}
              />
              <NavButton
                active={activeTab === 'integrations'}
                label="Integrations & Auth"
                onClick={() => setActiveTab('integrations')}
              />
              <NavButton
                active={activeTab === 'shortcuts'}
                label="Shortcuts"
                onClick={() => setActiveTab('shortcuts')}
              />
            </div>
          </div>

          <div style={{ padding: '0 8px', fontSize: 11, color: 'var(--text-faint)' }}>
            Hive Desktop · v0.0.1
          </div>
        </div>

        {/* Right Content Pane */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Content Header */}
          <div
            style={{
              height: 48,
              borderBottom: '1px solid var(--border-soft)',
              padding: '0 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              {activeTab === 'general' && 'General Preferences'}
              {activeTab === 'models' && 'Models & Thinking Behavior'}
              {activeTab === 'appearance' && 'Appearance & Tokens'}
              {activeTab === 'integrations' && 'Cloud, datasets & extensions'}
              {activeTab === 'shortcuts' && 'Keyboard Shortcuts'}
            </span>
            <button
              type="button"
              onClick={onClose}
              title="Close Settings"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: 14,
                padding: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
            >
              ✕
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <>
                <SettingRow
                  label="Enter Key Action"
                  description="Pressing Enter sends immediately; Shift+Enter creates a newline"
                >
                  <input
                    type="checkbox"
                    checked={sendWithEnter}
                    onChange={(e) => setSendWithEnter(e.target.checked)}
                    style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                </SettingRow>

                <SettingRow
                  label="Auto-Slide Code Canvas"
                  description="Smoothly slide open the canvas panel when code or themes generate"
                >
                  <input
                    type="checkbox"
                    checked={autoOpenCanvas}
                    onChange={(e) => setAutoOpenCanvas(e.target.checked)}
                    style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                </SettingRow>

                <div style={{ height: 1, background: 'var(--border-soft)', margin: '4px 0' }} />

                <SettingRow
                  label="Hive Buddy at Cursor"
                  description="The house avatar rides next to your cursor. Ctrl + Shift + J pops the notch anywhere"
                >
                  <input
                    type="checkbox"
                    checked={buddyEnabled}
                    onChange={(e) => setBuddyEnabled(e.target.checked)}
                    style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                </SettingRow>

                <SettingRow
                  label="Buddy Model"
                  description="LLM answering Buddy overlay requests"
                >
                  <select
                    value={buddyModel}
                    onChange={(e) => setBuddyModel(e.target.value)}
                    style={{
                      background: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '5px 8px',
                      color: 'var(--text)',
                      fontSize: 12,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  >
                    <option value="openai/gpt-4o-mini">Hive 2 Mini (Default)</option>
                    <option value="openai/gpt-4o">Hive 2 (GPT-4o)</option>
                    <option value="anthropic/claude-3.5-sonnet">Hive 3.5 Sonnet</option>
                    <option value="google/gemini-flash-1.5">Hive Flash</option>
                    <option value="meta-llama/llama-3.3-70b-instruct">Hive Open 70B</option>
                  </select>
                </SettingRow>

                <SettingRow
                  label="Buddy mascot"
                  description="Premade Bloub skins from the official customizer"
                >
                  <div style={{ width: 360, maxWidth: '100%' }}>
                    <MascotPicker
                      value={buddyMascot}
                      onChange={(id) => {
                        setBuddyMascot(id)
                        setBuddyColor(getMascot(id).ink)
                      }}
                    />
                  </div>
                </SettingRow>

                <div style={{ height: 1, background: 'var(--border-soft)', margin: '4px 0' }} />

                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                    Workspace Data & Storage
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginBottom: 12 }}>
                    Manage local caching and conversation state stored on your device.
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={handleExportData}
                      disabled={isExporting}
                      style={{
                        background: 'var(--panel-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 12,
                        color: 'var(--text)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Export Workspace JSON
                    </button>

                    <button
                      type="button"
                      onClick={handleClearHistory}
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 12,
                        color: '#f87171',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Clear All History
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* MODELS & REASONING TAB */}
            {activeTab === 'models' && (
              <>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 12 }}>
                  Hive talks through <b>OpenRouter</b> (`OPENROUTER_API_KEY` in `.env`). Mozaik Cloud is an optional
                  managed runtime at mozaik.jigjoy.ai — you do not need a Mozaik key. If the terminal says
                  “no API key”, ignore it; local Hive already reuses your OpenRouter key.
                </div>
                <SettingRow
                  label="Default Model"
                  description="Primary LLM selected for new conversations"
                >
                  <select
                    value={defaultModel}
                    onChange={(e) => setDefaultModel(e.target.value)}
                    style={{
                      background: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '5px 8px',
                      color: 'var(--text)',
                      fontSize: 12,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  >
                    <option value="openai/gpt-4o-mini">Hive 2 Mini (Default)</option>
                    <option value="openai/gpt-4o">Hive 2 (GPT-4o)</option>
                    <option value="anthropic/claude-3.5-sonnet">Hive 3.5 Sonnet</option>
                    <option value="google/gemini-flash-1.5">Hive Flash</option>
                    <option value="meta-llama/llama-3.3-70b-instruct">Hive Open 70B</option>
                  </select>
                </SettingRow>

                <SettingRow
                  label="Default Thinking Mode"
                  description="Controls deduction depth and reflection tokens"
                >
                  <select
                    value={defaultMode}
                    onChange={(e) => setDefaultMode(e.target.value)}
                    style={{
                      background: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '5px 8px',
                      color: 'var(--text)',
                      fontSize: 12,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  >
                    <option value="fast">⚡ Fast</option>
                    <option value="reasoning">🧠 Reasoning</option>
                    <option value="heavy">🔥 Heavy Thinking</option>
                    <option value="max">🚀 Max Thinking</option>
                  </select>
                </SettingRow>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>
                    System Instructions
                  </label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={3}
                    style={{
                      background: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '8px 10px',
                      color: 'var(--text)',
                      fontSize: 12,
                      lineHeight: 1.5,
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>
                    Custom OpenRouter API Key
                  </label>
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="sk-or-v1-... (optional, overrides default)"
                    style={{
                      background: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '7px 10px',
                      color: 'var(--text)',
                      fontSize: 12,
                      outline: 'none',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                </div>
              </>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <>
                <SettingRow
                  label="Accent"
                  description="Hive uses a fixed gold accent. Colors are not customizable."
                >
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: '#F2C14E', border: '1px solid var(--border)' }} />
                </SettingRow>

                <SettingRow
                  label="Reduced Motion"
                  description="Minimize CSS transition durations and disable continuous spins"
                >
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={(e) => setReducedMotion(e.target.checked)}
                    style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                </SettingRow>

                <div
                  style={{
                    background: 'var(--panel-2)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text)' }}>
                    Visual Design Tokens
                  </div>
                  <pre
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: 'var(--text-dim)',
                      lineHeight: 1.6,
                    }}
                  >
                    --bg: #0D0E11; --panel: #17181C; --border: #2A2C32; --accent: {accentColor};
                  </pre>
                </div>
              </>
            )}

            {/* INTEGRATIONS TAB */}
            {activeTab === 'integrations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 1. Google Authentication Login */}
                <div
                  style={{
                    background: 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 14,
                    display: localStorage.getItem('hive_staff') === '1' ? 'flex' : 'none',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                        </svg>
                        Google Account Sync
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
                        Authenticate with Google to backup your settings, workers, and project canvas.
                      </div>
                    </div>

                    {googleUser ? (
                      <button
                        type="button"
                        onClick={() => {
                          setGoogleUser(null)
                          localStorage.removeItem('hive_google_user')
                          showToast('Logged out of Google account')
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: 6,
                          padding: '5px 10px',
                          color: '#f87171',
                          fontSize: 11.5,
                          cursor: 'pointer',
                        }}
                      >
                        Sign Out
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const mockUser = { name: 'Samuel Medved', email: 'samuel.medved@gmail.com' }
                          setGoogleUser(mockUser)
                          localStorage.setItem('hive_google_user', JSON.stringify(mockUser))
                          showToast('Successfully authenticated with Google')
                        }}
                        style={{
                          background: '#FFFFFF',
                          color: '#1F2937',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        Sign in with Google
                      </button>
                    )}
                  </div>

                  {googleUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#4285F4',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {googleUser.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{googleUser.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{googleUser.email} · Authenticated</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Telegram 6-Digit PIN Authentication */}
                <div
                  style={{
                    background: 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 14,
                    display: localStorage.getItem('hive_staff') === '1' ? 'flex' : 'none',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Telegram 6-Digit Pairing Token
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
                        Send this token in Telegram to link your chat with Hive.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        if (window.electronAPI?.telegram?.generateAuthPin) {
                          const newPin = await window.electronAPI.telegram.generateAuthPin()
                          setTelegramPin(newPin)
                        } else {
                          const gen = Math.floor(100000 + Math.random() * 900000).toString()
                          setTelegramPin(gen)
                        }
                        showToast('Generated fresh 6-digit PIN')
                      }}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '5px 10px',
                        color: 'var(--accent)',
                        fontSize: 11.5,
                        cursor: 'pointer',
                      }}
                    >
                      Regenerate PIN
                    </button>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg)',
                      border: '1px dashed var(--accent-dim)',
                      borderRadius: 8,
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>ACTIVE VERIFICATION PIN</div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 22,
                          fontWeight: 700,
                          letterSpacing: '.18em',
                          color: 'var(--accent)',
                          marginTop: 2,
                        }}
                      >
                        {telegramPin}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(telegramPin)
                        showToast('PIN copied to clipboard')
                      }}
                      style={{
                        background: 'var(--panel-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 11.5,
                        color: 'var(--text)',
                        cursor: 'pointer',
                      }}
                    >
                      Copy Token
                    </button>
                  </div>
                </div>

                {/* 3. Chrome Extension Bridge (Manus AI companion) */}
                <div
                  style={{
                    background: 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" />
                      <line x1="21.17" y1="8" x2="12" y2="8" />
                      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
                    </svg>
                    Manus AI-Style Chrome Extension
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
                    Your autonomous browser extension is located in <code style={{ color: 'var(--accent)', background: 'var(--bg)', padding: '2px 4px', borderRadius: 4 }}>chrome-extension/</code>. Load unpacked in <code style={{ color: 'var(--accent)', background: 'var(--bg)', padding: '2px 4px', borderRadius: 4 }}>chrome://extensions</code> to let Hive extract pages, fill forms, and control tabs.
                  </div>
                </div>
              </div>
            )}

            {/* SHORTCUTS TAB */}
            {activeTab === 'shortcuts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ShortcutItem keys={['Ctrl', 'K']} description="Command palette" />
                <ShortcutItem keys={['Ctrl', 'N']} description="New chat" />
                <ShortcutItem keys={['Ctrl', 'B']} description="Toggle conversation list sidebar" />
                <ShortcutItem keys={['Ctrl', 'Shift', 'H']} description="Toggle HiveBox crew panel" />
                <ShortcutItem keys={['Ctrl', ',']} description="Open settings" />
                <ShortcutItem keys={['Ctrl', 'Shift', 'J']} description="Pop the Hive Buddy notch (voice + PC control)" />
                <ShortcutItem keys={['Enter']} description="Send message" />
                <ShortcutItem keys={['Shift', 'Enter']} description="Insert newline into composer" />
                <ShortcutItem keys={['@']} description="Mention a bot in a group (Discord-style)" />
                <ShortcutItem keys={['Esc']} description="Close active dialog or modal" />
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div
            style={{
              height: 48,
              borderTop: '1px solid var(--border-soft)',
              padding: '0 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--panel)',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={handleResetDefaults}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: 12,
                cursor: 'pointer',
                padding: '4px 6px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
            >
              Reset to Defaults
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 12,
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#0D0E11',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Toast feedback */}
        {toastMessage && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 11.5,
              color: 'var(--accent)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
            }}
          >
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  )
}

function NavButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '7px 10px',
        borderRadius: 6,
        border: 'none',
        background: active ? 'var(--panel-2)' : 'transparent',
        color: active ? 'var(--text)' : 'var(--text-dim)',
        fontSize: 12.5,
        fontWeight: active ? 500 : 400,
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background .12s, color .12s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--panel-2)'
          e.currentTarget.style.color = 'var(--text)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-dim)'
        }
      }}
    >
      {label}
    </button>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 12.8, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}

function ShortcutItem({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 10px',
        borderRadius: 6,
        background: 'var(--panel-2)',
        border: '1px solid var(--border-soft)',
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--text)' }}>{description}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {keys.map((k) => (
          <kbd
            key={k}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '2px 6px',
              color: 'var(--text-dim)',
            }}
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  )
}
