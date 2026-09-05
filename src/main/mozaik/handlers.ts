import {
  Agent,
  SituationSpecification,
  type SituationContext,
  type SituationHandler,
} from '@mozaik-ai/core'
import { inferenceInputFor, resolveRuntime, runLoop } from './runtime'
import { emitHiveEvent, emitHiveState } from './notify'
import { setBuddyMood } from '../buddy-service'

function answerText(event: { payload: unknown }): string {
  const payload = event.payload as { answer?: { content?: { text?: string } }; message?: string }
  return payload?.answer?.content?.text || payload?.message || ''
}

function pushTranscript(fromId: string, fromName: string, role: string, text: string) {
  const runtime = resolveRuntime()
  runtime.state.transcript.push({ fromId, fromName, role, text, at: Date.now() })
  emitHiveState(runtime.state.snapshot())
}

class WhenOthersSendAMessage extends SituationSpecification {
  isSatisfiedBy({ event, participant }: SituationContext): boolean {
    return event.type === 'message.sent' && event.producerId !== participant.getId()
  }
}

class WhenHiveAnswers extends SituationSpecification {
  isSatisfiedBy({ event, participant }: SituationContext): boolean {
    const state = resolveRuntime().state
    return (
      event.type === 'model.answer' &&
      event.producerId === state.hiveId &&
      participant.getId() === state.criticId
    )
  }
}

class WhenScoutAnswers extends SituationSpecification {
  isSatisfiedBy({ event, participant }: SituationContext): boolean {
    const state = resolveRuntime().state
    return (
      event.type === 'model.answer' &&
      event.producerId === state.scoutId &&
      participant.getId() === state.hiveId
    )
  }
}

class WhenCriticAnswers extends SituationSpecification {
  isSatisfiedBy({ event, participant }: SituationContext): boolean {
    const state = resolveRuntime().state
    return (
      event.type === 'model.answer' &&
      event.producerId === state.criticId &&
      participant.getId() === state.hiveId
    )
  }
}

class WhenUserAsksForMachineAction extends SituationSpecification {
  isSatisfiedBy({ event, participant }: SituationContext): boolean {
    if (event.type !== 'message.sent' || event.producerId === participant.getId()) return false
    const msg = String((event.payload as { message?: string })?.message || '').toLowerCase()
    return /\b(open|launch|run|execute|powershell|cmd\.exe|start |install )\b/.test(msg)
  }
}

class WhenInferenceStarts extends SituationSpecification {
  isSatisfiedBy({ event }: SituationContext): boolean {
    return event.type === 'inference.started' || event.type === 'function_call.started'
  }
}

class WhenAnyoneAnswers extends SituationSpecification {
  isSatisfiedBy({ event }: SituationContext): boolean {
    return event.type === 'model.answer'
  }
}

class WhenLoopLifecycle extends SituationSpecification {
  isSatisfiedBy({ event }: SituationContext): boolean {
    return (
      event.type === 'message.sent' ||
      event.type === 'inference.started' ||
      event.type === 'inference.stream' ||
      event.type === 'inference.completed' ||
      event.type === 'function_call.started' ||
      event.type === 'function_call.completed' ||
      event.type === 'model.answer' ||
      event.type === 'participant.joined'
    )
  }
}

class WhenCriticShips extends SituationSpecification {
  isSatisfiedBy({ event }: SituationContext): boolean {
    const state = resolveRuntime().state
    if (event.type !== 'model.answer' || event.producerId !== state.criticId) return false
    return /\bSHIP\b/i.test(answerText(event))
  }
}

export const scoutOnMessage: SituationHandler = {
  specification: new WhenOthersSendAMessage(),
  processor: {
    apply({ event, participant }) {
      if (!(participant instanceof Agent)) return
      const { message } = event.payload as { message: string }
      const runtime = resolveRuntime()
      runtime.state.mood = 'searching'
      emitHiveState(runtime.state.snapshot())
      runLoop(
        participant.getId(),
        `User question:\n${message}\n\nSearch if needed. Return a short source brief, not the final essay.`,
        inferenceInputFor(participant)
      )
    },
  },
}

export const hiveOnMessage: SituationHandler = {
  specification: new WhenOthersSendAMessage(),
  processor: {
    apply({ event, participant }) {
      if (!(participant instanceof Agent)) return
      const { message } = event.payload as { message: string }
      const runtime = resolveRuntime()
      runtime.state.mood = 'thinking'
      emitHiveState(runtime.state.snapshot())
      const cites = runtime.state.citations
      const citeNote = cites.length
        ? `\nCitations already in shared state:\n${cites.map((c) => `- ${c.title} (${c.url})`).join('\n')}`
        : '\nNo citations in shared state yet. Do not pretend you searched.'
      runLoop(
        participant.getId(),
        `User:\n${message}${citeNote}\n\nWrite the user-facing Hive reply.`,
        inferenceInputFor(participant)
      )
    },
  },
}

