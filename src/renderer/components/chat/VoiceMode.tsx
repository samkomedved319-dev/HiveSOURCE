import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react'

interface VoiceModeProps {
  onSendMessage: (text: string) => void
  isSpeaking: boolean
}

export default function VoiceMode({ onSendMessage, isSpeaking }: VoiceModeProps) {
  const [mode, setMode] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle')
  const [transcript, setTranscript] = useState('')
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const liveRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setSupported(false); return }
    synthRef.current = window.speechSynthesis
  }, [])

  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      const synth = synthRef.current
      if (!synth) { resolve(); return }
      synth.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = 1
      utter.pitch = 1
      const voices = synth.getVoices()
      const en = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'))
      if (en) utter.voice = en
      utter.onend = () => resolve()
      utter.onerror = () => resolve()
      synth.speak(utter)
    })
  }, [])

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let final = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) final += t
        else interim += t
      }
      setTranscript(final || interim)
      if (final) {
        setMode('processing')
        onSendMessage(final)
      }
    }

    recognition.onerror = () => setMode('idle')
    recognition.onend = () => { if (mode === 'listening') setMode('idle') }

    recognitionRef.current = recognition
    recognition.start()
    setMode('listening')
    setTranscript('')
  }, [mode, onSendMessage])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    synthRef.current?.cancel()
    setMode('idle')
    setTranscript('')
  }, [])

  const toggle = () => {
    if (mode === 'idle') startListening()
    else stopListening()
  }

  const isActive = mode !== 'idle'

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        className={`relative w-10 h-10 rounded-full grid place-items-center transition-all ${
          isActive
            ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
        }`}
        title={isActive ? 'Stop voice' : 'Start voice call'}
      >
        {isActive ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}

        {/* Pulse rings when active */}
        {isActive && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500/30 voice-ring" />
            <span className="absolute inset-0 rounded-full bg-red-500/20 voice-pulse" />
          </>
        )}
      </button>

      {/* Live transcript */}
      {isActive && (
        <div className="flex items-center gap-2 text-xs text-zinc-400 max-w-[200px]">
          {mode === 'listening' && (
            <>
              <Mic className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">{transcript || 'Listening...'}</span>
            </>
          )}
          {mode === 'processing' && (
            <>
              <div className="w-3 h-3 grid place-items-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
              </div>
              <span className="truncate">{transcript || 'Thinking...'}</span>
            </>
          )}
          {mode === 'speaking' && (
            <>
              <Volume2 className="w-3 h-3 text-violet-400 shrink-0" />
              <span className="truncate">Speaking...</span>
            </>
          )}
        </div>
      )}

      {!supported && (
        <span className="text-[10px] text-zinc-600">Voice not supported</span>
      )}
    </div>
  )
}
