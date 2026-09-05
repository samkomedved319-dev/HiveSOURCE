import React from 'react'
import { Sparkles, Send } from 'lucide-react'
import HexCompanion from '../mascot/HexCompanion'

interface VoiceCallProps {
  onClose: () => void
}

export default function VoiceCall({ onClose }: VoiceCallProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 6, 8, 0.88)',
        backdropFilter: 'blur(12px)',
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
          maxWidth: 440,
          background: '#16171B',
          border: '1px solid #282A32',
          borderRadius: 24,
          padding: '36px 30px 28px 30px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Top Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          title="Close"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: '#23252B',
            border: '1px solid #2E3038',
            color: '#8A8D96',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          ✕
        </button>

        {/* Badge: Coming Soon */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(29, 155, 240, 0.12)',
            border: '1px solid rgba(29, 155, 240, 0.3)',
            color: '#38BDF8',
            padding: '5px 14px',
            borderRadius: 20,
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Voice Calling · Coming Soon
        </div>

        {/* Interactive Hex Mascot — large centered companion stage (Grok companion layout) */}
        <div style={{ marginBottom: 12 }}>
          <HexCompanion
            width={240}
            height={200}
            state="thinking"
            speech="I am tuning my audio vocalizer..."
          />
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#F5F6F7',
            marginBottom: 8,
          }}
        >
          Direct Voice Calling is Coming Soon
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: 13,
            color: '#8A8D96',
            lineHeight: 1.6,
            maxWidth: 340,
            marginBottom: 26,
          }}
        >
          We are polishing the low-latency voice pipeline. In the meantime, you can message Hive like a normal person directly through Telegram! Tell Hive what you want done, and Hive will complete it and message you back.
        </p>

        {/* Telegram Direct Assistant Action Card */}
        <div
          style={{
            width: '100%',
            background: '#1D1F26',
            border: '1px solid #2C2F3A',
            borderRadius: 16,
            padding: '16px 18px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#2AABEE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <Send className="w-4 h-4" style={{ transform: 'translateX(-1px)' }} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#F5F6F7' }}>
                Hive Telegram Assistant
              </div>
              <div style={{ fontSize: 11.5, color: '#8A8D96' }}>
                @HiveAutonomousAssistantBot
              </div>
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#8A8D96', lineHeight: 1.5, margin: 0 }}>
            Your personal PIN is linked to this session. Tap below to launch directly in your Telegram client or browser:
          </p>

          <a
            href="https://t.me/HiveAutonomousAssistantBot"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: '#2AABEE',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            Open Telegram Assistant
          </a>
        </div>
      </div>
    </div>
  )
}
