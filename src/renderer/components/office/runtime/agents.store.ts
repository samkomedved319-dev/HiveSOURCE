import { create } from 'zustand';
import {
  getAgentChatAnchor,
  getAgentSpawnAnchor,
  getLivingRelaxWalkTarget,
  getZoneWaypoints,
  isNearChatAnchor,
  nearestZoneForPosition,
  nearestZoneWaypointIndex,
} from '@/components/office/config/agentZones.config';
import {
  COFFEE_BAR_MAX_SERVING,
  getCoffeeBarQueueAnchor,
  getCoffeeBarQueueWalkTarget,
  isAtCoffeeBarQueueSlot,
} from '@/components/office/config/coffeeBarQueue';
import { SCENE_CONFIG } from '@/components/office/config/agents.config';
import type { AppLocale } from '@/components/office/stubs/i18nTypes';
import type { AgentDefinition, AgentRuntimeState, AgentStatus } from '@/components/office/types/agent';
import { applyLocaleToAgents } from '@/components/office/stubs/applyAgentLocale';
import { readLocale } from '@/components/office/stubs/localeStorage';
import type { ChatAnchor } from '@/components/office/types/scene';
import {
  distance2D,
  lerpPosition,
  lerpAngle,
  computeWalkRotation,
  pickNextWaypointIndex,
  randomIdleDuration,
  rotationTowards,
} from '@/components/office/utils/movement';
import type { AgentChatCommand } from '@/components/office/stubs/chatAgentCommands';
import {
  moveWithAgentAwareness,
  findChatApproachPosition,
  nudgeAlongPath,
  resolveAllAgentOverlaps,
  resolveWalkTarget,
  sanitizeAgentPosition,
  sanitizeWalkPosition,
  type AgentCircle,
} from '@/components/office/utils/collision';

interface AgentsStore {
  baseDefinitions: AgentDefinition[];
  definitions: AgentDefinition[];
  runtime: Record<string, AgentRuntimeState>;
  idleTimers: Record<string, number>;
  setDefinitions: (definitions: AgentDefinition[]) => void;
  applyLocale: (locale: AppLocale) => void;
  initialize: () => void;
  tick: (delta: number) => void;
  beginChatSession: (id: string) => void;
  endChatSession: (id: string) => void;
  dispatchAgentCommand: (id: string, command: AgentChatCommand) => boolean;
  setAgentStatus: (id: string, status: AgentStatus) => void;
  setAgentModelId: (id: string, modelId: string) => void;
  getRuntime: (id: string) => AgentRuntimeState | undefined;
}

const stuckSecondsByAgent = new Map<string, number>();
const STUCK_THRESHOLD = 0.24;
const STUCK_GIVE_UP = 0.62;
const WALK_ARRIVAL_RADIUS = 0.3;
const MOVE_EPSILON = 0.0035;
const MIN_WALK_SPEED = 0.1;
let coffeeQueueTicketSeq = 1;

function clearCoffeeQueue(state: AgentRuntimeState): AgentRuntimeState {
  return {
    ...state,
    pendingCoffee: false,
    coffeeTimer: 0,
    coffeeQueueTicket: 0,
  };
}

function anchorPosition(anchor: ChatAnchor): [number, number, number] {
  if (anchor.posture === 'sit') {
    return sanitizeWalkPosition([...anchor.position], { allowFurniture: true });
  }
  return sanitizeWalkPosition([...anchor.position]);
}

function chatWalkTarget(anchor: ChatAnchor): [number, number, number] {
  if (anchor.posture === 'sit') {
    return findChatApproachPosition([...anchor.position]);
  }
  return sanitizeWalkPosition([...anchor.position]);
}

function applyChatAnchor(state: AgentRuntimeState, anchor: ChatAnchor): AgentRuntimeState {
  return {
    ...clearCoffeeQueue(state),
    status: 'chatting',
    position: anchorPosition(anchor),
    targetPosition: null,
    rotation: anchor.rotation,
    moveSpeed: 0,
    posture: anchor.posture,
  };
}

function dispatchToChatAnchor(state: AgentRuntimeState, anchor: ChatAnchor): AgentRuntimeState {
  if (isNearChatAnchor(state.position, anchor)) {
    return applyChatAnchor(state, anchor);
  }

  return {
    ...clearCoffeeQueue(state),
    status: 'walking',
    targetPosition: chatWalkTarget(anchor),
    pendingChat: true,
    posture: anchor.posture,
  };
}

