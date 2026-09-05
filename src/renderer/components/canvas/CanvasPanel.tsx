import React, { useState } from 'react'
import { useAgentStore } from '../../stores/agentStore'
import { useChatStore } from '../../stores/chatStore'

export interface BrowserStep {
  id: string
  action: 'navigate' | 'click' | 'type' | 'extract' | 'reason'
  target: string
  status: 'running' | 'completed' | 'failed'
  timestamp: number
  detail?: string
}

interface CanvasPanelProps {
  fileName?: string
  cardMeta?: string
  codeContent?: string
  browserSteps?: BrowserStep[]
  activeBrowserUrl?: string
  activeTabTitle?: string
  mode?: 'code' | 'browser' | 'swarm'
  onClose?: () => void
}

export default function CanvasPanel({
  fileName = 'theme.css',
  cardMeta = 'Generated file · 42 lines',
  codeContent = `:root{
  --bg: #0D0E11;
  --panel: #17181C;
  --accent: #F2C14E;
  --text: #F5F6F7;
  --radius: 10px;
}

.button--primary{
  background: var(--accent);
  color: var(--bg);
  border-radius: 8px;
}`,
  browserSteps = [],
  activeBrowserUrl = 'https://google.com',
  activeTabTitle = 'Google Search',
  mode = 'code',
  onClose,
}: CanvasPanelProps) {
  const [copied, setCopied] = useState(false)
  const [activeView, setActiveView] = useState<'code' | 'browser' | 'swarm'>(mode || 'swarm')
  const { agents, activeAgent, setActiveAgent } = useAgentStore()
  const { isTyping } = useChatStore()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div
      style={{
        background: 'var(--panel)',
        borderLeft: '1px solid var(--border-soft)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: 420,
        flexShrink: 0,
      }}
    >
      {/* Top Header */}
      <div
        style={{
          height: 52,
          borderBottom: '1px solid var(--border-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => setActiveView('code')}
            style={{
              background: activeView === 'code' ? 'var(--panel-2)' : 'transparent',
              color: activeView === 'code' ? 'var(--accent)' : 'var(--text-dim)',
              border: activeView === 'code' ? '1px solid var(--border)' : '1px solid transparent',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 11.5,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Canvas
          </button>

          <button
            type="button"
            onClick={() => setActiveView('swarm')}
            style={{
              background: activeView === 'swarm' ? 'var(--panel-2)' : 'transparent',
              color: activeView === 'swarm' ? 'var(--accent)' : 'var(--text-dim)',
              border: activeView === 'swarm' ? '1px solid var(--border)' : '1px solid transparent',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 11.5,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Swarm Bots
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#F2C14E',
                boxShadow: '0 0 6px rgba(242, 193, 78, 0.6)',
              }}
            />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {activeView === 'code' && (
            <button
              type="button"
              onClick={handleCopy}
              title="Copy code"
              style={{
                background: 'var(--panel-2)',
                border: '1px solid var(--border-soft)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 11,
                color: copied ? 'var(--accent)' : 'var(--text-dim)',
                cursor: 'pointer',
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close panel"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-faint)',
                cursor: 'pointer',
                fontSize: 14,
                padding: '2px 6px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* View: Code Artifact */}
      {activeView === 'code' && (
        <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>
          <div
            style={{
              background: 'var(--panel-2)',
              border: '1px solid var(--border-soft)',
              borderRadius: 10,
              padding: 14,
              marginBottom: 10,
              fontSize: 12.5,
              color: 'var(--text-dim)',
            }}
          >
            {cardMeta}
          </div>
          <pre
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11.8,
              color: '#D8DAE0',
              background: '#101115',
              padding: 12,
              borderRadius: 8,
              overflowX: 'auto',
              lineHeight: 1.6,
            }}
          >
            {codeContent}
          </pre>
        </div>
      )}

      {/* View: Live Manus Browser Visualizer */}
      {activeView === 'browser' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Browser Address Bar */}
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--bg)',
              borderBottom: '1px solid var(--border-soft)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                flex: 1,
                background: 'var(--panel-2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 11.5,
                color: 'var(--text-dim)',
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ color: 'var(--accent)' }}>🔒</span>
              <span>{activeBrowserUrl}</span>
            </div>
            <span
              style={{
                fontSize: 10,
                color: 'var(--accent)',
                fontWeight: 600,
                background: 'rgba(242,193,78,0.12)',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              AUTONOMOUS
            </span>
          </div>

          {/* Browser Viewport Preview */}
          <div
            style={{
              margin: '12px 14px',
              height: 180,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: '#0a0b0d',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                height: 24,
                background: 'var(--panel-2)',
                borderBottom: '1px solid var(--border-soft)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px',
                gap: 4,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: 10, color: 'var(--text-faint)', marginLeft: 6 }}>
                {activeTabTitle || 'Manus Browser Companion'}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                  Hive Controlling Browser Live
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', maxWidth: 280 }}>
                Autonomous extension navigating pages, executing searches, and scraping data.
              </div>
            </div>
          </div>

          {/* Step-by-Step Live Execution Stream */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 14px 14px' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-faint)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                marginBottom: 8,
              }}
            >
              Live Autonomous Execution Steps
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(browserSteps.length > 0
                ? browserSteps
                : [
                    {
                      id: 'step-1',
                      action: 'navigate' as const,
                      target: 'https://google.com/search?q=latest+AI+models',
                      status: 'completed' as const,
                      timestamp: Date.now() - 3000,
                      detail: 'Navigated to search results',
                    },
                    {
                      id: 'step-2',
                      action: 'click' as const,
                      target: "button[type='submit']",
                      status: 'completed' as const,
                      timestamp: Date.now() - 2000,
                      detail: 'Executed query',
                    },
                    {
                      id: 'step-3',
                      action: 'extract' as const,
                      target: 'document.body.innerText',
                      status: 'running' as const,
                      timestamp: Date.now() - 500,
                      detail: 'Scraping top 5 articles and synthesizing answer...',
                    },
                  ]
              ).map((step, idx) => (
                <div
                  key={step.id}
                  style={{
                    background: 'var(--panel-2)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: step.status === 'running' ? 'rgba(242,193,78,0.15)' : 'rgba(16,185,129,0.15)',
                      color: step.status === 'running' ? 'var(--accent)' : '#10b981',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {step.status === 'running' ? '⟳' : '✓'}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: 'var(--text)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Step {idx + 1}: {step.action}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                        {step.status === 'running' ? 'Running' : 'Done'}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-dim)',
                        fontFamily: "'JetBrains Mono', monospace",
                        marginTop: 2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {step.target}
                    </div>
                    {step.detail && (
                      <div style={{ fontSize: 10.5, color: 'var(--accent)', marginTop: 2 }}>{step.detail}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View: Active Swarm Bots & Live Status */}
      {activeView === 'swarm' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Swarm Status Bar */}
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--bg)',
              borderBottom: '1px solid var(--border-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>
                Active Autonomous Swarm
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                {agents.length} Bots Online · Multi-Agent Network
              </div>
            </div>
            <span
              style={{
                fontSize: 10,
                color: '#10b981',
                fontWeight: 700,
                background: 'rgba(16,185,129,0.12)',
                padding: '3px 8px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              LIVE
            </span>
          </div>

          {/* Bots Cards List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {agents.map((bot) => {
              const isCurrent = activeAgent?.id === bot.id
              const isBotTyping = isCurrent && isTyping

              return (
                <div
                  key={bot.id}
                  onClick={() => setActiveAgent(bot)}
                  style={{
                    background: isCurrent ? 'var(--panel-2)' : 'var(--panel)',
                    border: isCurrent ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{bot.avatar || '🤖'}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{bot.name}</span>
                          {bot.isCeo && (
                            <span style={{ fontSize: 9.5, background: 'rgba(242,193,78,0.2)', color: 'var(--accent)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                              👑 CEO
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                          {bot.roleTitle || (bot.isCeo ? 'Head Architect' : 'Subordinate Specialist')}
                        </div>
                      </div>
                    </div>

                    {/* Status badge & typing indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isBotTyping ? (
                        <span
                          style={{
                            fontSize: 10.5,
                            color: 'var(--accent)',
                            fontWeight: 700,
                            background: 'rgba(242,193,78,0.15)',
                            padding: '2px 8px',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            animation: 'pulse 1.2s infinite',
                          }}
                        >
                          <span style={{ animation: 'spin 1s infinite linear' }}>⟳</span>
                          Typing…
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 10,
                            color: '#10b981',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                          Ready
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                    {bot.description || 'Specialized worker node.'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 10.5, color: 'var(--text-faint)' }}>
                    <span>Model: {bot.model?.split('/')[1]?.replace(':free', '') || 'Minimax M3'}</span>
                    <span style={{ color: isCurrent ? 'var(--accent)' : 'inherit', fontWeight: isCurrent ? 600 : 400 }}>
                      {isCurrent ? '● Active Focus' : 'Click to Focus'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
