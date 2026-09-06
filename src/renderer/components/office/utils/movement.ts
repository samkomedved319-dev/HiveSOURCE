import { isWalkablePosition } from '@/components/office/utils/collision';
import type { Waypoint } from '@/components/office/types/scene';

export function distance2D(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export function smoothStep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export function lerpPosition(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ];
}

export function rotationTowards(
  from: [number, number, number],
  to: [number, number, number],
): number {
  return Math.atan2(to[0] - from[0], to[2] - from[2]);
}

export function lerpAngle(current: number, target: number, t: number): number {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * Math.max(0, Math.min(1, t));
}

export function rotationFromDelta(
  dx: number,
  dz: number,
  fallback: number,
): number {
  if (dx * dx + dz * dz < 1e-10) return fallback;
  return Math.atan2(dx, dz);
}

export function computeWalkRotation(
  currentRotation: number,
  from: [number, number, number],
  to: [number, number, number],
  targetPosition: [number, number, number] | null,
  delta: number,
): { rotation: number; moveSpeed: number } {
  const moveDx = to[0] - from[0];
  const moveDz = to[2] - from[2];
  const moveSpeed = Math.sqrt(moveDx * moveDx + moveDz * moveDz) / Math.max(delta, 1e-5);
  const velocityFacing = rotationFromDelta(moveDx, moveDz, currentRotation);
  const goalFacing = targetPosition
    ? rotationTowards(from, targetPosition)
    : velocityFacing;
  const desiredFacing = moveSpeed > 0.14 ? velocityFacing : goalFacing;
  const turnRate = moveSpeed > 0.14 ? 20 : 12;
  return {
    rotation: lerpAngle(currentRotation, desiredFacing, Math.min(1, delta * turnRate)),
    moveSpeed,
  };
}

function isHubPerimeterWaypoints(waypoints: Waypoint[]): boolean {
  return waypoints.length === 4 && waypoints.every((wp) => wp.zone === 'center-desk');
}

export function pickNextWaypointIndex(
  currentIndex: number,
  waypoints: Waypoint[],
): number {
  if (waypoints.length <= 1) return 0;

  if (isHubPerimeterWaypoints(waypoints)) {
    const adjacent = [
      (currentIndex + 1) % waypoints.length,
      (currentIndex + waypoints.length - 1) % waypoints.length,
    ].filter(
      (index) => index !== currentIndex && isWalkablePosition(waypoints[index].position),
    );
    if (adjacent.length > 0) {
      return adjacent[Math.floor(Math.random() * adjacent.length)];
    }
  }

  const walkable = waypoints
    .map((wp, index) => ({ index, walkable: isWalkablePosition(wp.position) }))
    .filter((entry) => entry.walkable && entry.index !== currentIndex);

  if (walkable.length > 0) {
    return walkable[Math.floor(Math.random() * walkable.length)].index;
  }

  let next = currentIndex;
  let attempts = 0;
  while (next === currentIndex && attempts < 24) {
    next = Math.floor(Math.random() * waypoints.length);
    attempts += 1;
  }
  return next;
}

export function randomIdleDuration(min: number, max: number): number {
  return min + Math.random() * (max - min);
}