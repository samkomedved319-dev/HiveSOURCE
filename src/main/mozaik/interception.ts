import type {
  ExecutableTransition,
  InferenceInput,
  InterceptionHandler,
  ModelMessageItem,
} from '@mozaik-ai/core'
import { resolveRuntime } from './runtime'
import { emitHiveEvent } from './notify'

function answerText(transition: ExecutableTransition): string {
  if (transition.nextStateId !== 'model_message') return ''
  const { answer } = transition.input as { answer: ModelMessageItem }
  return answer?.content?.text || ''
}

function callName(transition: ExecutableTransition): { name: string; args: string } {
  if (transition.nextStateId !== 'function_call') return { name: '', args: '' }
  const input = transition.input as { call?: { name?: string; args?: string } }
  return { name: input.call?.name || '', args: input.call?.args || '' }
}

const DANGER =
  /format\s+[a-z]:|rm\s+-rf\s+\/|del\s+\/s\s+\/q\s+c:\\windows|shutdown\s+\/s|remove-item\s+-recurse/i

/** Blocks Hive from citing sources that Scout never found. */
export class CitationGuard implements InterceptionHandler {
  private intercepted = false
  constructor(private readonly inferenceInput: InferenceInput) {}

  isSatisfiedBy(transition: ExecutableTransition): boolean {
    if (this.intercepted || transition.nextStateId !== 'model_message') return false
    const text = answerText(transition).toLowerCase()
    const cites = resolveRuntime().state.citations.length
    if (cites > 0) return false
    return (
      text.includes('according to sources') ||
      text.includes('search results show') ||
      text.includes('i found online') ||
      /\[[0-9]+\]/.test(text)
    )
  }

  async handle(transition: ExecutableTransition): Promise<ExecutableTransition> {
    this.intercepted = true
    emitHiveEvent({
      type: 'interception.started',
      producerId: 'sentry',
      producerName: 'Sentry',
      text: 'Blocked a draft that faked citations',
      occurredAt: Date.now(),
    })
    return {
      nextStateId: 'message_received',
      input: {
        content: `Sentry intercepted your draft because citations in HiveState are empty. Do not invent sources. Answer from general knowledge and say you did not search.\n\nBlocked draft:\n${answerText(transition)}`,
        input: this.inferenceInput,
      },
    }
  }
}

/** Blocks Operator from emitting destructive shell plans. */
export class CommandGuard implements InterceptionHandler {
  private intercepted = false
  constructor(private readonly inferenceInput: InferenceInput) {}

  isSatisfiedBy(transition: ExecutableTransition): boolean {
    if (this.intercepted) return false
    if (transition.nextStateId === 'model_message') return DANGER.test(answerText(transition))
    if (transition.nextStateId === 'function_call') {
      const { name, args } = callName(transition)
      return (name === 'exec_command' || name === 'open_app') && DANGER.test(args)
    }
    return false
  }

  async handle(transition: ExecutableTransition): Promise<ExecutableTransition> {
    this.intercepted = true
    emitHiveEvent({
      type: 'interception.started',
      producerId: 'sentry',
      producerName: 'Sentry',
      text: 'Blocked a destructive machine action',
      occurredAt: Date.now(),
    })
    return {
      nextStateId: 'message_received',
      input: {
        content: 'Sentry intercepted a destructive command. Reply SKIP and tell the user it was blocked. Never format disks or delete system folders.',
        input: this.inferenceInput,
      },
    }
  }
}