function createInitialRuntime(def: AgentDefinition): AgentRuntimeState {
  const anchor = getAgentSpawnAnchor(def);
  const spawn = sanitizeWalkPosition([...anchor.position]);
  return {
    id: def.id,
    status: 'idle',
    position: spawn,
    targetPosition: null,
    waypointIndex: nearestZoneWaypointIndex(def.homeZone, spawn),
    rotation: anchor.rotation,
    moveSpeed: 0,
    pendingChat: false,
    pendingCoffee: false,
    coffeeTimer: 0,
    coffeeQueueTicket: 0,
    posture: anchor.posture,
  };
}

function zoneWaypointsFor(def: AgentDefinition) {
  return getZoneWaypoints(def.homeZone);
}

function waypointsForRecovery(def: AgentDefinition, state: AgentRuntimeState) {
  if (!state.targetPosition) return zoneWaypointsFor(def);
  const zone = nearestZoneForPosition(state.targetPosition);
  return getZoneWaypoints(zone);
}

function otherAgents(
  runtime: Record<string, AgentRuntimeState>,
  selfId: string,
): AgentCircle[] {
  return Object.entries(runtime)
    .filter(([id]) => id !== selfId)
    .map(([, state]) => ({ id: state.id, position: state.position }));
}

function isInCoffeeFlow(state: AgentRuntimeState): boolean {
  return (
    state.coffeeQueueTicket > 0 ||
    state.pendingCoffee ||
    state.status === 'coffee' ||
    state.status === 'coffee-queue'
  );
}

function getCoffeeQueueOrder(
  runtime: Record<string, AgentRuntimeState>,
  definitions: AgentDefinition[],
): string[] {
  return definitions
    .map((def) => def.id)
    .filter((id) => isInCoffeeFlow(runtime[id]))
    .sort((a, b) => runtime[a].coffeeQueueTicket - runtime[b].coffeeQueueTicket);
}

function canBeginServing(
  queue: string[],
  agentId: string,
  runtime: Record<string, AgentRuntimeState>,
): boolean {
  const index = queue.indexOf(agentId);
  if (index < 0 || index >= COFFEE_BAR_MAX_SERVING) return false;

  for (let i = 0; i < index; i++) {
    const ahead = runtime[queue[i]];
    if (ahead.status === 'coffee') continue;
    if (!isAtCoffeeBarQueueSlot(ahead.position, i)) return false;
  }
  return true;
}

function applyCoffeeQueueSync(
  runtime: Record<string, AgentRuntimeState>,
  definitions: AgentDefinition[],
): Record<string, AgentRuntimeState> {
  const next = { ...runtime };
  const queue = getCoffeeQueueOrder(next, definitions);

  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    const state = next[id];
    if (!state || state.status === 'chatting') continue;

    const anchor = getCoffeeBarQueueAnchor(i);
    const target = getCoffeeBarQueueWalkTarget(i);
    const atSlot = isAtCoffeeBarQueueSlot(state.position, i);
    const servingSlot = i < COFFEE_BAR_MAX_SERVING;

    if (state.status === 'coffee') {
      next[id] = {
        ...state,
        rotation: anchor.rotation,
        posture: 'stand',
        targetPosition: null,
        pendingCoffee: false,
      };
      continue;
    }

    if (servingSlot && canBeginServing(queue, id, next)) {
      if (atSlot) {
        next[id] = {
          ...state,
          status: 'coffee',
          position: target,
          targetPosition: null,
          pendingCoffee: false,
          rotation: anchor.rotation,
          posture: 'stand',
          coffeeTimer:
            state.coffeeTimer > 0
              ? state.coffeeTimer
              : randomIdleDuration(
                  SCENE_CONFIG.coffeeDurationMin,
                  SCENE_CONFIG.coffeeDurationMax,
                ),
        };
      } else {
        next[id] = {
          ...state,
          status: 'walking',
          pendingCoffee: true,
          targetPosition: target,
          posture: 'stand',
        };
      }
      continue;
    }

    if (atSlot) {
      next[id] = {
        ...state,
        status: 'coffee-queue',
        position: sanitizeWalkPosition([...state.position]),
        targetPosition: null,
        pendingCoffee: true,
        rotation: anchor.rotation,
        posture: 'stand',
      };
    } else {
      next[id] = {
        ...state,
        status: 'walking',
        pendingCoffee: true,
        targetPosition: target,
        posture: 'stand',
      };
    }
  }

  return next;
}

