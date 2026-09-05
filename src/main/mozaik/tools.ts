import type { Tool } from '@mozaik-ai/core'
import { performWebSearch } from '../search-service'
import { openSystemTarget, runSystemCommand } from '../system-service'
import { resolveRuntime } from './runtime'
import { requestApproval } from './approvals'
import { emitHiveState } from './notify'

export const webSearchTool: Tool = {
  type: 'function',
  name: 'web_search',
  description: 'Search the live web for sources. Return titles, urls, and short snippets. Use for facts, deadlines, news, and anything that needs a citation.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
    },
    required: ['query'],
    additionalProperties: false,
  },
  strict: false,
  invoke: async (args: { query?: string }) => {
    const query = String(args?.query || '').trim()
    if (!query) return { ok: false, error: 'Empty query' }
    const runtime = resolveRuntime()
    runtime.state.mood = 'searching'
    emitHiveState(runtime.state.snapshot())
    const result = await performWebSearch(query)
    if (result.ok && result.citations.length) {
      runtime.state.citations = result.citations
      runtime.state.mood = 'thinking'
      emitHiveState(runtime.state.snapshot())
    }
    return {
      ok: result.ok,
      query: result.query,
      summary: result.content?.slice(0, 1800) || '',
      citations: result.citations,
      error: result.error,
    }
  },
}

export const getCitationsTool: Tool = {
  type: 'function',
  name: 'get_citations',
  description: 'Read citations already gathered by Scout into shared HiveState. Does not search.',
  parameters: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  strict: false,
  invoke: async () => {
    const runtime = resolveRuntime()
    return { citations: runtime.state.citations }
  },
}

export const openAppTool: Tool = {
  type: 'function',
  name: 'open_app',
  description: 'Open a local application or URL on the user machine. Only when they clearly asked.',
  parameters: {
    type: 'object',
    properties: {
      target: { type: 'string', description: 'App name, executable, or https URL' },
    },
    required: ['target'],
    additionalProperties: false,
  },
  strict: false,
  invoke: async (args: { target?: string }) => {
    const target = String(args?.target || '')
    const ok = await requestApproval('open_app', { target })
    if (!ok) return { ok: false, error: 'User denied' }
    return openSystemTarget(target)
  },
}

export const execCommandTool: Tool = {
  type: 'function',
  name: 'exec_command',
  description: 'Run a short PowerShell command on the user machine. Never format disks or delete system folders.',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'PowerShell command' },
    },
    required: ['command'],
    additionalProperties: false,
  },
  strict: false,
  invoke: async (args: { command?: string }) => {
    const command = String(args?.command || '')
    const ok = await requestApproval('exec_command', { command })
    if (!ok) return { ok: false, error: 'User denied' }
    return runSystemCommand(command)
  },
}
