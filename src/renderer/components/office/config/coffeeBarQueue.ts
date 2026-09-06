import { COFFEE_LOUNGE_CENTER_Z } from '@/components/office/office/furniture/coffeeLoungeConstants';
import type { ChatAnchor } from '@/components/office/types/scene';
import { CHAT_ARRIVAL_RADIUS, isNearChatAnchor } from '@/components/office/config/agentZones.config';
import { findChatApproachPosition } from '@/components/office/utils/collision';

export const COFFEE_BAR_MAX_SERVING = 2;

export const COFFEE_BAR_FRONT_Z = COFFEE_LOUNGE_CENTER_Z + 0.22;
const COFFEE_BAR_COUNTER: [number, number, number] = [0.1, 0, COFFEE_LOUNGE_CENTER_Z + 0.12];

const SERVE_SLOTS: [number, number, number][] = [
  [0.08, 0, COFFEE_BAR_FRONT_Z + 0.14],
  [0.55, 0, COFFEE_BAR_FRONT_Z + 0.14],
];

const QUEUE_LINE_X = 0.92;
const QUEUE_START_Z = COFFEE_BAR_FRONT_Z + 0.48;
const QUEUE_SPACING_Z = 0.42;

function rotationTowardBar(position: [number, number, number]): number {
  return Math.atan2(
    COFFEE_BAR_COUNTER[0] - position[0],
    COFFEE_BAR_COUNTER[2] - position[2],
  );
}

export function getCoffeeBarQueuePosition(queueIndex: number): [number, number, number] {
  if (queueIndex < SERVE_SLOTS.length) {
    return SERVE_SLOTS[queueIndex];
  }
  const lineIndex = queueIndex - SERVE_SLOTS.length;
  return [QUEUE_LINE_X, 0, QUEUE_START_Z + lineIndex * QUEUE_SPACING_Z];
}

export function getCoffeeBarQueueAnchor(queueIndex: number): ChatAnchor {
  const position = getCoffeeBarQueuePosition(queueIndex);
  return {
    position,
    rotation: rotationTowardBar(position),
    posture: 'stand',
  };
}

export function getCoffeeBarQueueWalkTarget(queueIndex: number): [number, number, number] {
  return findChatApproachPosition(getCoffeeBarQueuePosition(queueIndex), CHAT_ARRIVAL_RADIUS);
}

export function isAtCoffeeBarQueueSlot(
  position: [number, number, number],
  queueIndex: number,
): boolean {
  return isNearChatAnchor(position, getCoffeeBarQueueAnchor(queueIndex));
}

export { CHAT_ARRIVAL_RADIUS as COFFEE_QUEUE_ARRIVAL_RADIUS };