export const hiveOnScout: SituationHandler = {
  specification: new WhenScoutAnswers(),
  processor: {
    apply({ event, participant }) {
      if (!(participant instanceof Agent)) return
      const runtime = resolveRuntime()
      if (runtime.state.hiveRevisedFromScout) return
      runtime.state.hiveRevisedFromScout = true
      const brief = answerText(event)
      runLoop(
        participant.getId(),
        `Scout just published this research brief:\n${brief}\n\nRevise your user-facing answer using these sources. Keep Hive's voice.`,
        inferenceInputFor(participant)
      )
    },
  },
}

export const criticOnHive: SituationHandler = {
  specification: new WhenHiveAnswers(),
  processor: {
    apply({ event, participant }) {
      if (!(participant instanceof Agent)) return
      const runtime = resolveRuntime()
      runtime.state.mood = 'arguing'
      emitHiveState(runtime.state.snapshot())
      const draft = answerText(event)
      runLoop(
        participant.getId(),
        `Hive's draft:\n${draft}\n\nCitations in state: ${runtime.state.citations.length}. Critique it. If good enough, reply SHIP plus one-line reason. Otherwise list gaps.`,
        inferenceInputFor(participant)
      )
    },
  },
}

export const hiveOnCritic: SituationHandler = {
  specification: new WhenCriticAnswers(),
  processor: {
    apply({ event, participant }) {
      if (!(participant instanceof Agent)) return
      const runtime = resolveRuntime()
      const critique = answerText(event)
      if (/\bSHIP\b/i.test(critique)) {
        runtime.state.mood = 'done'
        emitHiveState(runtime.state.snapshot())
        return
      }
      if (runtime.state.hiveRevisedFromCritic) return
      runtime.state.hiveRevisedFromCritic = true
      runLoop(
        participant.getId(),
        `Critic rejected the draft:\n${critique}\n\nRevise once. Address the gaps. This is the last pass.`,
        inferenceInputFor(participant)
      )
    },
  },
}

export const operatorOnMessage: SituationHandler = {
  specification: new WhenUserAsksForMachineAction(),
  processor: {
    apply({ event, participant }) {
      if (!(participant instanceof Agent)) return
      const { message } = event.payload as { message: string }
      runLoop(
        participant.getId(),
        `User asked for a machine action:\n${message}\nUse tools only if the request is explicit. Otherwise reply SKIP.`,
        inferenceInputFor(participant)
      )
    },
  },
}

export const buddyOnInference: SituationHandler = {
  specification: new WhenInferenceStarts(),
  processor: {
    apply({ event }) {
      const runtime = resolveRuntime()
      if (event.type === 'function_call.started') runtime.state.mood = 'searching'
      else if (runtime.state.mood === 'idle' || runtime.state.mood === 'done') runtime.state.mood = 'thinking'
      setBuddyMood(runtime.state.mood)
      emitHiveState(runtime.state.snapshot())
    },
  },
}

export const buddyOnAnswer: SituationHandler = {
  specification: new WhenAnyoneAnswers(),
  processor: {
    apply() {
      const runtime = resolveRuntime()
      setBuddyMood(runtime.state.mood)
    },
  },
}

export const relayLifecycle: SituationHandler = {
  specification: new WhenLoopLifecycle(),
  processor: {
    apply({ event }) {
      let producerName = event.producerId
      try {
        producerName = resolveRuntime().getParticipant(event.producerId)?.getManifest().name || event.producerId
      } catch {}
      const text = event.type === 'message.sent' || event.type === 'model.answer' ? answerText(event) : ''
      if (event.type === 'model.answer' && text) {
        const role = producerName === 'You' ? 'user' : 'assistant'
        pushTranscript(event.producerId, producerName, role, text)
      }
      emitHiveEvent({
        type: event.type,
        producerId: event.producerId,
        producerName,
        text,
        occurredAt: Date.now(),
      })
    },
  },
}

export const voiceOnShip: SituationHandler = {
  specification: new WhenCriticShips(),
  processor: {
    apply() {
      const runtime = resolveRuntime()
      if (runtime.state.voiceSpoken) return
      runtime.state.voiceSpoken = true
      runtime.state.mood = 'done'
      setBuddyMood('done')
      const lastHive = [...runtime.state.transcript].reverse().find((t) => t.fromId === runtime.state.hiveId)
      emitHiveEvent({
        type: 'hive.speak',
        producerId: runtime.state.voiceId,
        producerName: 'Voice',
        text: (lastHive?.text || '').slice(0, 400),
        occurredAt: Date.now(),
      })
      emitHiveState(runtime.state.snapshot())
    },
  },
}
