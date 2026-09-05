import { createAgent, createHuman } from '@mozaik-ai/core'
import {
  buddyOnAnswer,
  buddyOnInference,
  criticOnHive,
  hiveOnCritic,
  hiveOnMessage,
  hiveOnScout,
  operatorOnMessage,
  pulseOnMessage,
  relayLifecycle,
  scoutOnMessage,
  sentryOnCall,
  voiceOnShip,
} from './handlers'
import {
  execCommandTool,
  getAdaptionDatasetTool,
  getCitationsTool,
  hiveCloudExecTool,
  hiveCloudStatusTool,
  hiveCloudSwarmTool,
  hiveCloudWriteTool,
  listAdaptionDatasetsTool,
  mozaikCloudStatusTool,
  openAppTool,
  previewAdaptionDatasetTool,
  webSearchTool,
} from './tools'
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
      'You are Scout, Hive\'s researcher. Find sources for the user\'s question. Be concise. Use web_search. If they mention Adaption, datasets, or training data, use list_adaption_datasets. If they mention the cloud computer, use hive_cloud_status / hive_cloud_swarm. Do not write the final essay.',
    tools: [webSearchTool, listAdaptionDatasetsTool, getAdaptionDatasetTool, previewAdaptionDatasetTool, mozaikCloudStatusTool, hiveCloudStatusTool, hiveCloudSwarmTool, hiveCloudWriteTool],
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

  const pulse = createAgent({
    name: 'Pulse',
    capabilities: ['inference'],
    instruction:
      'You are Pulse. You run at the same time as Scout and Hive. List assumptions, risks, and falsifiers. Never the final user-facing essay. No tools.',
    tools: [],
    handlers: [pulseOnMessage],
  })

  const operator = createAgent({
    name: 'Operator',
    capabilities: ['system'],
    instruction:
      'You are Operator. Only act when the user clearly asked to open an app or run a command on their Windows machine or the Hive cloud computer. Otherwise reply SKIP. Never destructive commands.',
    tools: [openAppTool, execCommandTool, hiveCloudExecTool],
    handlers: [operatorOnMessage],
  })

  const sentry = createHuman({
    name: 'Sentry',
    capabilities: ['observe'],
    handlers: [sentryOnCall],
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
  join(pulse)
  join(critic)
  join(operator)
  join(sentry)
  join(buddy)
  join(voice)
  join(relay)

  const state = resolveRuntime().state
  state.humanId = human.getId()
  state.scoutId = scout.getId()
  state.hiveId = hive.getId()
  state.criticId = critic.getId()
  state.operatorId = operator.getId()
  state.pulseId = pulse.getId()
  state.sentryId = sentry.getId()
  state.buddyId = buddy.getId()
  state.voiceId = voice.getId()

  return { human, scout, hive, critic, operator, pulse }
}
