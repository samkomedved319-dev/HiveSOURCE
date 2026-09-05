import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import packageJson from '../../../../package.json'

// Standard Vite asset resolution for high-res cyber-bee logo
const hiveLogo = new URL('../../assets/hive_logo.jpg', import.meta.url).href

export interface LaunchScreenProps {
  onComplete: () => void
  minDurationMs?: number
}

export default function LaunchScreen({ onComplete, minDurationMs = 2400 }: LaunchScreenProps) {
  // Read package.json version with fallback and dynamic electron override
  const [version, setVersion] = useState<string>(`v${packageJson.version || '1.0.0'}`)
  const [typedCommand, setTypedCommand] = useState('')
  const [isTypingComplete, setIsTypingComplete] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState(-1)
  const [isReady, setIsReady] = useState(false)
  const [hasExited, setHasExited] = useState(false)

  const startTimeRef = useRef<number>(Date.now())
  const fullCommand = 'npm run HIVE'

  const STATUS_STEPS: Array<{ label: string; tag: string }> = [
    { label: 'Initializing Hive Core & Swarm Engine runtime', tag: 'OK' },
    { label: 'Mounting Grok Mascot & Canvas Physics Matrix', tag: 'OK' },
    { label: 'Synthesizing Neural Matrix & Live Search Bridge', tag: 'OK' },
    { label: 'Calibrating Swarm: Hive CEO 👑, Apollo ⚡, Athena 🔬', tag: 'OK' },
    { label: 'HIVE READY — Swarm intelligence online', tag: 'READY' },
  ]

  // Safe dismiss callback respecting minDurationMs unless explicitly triggered
  const handleFinish = useCallback(() => {
    if (hasExited) return
    setHasExited(true)
    onComplete()
  }, [hasExited, onComplete])

  // Try reading version from electron IPC if available
  useEffect(() => {
    const fetchElectronVersion = async () => {
      try {
        const electronAPI = (window as unknown as { electronAPI?: { app?: { getVersion?: () => Promise<string> } } })?.electronAPI
        if (electronAPI?.app?.getVersion) {
          const electronVer = await electronAPI.app.getVersion()
          if (electronVer) {
            setVersion(`v${electronVer}`)
          }
        }
      } catch {
        // Fallback to packageJson version already initialized
      }
    }
    fetchElectronVersion()
  }, [])

  // Realistic typewriter effect for "npm run HIVE"
  useEffect(() => {
    let charIdx = 0
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const typeNextChar = () => {
      if (charIdx <= fullCommand.length) {
        setTypedCommand(fullCommand.slice(0, charIdx))
        charIdx++
        if (charIdx <= fullCommand.length) {
          // Pacing: slightly jitter between 45ms and 75ms for realistic cadence
          const delay = 45 + Math.floor(Math.random() * 30)
          timeoutId = setTimeout(typeNextChar, delay)
        } else {
          // Finished typing command
          timeoutId = setTimeout(() => {
            setIsTypingComplete(true)
            setActiveStepIndex(0)
          }, 180)
        }
      }
    }

    // Initial slight pause before typing begins
    timeoutId = setTimeout(typeNextChar, 350)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [fullCommand])

  // Sequential initialization lines after command finishes
  useEffect(() => {
    if (!isTypingComplete || activeStepIndex < 0) return

    if (activeStepIndex < STATUS_STEPS.length) {
      const stepTimer = setTimeout(() => {
        setActiveStepIndex((prev) => prev + 1)
      }, 240)
      return () => clearTimeout(stepTimer)
    } else {
      // All steps reached
      setIsReady(true)
      const elapsed = Date.now() - startTimeRef.current
      const remainingMs = Math.max(minDurationMs - elapsed, 450)
      const exitTimer = setTimeout(() => {
        handleFinish()
      }, remainingMs)
      return () => clearTimeout(exitTimer)
    }
  }, [isTypingComplete, activeStepIndex, STATUS_STEPS.length, minDurationMs, handleFinish])

  // Keyboard shortcut listener: any key to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key === 'Tab') {
        handleFinish()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleFinish])

  // Progress percentage calculation
  const progressPercent = Math.min(
    100,
    Math.round(
      (Math.max(0, activeStepIndex) / STATUS_STEPS.length) * 85 +
        (isReady ? 15 : (typedCommand.length / fullCommand.length) * 10)
    )
  )

  return (
    <motion.div
      key="hive-launch-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.03,
        filter: 'blur(14px)',
        transition: {
          duration: 0.65,
          ease: [0.16, 0.8, 0.24, 1],
        },
      }}
      className="fixed inset-0 z-[9999] bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-6 select-none overflow-hidden"
      onClick={handleFinish}
      role="dialog"
      aria-label="Hive Application Launch Screen"
    >
      {/* Background Honeycomb Tech Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#f59e0b 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Cyber Honey Radial Aura / Atmosphere */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute w-[320px] h-[320px] rounded-full bg-yellow-400/15 blur-[90px] pointer-events-none" />

      {/* Center Cyber-Bee Logo Container with Breathing Pulse Aura */}
      <div className="relative mb-5 flex items-center justify-center">
        {/* Rotating Outer Hexagon Circuit Border */}
        <motion.svg
          className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] pointer-events-none text-amber-500/35"
          animate={{ rotate: 360 }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
          viewBox="0 0 160 160"
        >
          <polygon
            points="80,6 146,43 146,117 80,154 14,117 14,43"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="14 8 4 8"
          />
        </motion.svg>

        {/* Counter-Rotating Inner Accent Ring */}
        <motion.svg
          className="absolute -inset-1.5 w-[calc(100%+12px)] h-[calc(100%+12px)] pointer-events-none text-amber-400/25"
          animate={{ rotate: -360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          viewBox="0 0 140 140"
        >
          <circle
            cx="70"
            cy="70"
            r="64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 16"
          />
        </motion.svg>

        {/* Pulsing Breathing Card */}
        <motion.div
          animate={{
            scale: [1, 1.03, 1],
            boxShadow: [
              '0 0 25px rgba(245, 158, 11, 0.3)',
              '0 0 45px rgba(245, 158, 11, 0.55)',
              '0 0 25px rgba(245, 158, 11, 0.3)',
            ],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-amber-400/50 bg-black/90 flex items-center justify-center"
        >
          <img
            src={hiveLogo}
            alt="ProjectHive Cyber-Bee Logo"
            className="w-full h-full object-cover"
          />
          {/* Subtle Cyber Gradient Sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-yellow-300/10 pointer-events-none" />
        </motion.div>
      </div>

      {/* Brand Title & Cyber Version Badge */}
      <div className="flex flex-col items-center gap-1.5 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-wider text-white font-mono flex items-center gap-2">
            <span>PROJECT</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200">
              HIVE
            </span>
          </h1>

          {/* Prominent Dynamic Version Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span data-testid="launch-version-badge">{version}</span>
          </div>
        </div>

        <p className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
          Autonomous Swarm AI Workspace & Companion
        </p>
      </div>

      {/* Stylized Cyber Terminal Container */}
      <div
        className="w-full max-w-lg bg-[#0d0e13]/95 border border-zinc-800/90 rounded-xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Window Header Bar */}
        <div className="h-8 bg-[#13141b] border-b border-zinc-800/90 px-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
          </div>
          <span className="text-[11px] font-mono text-zinc-400 font-medium">
            hive-core ~ bash (80x24)
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ONLINE</span>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-4 font-mono text-xs text-zinc-300 min-h-[190px] flex flex-col justify-between">
          <div className="space-y-2">
            {/* Shell Command Prompt Line */}
            <div className="flex items-center gap-2 text-zinc-100 flex-wrap">
              <span className="text-emerald-400 font-semibold">samko@hive-os</span>
              <span className="text-zinc-500">:</span>
              <span className="text-amber-400 font-medium">~/project-hive</span>
              <span className="text-zinc-500">$</span>
              <span
                data-testid="launch-terminal-command"
                className="text-white font-bold tracking-wide"
              >
                {typedCommand}
              </span>
              {typedCommand.length < fullCommand.length && (
                <span className="inline-block w-2 h-4 bg-amber-400 animate-pulse" />
              )}
            </div>

            {/* Sequential Initialization Logs */}
            <div className="space-y-1.5 pt-1">
              {STATUS_STEPS.slice(0, Math.max(0, activeStepIndex)).map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center justify-between text-[11px] text-zinc-300"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 font-mono">&gt; [HIVE-CLI]</span>
                    <span>{step.label}</span>
                  </div>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                      step.tag === 'READY'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold animate-pulse'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    [{step.tag}]
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom Progress Bar & State Indicator */}
          <div className="pt-4 border-t border-zinc-800/80 mt-3">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
              <span>{isReady ? 'Neural Matrix Synthesized' : 'Booting Swarm Subsystems...'}</span>
              <span className="font-mono text-amber-400 font-semibold">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ ease: 'easeOut', duration: 0.2 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dismiss / Skip Prompt */}
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        whileHover={{ opacity: 1 }}
        onClick={handleFinish}
        className="mt-6 text-[11px] font-mono text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <span>Press any key or click to enter workspace</span>
        <span className="text-amber-400 font-bold">→</span>
      </motion.button>
    </motion.div>
  )
}
