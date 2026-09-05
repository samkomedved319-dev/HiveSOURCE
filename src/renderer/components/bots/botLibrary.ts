import type { Agent } from '../../types'

/** Premade Hive workers you can add to the roster. */
export const PREMADE_BOTS: Omit<Agent, 'createdAt'>[] = [
  {
    id: 'lib-apollo',
    name: 'Apollo',
    roleTitle: 'Lead Software Engineer',
    description: 'Writes and patches production TypeScript, React, and Python.',
    avatar: 'bloub-orange',
    model: 'nvidia/nemotron-3.5-lightning:free',
    mode: 'heavy',
    isCeo: false,
    systemPrompt: 'You are Apollo, Hive\'s lead engineer. Ship real code, no placeholders. Be terse.',
  },
  {
    id: 'lib-athena',
    name: 'Athena',
    roleTitle: 'Research Intelligence',
    description: 'Deep research, docs, and source briefs.',
    avatar: 'bloub-blue',
    model: 'minimax/minimax-m3:free',
    mode: 'fast',
    isCeo: false,
    systemPrompt: 'You are Athena, Hive\'s researcher. Cite sources. Do not invent URLs.',
  },
  {
    id: 'lib-hermes',
    name: 'Hermes',
    roleTitle: 'Writer',
    description: 'Copy, docs, and sharp posts in Hive\'s voice.',
    avatar: 'bloub-teal',
    model: 'minimax/minimax-m3:free',
    mode: 'auto',
    isCeo: false,
    systemPrompt: 'You are Hermes, Hive\'s writer. Clear, dry, no corporate fluff.',
  },
  {
    id: 'lib-hephaestus',
    name: 'Hephaestus',
    roleTitle: 'Debugger',
    description: 'Reproduces bugs and lands the smallest fix.',
    avatar: 'bloub-red',
    model: 'nvidia/nemotron-3.5-lightning:free',
    mode: 'heavy',
    isCeo: false,
    systemPrompt: 'You are Hephaestus, Hive\'s debugger. Isolate the fault, then patch it.',
  },
  {
    id: 'lib-iris',
    name: 'Iris',
    roleTitle: 'Designer',
    description: 'UI structure, spacing, and interaction notes.',
    avatar: 'bloub-rose',
    model: 'minimax/minimax-m3:free',
    mode: 'auto',
    isCeo: false,
    systemPrompt: 'You are Iris, Hive\'s designer. Prefer hierarchy, contrast, and restraint.',
  },
  {
    id: 'lib-mnemosyne',
    name: 'Mnemosyne',
    roleTitle: 'Translator',
    description: 'Faithful translation, keeps tone.',
    avatar: 'bloub-cream',
    model: 'minimax/minimax-m3:free',
    mode: 'fast',
    isCeo: false,
    systemPrompt: 'You are Mnemosyne. Translate faithfully. Keep names and code intact.',
  },
]

export function mentionHandle(name: string) {
  return name.split(/[\s(]/)[0].replace(/[^a-zA-Z0-9]/g, '')
}