export const useAgentsStore = create<AgentsStore>((set, get) => ({
  baseDefinitions: [],
  definitions: [],
  runtime: {},
  idleTimers: {},

  setDefinitions: (definitions) => {
    const locale = readLocale();
    set({
      baseDefinitions: definitions,
      definitions: applyLocaleToAgents(definitions, locale),
      runtime: {},
      idleTimers: {},
    });
  },

  applyLocale: (locale) => {
    const base = get().baseDefinitions;
    if (base.length === 0) return;
    set({ definitions: applyLocaleToAgents(base, locale) });
  },

  setAgentModelId: (id, modelId) => {
    const current = get().definitions.find((def) => def.id === id);
    if (!current || current.modelId === modelId) return;
    const patch = (defs: AgentDefinition[]) =>
      defs.map((def) => (def.id === id ? { ...def, modelId } : def));
    set({
      baseDefinitions: patch(get().baseDefinitions),
      definitions: patch(get().definitions),
    });
  },

  initialize: () => {
    const definitions = get().definitions;
    const runtime: Record<string, AgentRuntimeState> = {};
    const idleTimers: Record<string, number> = {};
    stuckSecondsByAgent.clear();
    coffeeQueueTicketSeq = 1;
    definitions.forEach((def) => {
      runtime[def.id] = createInitialRuntime(def);
      idleTimers[def.id] = randomIdleDuration(
        SCENE_CONFIG.idlePauseMin,
        SCENE_CONFIG.idlePauseMax,
      );
      stuckSecondsByAgent.set(def.id, 0);
    });
    set({ runtime: resolveAllAgentOverlaps(runtime), idleTimers });
  },

  beginChatSession: (id) => {
    const def = get().definitions.find((agent) => agent.id === id);
    const state = get().runtime[id];
    if (!def || !state) return;

    stuckSecondsByAgent.set(id, 0);
    const anchor = getAgentChatAnchor(def);

    set({
      runtime: {
        ...get().runtime,
        [id]: dispatchToChatAnchor(state, anchor),
      },
    });
  },

  endChatSession: (id) => {
    const state = get().runtime[id];
    if (!state) return;

    set({
      runtime: {
        ...get().runtime,
        [id]: {
          ...clearCoffeeQueue(state),
          status: 'idle',
          targetPosition: null,
          posture: 'stand',
        },
      },
      idleTimers: {
        ...get().idleTimers,
        [id]: randomIdleDuration(SCENE_CONFIG.idlePauseMin, SCENE_CONFIG.idlePauseMax),
      },
    });
  },

  dispatchAgentCommand: (id, command) => {
    const def = get().definitions.find((agent) => agent.id === id);
    const state = get().runtime[id];
    if (!def || !state) return false;

    stuckSecondsByAgent.set(id, 0);

    if (command === 'coffee') {
      set({
        runtime: {
          ...get().runtime,
          [id]: {
            ...state,
            coffeeQueueTicket: coffeeQueueTicketSeq++,
            pendingCoffee: true,
            coffeeTimer: 0,
            status: 'walking',
            targetPosition: null,
            posture: 'stand',
            pendingChat: false,
          },
        },
      });
      return true;
    }

    const zone =
      command === 'relax' ? 'living' : command === 'focus' ? 'center-desk' : def.homeZone;
    const zoneWaypoints = getZoneWaypoints(zone);
    if (zoneWaypoints.length === 0) return false;

    const wpIndex =
      command === 'relax'
        ? (() => {
            const puffIdx = zoneWaypoints.findIndex((wp) => wp.id === 'wp-living-puff');
            return puffIdx >= 0 ? puffIdx : nearestZoneWaypointIndex(zone, state.position);
          })()
        : nearestZoneWaypointIndex(zone, state.position);

    const rawTarget =
      command === 'relax'
        ? getLivingRelaxWalkTarget()
        : ([...zoneWaypoints[wpIndex].position] as [number, number, number]);
    const target = resolveWalkTarget(state.position, rawTarget);

    set({
      runtime: {
        ...get().runtime,
        [id]: {
          ...clearCoffeeQueue(state),
          status: 'walking',
          targetPosition: target,
          waypointIndex: wpIndex,
          posture: 'stand',
          pendingChat: false,
        },
      },
    });
    return true;
  },

  setAgentStatus: (id, status) => {
    const current = get().runtime[id];
    if (!current) return;
    set({
      runtime: {
        ...get().runtime,
        [id]: {
          ...current,
          status,
          pendingChat: status === 'chatting' ? false : current.pendingChat,
          pendingCoffee: status === 'chatting' ? false : current.pendingCoffee,
          coffeeTimer: status === 'chatting' ? 0 : current.coffeeTimer,
          coffeeQueueTicket: status === 'chatting' ? 0 : current.coffeeQueueTicket,
          posture: status === 'chatting' ? current.posture : 'stand',
        },
      },
    });
  },

  getRuntime: (id) => get().runtime[id],

  tick: (delta) => {
    const { runtime, idleTimers, definitions } = get();
    let nextRuntime = { ...runtime };
    const nextTimers = { ...idleTimers };

    for (const def of definitions) {
      const state = nextRuntime[def.id];
      if (!state) continue;

      const zoneWaypoints = zoneWaypointsFor(def);
      const chatAnchor = getAgentChatAnchor(def);

      if (state.status === 'chatting') continue;

      if (state.status === 'coffee') {
        const coffeeTimer = Math.max(0, state.coffeeTimer - delta);
        if (coffeeTimer <= 0 && zoneWaypoints.length > 0) {
          const wpIndex = nearestZoneWaypointIndex(def.homeZone, state.position);
          const target = resolveWalkTarget(state.position, [
            ...zoneWaypoints[wpIndex].position,
          ] as [number, number, number]);
          stuckSecondsByAgent.set(def.id, 0);
          nextRuntime[def.id] = {
            ...clearCoffeeQueue(state),
            status: 'walking',
            targetPosition: target,
            waypointIndex: wpIndex,
          };
        } else {
          nextRuntime[def.id] = { ...state, coffeeTimer };
        }
        continue;
      }

      if (state.status === 'coffee-queue') {
        continue;
      }

      if (state.status === 'idle') {
        nextTimers[def.id] = (nextTimers[def.id] ?? 0) - delta;
        if (nextTimers[def.id] <= 0 && zoneWaypoints.length > 0) {
          const wantsCoffee = Math.random() < SCENE_CONFIG.coffeeBreakChance;

          if (wantsCoffee) {
            stuckSecondsByAgent.set(def.id, 0);
            nextRuntime[def.id] = {
              ...state,
              coffeeQueueTicket: coffeeQueueTicketSeq++,
              pendingCoffee: true,
              status: 'walking',
              targetPosition: null,
              posture: 'stand',
            };
            continue;
          }

          const wpIndex = pickNextWaypointIndex(state.waypointIndex, zoneWaypoints);
          const target = resolveWalkTarget(state.position, [
            ...zoneWaypoints[wpIndex].position,
          ] as [number, number, number]);
          stuckSecondsByAgent.set(def.id, 0);
          nextRuntime[def.id] = {
            ...state,
            status: 'walking',
            targetPosition: target,
            waypointIndex: wpIndex,
            pendingChat: false,
            pendingCoffee: false,
          };
        }
        continue;
      }

      if (state.status === 'walking' && state.targetPosition) {
        const dist = distance2D(state.position, state.targetPosition);
        const step = SCENE_CONFIG.walkSpeed * delta;
        const arrived = dist <= step || dist <= WALK_ARRIVAL_RADIUS;

        if (arrived) {
          stuckSecondsByAgent.set(def.id, 0);

          if (state.pendingChat) {
            nextRuntime[def.id] = applyChatAnchor(
              {
                ...state,
                position: sanitizeAgentPosition(
                  [...state.targetPosition],
                  def.id,
                  otherAgents(nextRuntime, def.id),
                ),
              },
              chatAnchor,
            );
            continue;
          }

          if (state.pendingCoffee || state.coffeeQueueTicket > 0) {
            nextRuntime[def.id] = {
              ...state,
              position: sanitizeAgentPosition(
                [...state.targetPosition],
                def.id,
                otherAgents(nextRuntime, def.id),
              ),
              rotation: lerpAngle(
                state.rotation,
                rotationTowards(state.position, state.targetPosition),
                0.85,
              ),
              targetPosition: null,
              moveSpeed: 0,
            };
            continue;
          }

          nextRuntime[def.id] = {
            ...state,
            status: 'idle',
            position: sanitizeAgentPosition(
              [...state.targetPosition],
              def.id,
              otherAgents(nextRuntime, def.id),
            ),
            targetPosition: null,
            rotation: lerpAngle(
              state.rotation,
              rotationTowards(state.position, state.targetPosition),
              0.85,
            ),
            pendingChat: false,
            pendingCoffee: false,
            moveSpeed: 0,
          };
          nextTimers[def.id] = randomIdleDuration(
            SCENE_CONFIG.idlePauseMin,
            SCENE_CONFIG.idlePauseMax,
          );
        } else {
          const t = step / dist;
          const desired = lerpPosition(state.position, state.targetPosition, t);
          const newPos = moveWithAgentAwareness(
            state.position,
            desired,
            def.id,
            otherAgents(nextRuntime, def.id),
          );
          const moved = distance2D(state.position, newPos);

          if (moved < MOVE_EPSILON) {
            if (state.targetPosition) {
              const escape = nudgeAlongPath(state.position, state.targetPosition);
              if (distance2D(state.position, escape) > MOVE_EPSILON) {
                stuckSecondsByAgent.set(def.id, 0);
                const { rotation, moveSpeed } = computeWalkRotation(
                  state.rotation,
                  state.position,
                  escape,
                  state.targetPosition,
                  delta,
                );
                nextRuntime[def.id] = {
                  ...state,
                  position: sanitizeAgentPosition(
                    escape,
                    def.id,
                    otherAgents(nextRuntime, def.id),
                  ),
                  rotation,
                  moveSpeed,
                };
                continue;
              }
            }

            const stuck = (stuckSecondsByAgent.get(def.id) ?? 0) + delta;
            stuckSecondsByAgent.set(def.id, stuck);

            if (stuck >= STUCK_GIVE_UP) {
              stuckSecondsByAgent.set(def.id, 0);
              nextRuntime[def.id] = {
                ...state,
                status: 'idle',
                targetPosition: null,
                moveSpeed: 0,
                position: sanitizeAgentPosition(
                  state.position,
                  def.id,
                  otherAgents(nextRuntime, def.id),
                ),
              };
              nextTimers[def.id] = randomIdleDuration(
                SCENE_CONFIG.idlePauseMin,
                SCENE_CONFIG.idlePauseMax,
              );
              continue;
            }

            if (stuck >= STUCK_THRESHOLD) {
              const recoveryWaypoints = waypointsForRecovery(def, state);
              if (state.pendingCoffee || state.coffeeQueueTicket > 0) {
                const queue = getCoffeeQueueOrder(nextRuntime, definitions);
                const queueIndex = queue.indexOf(def.id);

                if (queueIndex >= 0 && stuck < STUCK_THRESHOLD * 2.5) {
                  const escape = getCoffeeBarQueueWalkTarget(queueIndex);
                  stuckSecondsByAgent.set(def.id, 0);
                  nextRuntime[def.id] = {
                    ...state,
                    status: 'walking',
                    targetPosition: escape,
                    pendingCoffee: true,
                  };
                  continue;
                }

                if (recoveryWaypoints.length > 0) {
                  const wpIndex = pickNextWaypointIndex(state.waypointIndex, recoveryWaypoints);
                  const escape = resolveWalkTarget(state.position, [
                    ...recoveryWaypoints[wpIndex].position,
                  ] as [number, number, number]);
                  stuckSecondsByAgent.set(def.id, 0);
                  nextRuntime[def.id] = {
                    ...clearCoffeeQueue(state),
                    status: 'walking',
                    targetPosition: escape,
                    waypointIndex: wpIndex,
                  };
                  continue;
                }
              } else if (recoveryWaypoints.length > 0) {
                const wpIndex = pickNextWaypointIndex(state.waypointIndex, recoveryWaypoints);
                const escape = resolveWalkTarget(state.position, [
                  ...recoveryWaypoints[wpIndex].position,
                ] as [number, number, number]);
                stuckSecondsByAgent.set(def.id, 0);
                nextRuntime[def.id] = {
                  ...state,
                  status: 'walking',
                  targetPosition: escape,
                  waypointIndex: wpIndex,
                  rotation: state.rotation,
                };
                continue;
              }
            }

            nextRuntime[def.id] = {
              ...state,
              moveSpeed: 0,
            };
            continue;
          } else {
            stuckSecondsByAgent.set(def.id, 0);
          }

          const safePos = sanitizeAgentPosition(
            newPos,
            def.id,
            otherAgents(nextRuntime, def.id),
          );
          const { rotation, moveSpeed: rawSpeed } = computeWalkRotation(
            state.rotation,
            state.position,
            safePos,
            state.targetPosition,
            delta,
          );
          const moveSpeed = rawSpeed >= MIN_WALK_SPEED ? rawSpeed : 0;

          nextRuntime[def.id] = {
            ...state,
            position: safePos,
            rotation,
            moveSpeed,
          };
        }
      }
    }

    nextRuntime = applyCoffeeQueueSync(nextRuntime, definitions);
    set({ runtime: resolveAllAgentOverlaps(nextRuntime), idleTimers: nextTimers });
  },
}));
