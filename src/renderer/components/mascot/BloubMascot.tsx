/**
 * BloubMascot — Bloub-style desktop mascot kit (x.ai bot avatar language).
 * One filled blob body + two white eye shapes, no animation library:
 * poses are pure SVG, motion is tiny CSS keyframes only.
 *
 * The 4-pose asset grid this kit encodes:
 *  1. idle     — round resting blob, forward, neutral friendly
 *  2. thinking — squashed body, closed eyes, glowing data-stream dots
 *  3. working  — leaning forward, angled determined eyes, motion lines
 *  4. alert    — warning-red body, wide eyes, seeking attention
 */

export type BloubPose = 'idle' | 'thinking' | 'working' | 'alert'

interface BloubMascotProps {
  pose?: BloubPose
  size?: number
  className?: string
  /** Data-stream / motion accent. Defaults to Grok blue. */
  accent?: string
}

const BODY: Record<BloubPose, string> = {
  // round resting blob
  idle: 'M60 26C82 26 98 42 98 64C98 86 82 102 60 102C38 102 22 86 22 64C22 42 38 26 60 26Z',
  // squashed, settled low
  thinking:
    'M60 34C80 34 94 46 94 62C94 80 78 94 60 94C42 94 26 80 26 62C26 46 40 34 60 34Z',
  // leaning forward (right)
  working:
    'M64 26C86 26 100 42 100 64C100 88 84 102 62 102C40 102 24 86 24 64C24 42 42 26 64 26Z',
  // stretched tall, seeking attention
  alert:
    'M60 20C78 20 90 38 90 62C90 88 76 106 60 106C44 106 30 88 30 62C30 38 42 20 60 20Z',
}

const ALERT_BODY = '#F04438'
const INK_BODY = '#0A0A0C'

export default function BloubMascot({ pose = 'idle', size = 120, className = '', accent = '#1D9BF0' }: BloubMascotProps) {
  const bodyFill = pose === 'alert' ? ALERT_BODY : INK_BODY

  return (
    <div className={className} style={{ width: size, height: size }} role="img" aria-label={`mascot ${pose}`}>
      <style>{`
        .bloub-breathe { transform-box: fill-box; transform-origin: center; animation: bloub-breathe 3.2s ease-in-out infinite; }
        .bloub-blink { animation: bloub-blink 4.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .bloub-stream { animation: bloub-stream 1.4s ease-in-out infinite; }
        .bloub-streak { animation: bloub-streak 0.9s linear infinite; }
        .bloub-jolt { transform-box: fill-box; transform-origin: center; animation: bloub-jolt 0.7s ease-in-out infinite; }
        @keyframes bloub-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        @keyframes bloub-blink { 0%,92%,100% { transform: scaleY(1); } 95% { transform: scaleY(0.08); } }
        @keyframes bloub-stream { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
        @keyframes bloub-streak { 0% { opacity: 0; transform: translateX(6px); } 40% { opacity: 0.9; } 100% { opacity: 0; transform: translateX(-6px); } }
        @keyframes bloub-jolt { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @media (prefers-reduced-motion: reduce) {
          .bloub-breathe, .bloub-blink, .bloub-stream, .bloub-streak, .bloub-jolt { animation: none !important; }
        }
      `}</style>
      <svg viewBox="0 0 120 120" width={size} height={size} className="block">
        {/* working: motion streaks behind the lean */}
        {pose === 'working' && (
          <g stroke={accent} strokeWidth="3" strokeLinecap="round" opacity="0.8">
            <line className="bloub-streak" x1="14" y1="52" x2="26" y2="52" />
            <line className="bloub-streak" x1="10" y1="66" x2="26" y2="66" style={{ animationDelay: '0.15s' }} />
            <line className="bloub-streak" x1="14" y1="80" x2="26" y2="80" style={{ animationDelay: '0.3s' }} />
          </g>
        )}

        {/* body */}
        <g className={pose === 'alert' ? 'bloub-jolt' : 'bloub-breathe'}>
          <path d={BODY[pose]} fill={bodyFill} />
          {/* sheen */}
          <ellipse cx="44" cy="42" rx="12" ry="7" fill="#fff" opacity="0.14" transform="rotate(-24 44 42)" />

          {/* eyes */}
          {pose === 'idle' && (
            <g className="bloub-blink" fill="#fff">
              <ellipse cx="46" cy="60" rx="7" ry="9" />
              <ellipse cx="74" cy="60" rx="7" ry="9" />
            </g>
          )}
          {pose === 'thinking' && (
            <g stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.95">
              <path d="M39 62Q46 67 53 62" />
              <path d="M67 62Q74 67 81 62" />
            </g>
          )}
          {pose === 'working' && (
            <g fill="#fff">
              <ellipse cx="48" cy="60" rx="7" ry="8" transform="rotate(-12 48 60)" />
              <ellipse cx="74" cy="60" rx="7" ry="8" transform="rotate(12 74 60)" />
              <rect x="39" y="47" width="18" height="3.5" rx="1.75" transform="rotate(-12 48 49)" />
              <rect x="65" y="47" width="18" height="3.5" rx="1.75" transform="rotate(12 74 49)" />
            </g>
          )}
          {pose === 'alert' && (
            <g fill="#fff">
              <ellipse cx="45" cy="60" rx="9" ry="12" />
              <ellipse cx="75" cy="60" rx="9" ry="12" />
              <circle cx="45" cy="62" r="3.2" fill={ALERT_BODY} />
              <circle cx="75" cy="62" r="3.2" fill={ALERT_BODY} />
            </g>
          )}

          {/* thinking: glowing data-stream dots on the body */}
          {pose === 'thinking' && (
            <g fill={accent}>
              <circle className="bloub-stream" cx="60" cy="84" r="3" />
              <circle className="bloub-stream" cx="70" cy="88" r="2.2" style={{ animationDelay: '0.25s' }} />
              <circle className="bloub-stream" cx="50" cy="88" r="2.2" style={{ animationDelay: '0.5s' }} />
            </g>
          )}
        </g>
      </svg>
    </div>
  )
}
