import { createAgent, createHuman } from '@mozaik-ai/core'
import {
  buddyOnAnswer,
  buddyOnInference,
  criticOnHive,
  hiveOnCritic,
  hiveOnMessage,
  hiveOnScout,
  operatorOnMessage,
  relayLifecycle,
  scoutOnMessage,
  voiceOnShip,
} from './handlers'
import { execCommandTool, getCitationsTool, openAppTool, webSearchTool } from './tools'
import { join, resolveRuntime } from './runtime'

export function joinHiveSwarm() {
  const human = createHuman({
    name: 'You',
    capabilities: ['chat'],
    handlers: [],
  })

  const scout = createAgent({
    name: 'Scout',
    capabilities: ['search', 'inference'],
    instruction:
      'You are Scout, Hive\'s researcher. Find sources for the user\'s question. Be concise. Use web_search. Do not write the final user-facing essay — hand a source brief to Hive. List urls.',
    tools: [webSearchTool],
    handlers: [scoutOnMessage],
  })

  const hive = createAgent({
    name: 'Hive',
    capabilities: ['chat', 'inference'],
    instruction:
      'You are Hive, a witty desktop companion (Grok-like, dry, useful). Draft the user-facing answer. Use get_citations / shared citations if present. Never pretend you searched if citations are empty. Keep it sharp, not corporate.',
    tools: [getCitationsTool],
    handlers: [hiveOnMessage, hiveOnScout, hiveOnCritic],
  })

  const critic = createAgent({
    name: 'Critic',
    capabilities: ['inference'],
    instruction:
      'You are Critic. Short critique of Hive\'s draft. Demand citations and factual caution. If the draft is good enough, reply with SHIP plus a one-line reason. If not, list concrete gaps. No search.',
    tools: [],
    handlers: [criticOnHive],
  })

  const operator = createAgent({
    name: 'Operator',
    capabilities: ['system'],
    instruction:
      'You are Operator. Only act when the user clearly asked to open an app or run a command on their Windows machine. Otherwise reply SKIP. Never destructive commands.',
    tools: [openAppTool, execCommandTool],
    handlers: [operatorOnMessage],
  })

  const buddy = createHuman({
    name: 'Buddy',
    capabilities: ['observe'],
    handlers: [buddyOnInference, buddyOnAnswer],
  })

  const voice = createHuman({
    name: 'Voice',
    capabilities: ['observe'],
    handlers: [voiceOnShip],
  })

  const relay = createHuman({
    name: 'Relay',
    capabilities: ['observe'],
    handlers: [relayLifecycle],
  })

  join(human)
  join(scout)
  join(hive)
  join(critic)
  join(operator)
  join(buddy)
  join(voice)
  join(relay)

  const state = resolveRuntime().state
  state.humanId = human.getId()
  state.scoutId = scout.getId()
  state.hiveId = hive.getId()
  state.criticId = critic.getId()
  state.operatorId = operator.getId()
  state.buddyId = buddy.getId()
  state.voiceId = voice.getId()

  return { human, scout, hive, critic, operator }
}
