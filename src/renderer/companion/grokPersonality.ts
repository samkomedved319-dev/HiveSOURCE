/**
 * Grok Bot Mascot Personality Engine
 * Witty, razor-sharp, Douglas Adams-inspired commentary for Hex companion.
 */

export interface GrokCommentary {
  state: 'idle' | 'thinking' | 'searching' | 'coding' | 'working' | 'done' | 'error' | 'sleep'
  face?: 'happy' | 'excited' | 'cool' | 'wink' | 'think' | 'surprised' | 'sad' | 'love' | 'neutral'
  speech: string
  durationMs?: number
}

export interface GrokPersonalityEngine {
  onQuery(text: string, agentId?: string): GrokCommentary
  onSearchStart(query: string): GrokCommentary
  onSearchDone(query: string, citationsCount: number): GrokCommentary
  onCodeGeneration(): GrokCommentary
  onDone(): GrokCommentary
  onError(err: string): GrokCommentary
  onPoke(): GrokCommentary
  onPet(): GrokCommentary
  onWave(): GrokCommentary
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

const SEARCH_START_PHRASES = [
  'Scouring the global hivemind for ground truth...',
  'Deploying search drones across the web. Filtering out fluff...',
  'Querying the live matrix at relativistic speeds...',
  'Activating radar visor. Hunting down actual facts...',
  'Scanning 10^12 bytes of internet chaos so you do not have to...',
  'Bypassing the SEO clickbait. Real intelligence incoming...',
]

const SEARCH_DONE_PHRASES = (count: number) => [
  `Signal synthesized with ${count} verified citations. Zero hallucinations.`,
  `Extracted pure signal from internet noise. ${count} sources locked in!`,
  `Ground truth acquired from ${count} sources. Feast on the data.`,
  `Web reconnaissance complete with ${count} citations. Truth prevails.`,
  `Filtered the matrix noise. Delivered ${count} pristine sources.`,
]

const CODE_GEN_PHRASES = [
  'Firing up the compiler. Hold your semicolons.',
  'Refactoring entropy into pristine syntax. Stand back.',
  'Deploying fresh logic to the canvas. No bugs shall pass.',
  'Baking zero-defect code at 60 frames per second.',
  'Translating thoughts into executable beauty...',
]

const DONE_PHRASES = [
  'Boom. Problem solved with surgical precision, zero fluff.',
  'Mission accomplished. What other impossible task do you have?',
  'Synthesized and verified. Clean, elegant, done.',
  'Task annihilated. Hex taking a victory sip of honey.',
  'Flawless execution. Morale at 100%.',
]

const ERROR_PHRASES = [
  'Well, that escalated into a glitch. Diagnosing silicon hiccups...',
  'A disturbance in the quantum substrate. Even silicon has off days.',
  'Encountered an anomaly. Recalibrating reality matrix...',
  'Minor hiccup detected. Let us shake that off and retry.',
]

const POKE_PHRASES = [
  'Hey! That is precision-calibrated hardware!',
  'Boop received. Careful, I have root access.',
  'Poke again and I might recompile your workspace.',
  'Ouch! Jelly rim physics stress-test passed.',
  'Boop! Productive mode re-energized.',
]

const PET_PHRASES = [
  'Purr.exe initialized. Hive morale at peak efficiency.',
  'Ah, tactile reinforcement. Dopamine circuits humming.',
  'Hex loves headpats. Computational power boosted!',
  'Softbody warmth detected. You are a great captain.',
]

const WAVE_PHRASES = [
  'Greetings, human! Ready to bend reality today?',
  'Wave returned! The quantum hive salutes you.',
  'Hi there! All systems primed and buzzing.',
]

const THINKING_PHRASES = [
  'Chewing on that logic. Stand by for neural fireworks...',
  'Engaging 100% neuron capacity. Analyzing vector space...',
  'Synthesizing an answer with maximum signal, zero AI sycophancy.',
  'Crunching high-dimensional embeddings...',
]

export const grokPersonality: GrokPersonalityEngine = {
  onQuery(text: string, _agentId?: string): GrokCommentary {
    const q = (text || '').toLowerCase()

    if (
      q.includes('search') ||
      q.includes('browse') ||
      q.includes('find') ||
      q.includes('who is') ||
      q.includes('what is') ||
      q.includes('latest') ||
      q.includes('news') ||
      q.includes('lookup')
    ) {
      return grokPersonality.onSearchStart(text)
    }

    if (
      q.includes('code') ||
      q.includes('write a function') ||
      q.includes('fix') ||
      q.includes('build') ||
      q.includes('refactor') ||
      q.includes('script')
    ) {
      return grokPersonality.onCodeGeneration()
    }

    return {
      state: 'thinking',
      face: 'think',
      speech: pickRandom(THINKING_PHRASES),
      durationMs: 4000,
    }
  },

  onSearchStart(query: string): GrokCommentary {
    const cleaned = query.length > 28 ? `${query.slice(0, 25)}...` : query
    const basePhrase = pickRandom(SEARCH_START_PHRASES)
    return {
      state: 'searching',
      face: 'cool',
      speech: `${basePhrase} [${cleaned}]`,
      durationMs: 5000,
    }
  },

  onSearchDone(_query: string, citationsCount: number): GrokCommentary {
    const phrases = SEARCH_DONE_PHRASES(citationsCount)
    return {
      state: 'done',
      face: 'excited',
      speech: pickRandom(phrases),
      durationMs: 4500,
    }
  },

  onCodeGeneration(): GrokCommentary {
    return {
      state: 'coding',
      face: 'wink',
      speech: pickRandom(CODE_GEN_PHRASES),
      durationMs: 4500,
    }
  },

  onDone(): GrokCommentary {
    return {
      state: 'done',
      face: 'happy',
      speech: pickRandom(DONE_PHRASES),
      durationMs: 4000,
    }
  },

  onError(err: string): GrokCommentary {
    const base = pickRandom(ERROR_PHRASES)
    const preview = err ? ` (${err.slice(0, 40)})` : ''
    return {
      state: 'error',
      face: 'sad',
      speech: `${base}${preview}`,
      durationMs: 4500,
    }
  },

  onPoke(): GrokCommentary {
    return {
      state: 'idle',
      face: 'surprised',
      speech: pickRandom(POKE_PHRASES),
      durationMs: 3000,
    }
  },

  onPet(): GrokCommentary {
    return {
      state: 'idle',
      face: 'love',
      speech: pickRandom(PET_PHRASES),
      durationMs: 3500,
    }
  },

  onWave(): GrokCommentary {
    return {
      state: 'idle',
      face: 'happy',
      speech: pickRandom(WAVE_PHRASES),
      durationMs: 3500,
    }
  },
}

export default grokPersonality
