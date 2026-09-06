import {
  AGENT_COLLISION_RADIUS,
  clampToWalkBounds,
  isFurnitureOccupiedPosition,
  OFFICE_OBSTACLES,
  type OfficeObstacle,
} from '@/components/office/config/officeObstacles';

export const AGENT_BODY_RADIUS = AGENT_COLLISION_RADIUS;
export const AGENT_PERSONAL_SPACE = AGENT_BODY_RADIUS * 2 + 0.1;
export const AGENT_WALK_GAP = AGENT_BODY_RADIUS * 2 + 0.05;

const SHORT_STEP_DISTANCE = 0.16;

export type AgentCircle = {
  id: string;
  position: [number, number, number];
};

export type WalkCollisionOptions = {
  allowFurniture?: boolean;
};

function distance2D(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dz * dz);
}

function hashAngle(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 360) * Math.PI) / 180;
}

function circleBlocked(
  x: number,
  z: number,
  obs: Extract<OfficeObstacle, { kind: 'circle' }>,
  r: number,
): boolean {
  const dx = x - obs.x;
  const dz = z - obs.z;
  const limit = obs.radius + r;
  return dx * dx + dz * dz < limit * limit;
}

function boxBlocked(
  x: number,
  z: number,
  obs: Extract<OfficeObstacle, { kind: 'box' }>,
  r: number,
): boolean {
  return (
    x >= obs.minX - r &&
    x <= obs.maxX + r &&
    z >= obs.minZ - r &&
    z <= obs.maxZ + r
  );
}

export function isPositionBlocked(
  x: number,
  z: number,
  radius = AGENT_COLLISION_RADIUS,
  obstacles = OFFICE_OBSTACLES,
  options: WalkCollisionOptions = {},
): boolean {
  const [cx, cz] = clampToWalkBounds(x, z);
  if (cx !== x || cz !== z) return true;

  if (options.allowFurniture) return false;

  return obstacles.some((obs) =>
    obs.kind === 'circle' ? circleBlocked(cx, cz, obs, radius) : boxBlocked(cx, cz, obs, radius),
  );
}

export function isWalkablePosition(
  position: [number, number, number],
  options: WalkCollisionOptions = {},
): boolean {
  return !isPositionBlocked(position[0], position[2], AGENT_COLLISION_RADIUS, OFFICE_OBSTACLES, options);
}

const SLIDE_DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.707, 0.707],
  [-0.707, 0.707],
  [0.707, -0.707],
  [-0.707, -0.707],
];

function canMoveTo(
  x: number,
  z: number,
  options: WalkCollisionOptions,
): boolean {
  return !isPositionBlocked(x, z, AGENT_COLLISION_RADIUS, OFFICE_OBSTACLES, options);
}

function isSegmentWalkable(
  from: [number, number, number],
  to: [number, number, number],
  options: WalkCollisionOptions,
  sampleSpacing = 0.09,
): boolean {
  const dist = distance2D(from, to);
  if (dist < 0.001) return canMoveTo(to[0], to[2], options);

  const steps = Math.max(1, Math.ceil(dist / sampleSpacing));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = from[0] + (to[0] - from[0]) * t;
    const z = from[2] + (to[2] - from[2]) * t;
    if (!canMoveTo(x, z, options)) return false;
  }
  return true;
}

function acceptMove(
  from: [number, number, number],
  candidate: [number, number, number],
  options: WalkCollisionOptions,
): [number, number, number] | null {
  const bounded = withBounds(candidate);
  if (!canMoveTo(bounded[0], bounded[2], options)) return null;

  const stepDist = distance2D(from, bounded);
  if (stepDist <= SHORT_STEP_DISTANCE) return bounded;
  if (!isSegmentWalkable(from, bounded, options)) return null;
  return bounded;
}

function withBounds(position: [number, number, number]): [number, number, number] {
  const [x, z] = clampToWalkBounds(position[0], position[2]);
  return [x, position[1], z];
}

function arcCandidates(
  from: [number, number, number],
  to: [number, number, number],
): [number, number, number][] {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const stepLen = Math.sqrt(dx * dx + dz * dz) || 0.0001;
  const heading = Math.atan2(dx, dz);
  const candidates: [number, number, number][] = [];

  for (const t of [0.35, 0.55, 0.75, 1]) {
    for (const sign of [-1, 1]) {
      for (const spread of [0.42, 0.78, 1.12]) {
        const angle = heading + sign * spread;
        candidates.push([
          from[0] + Math.sin(angle) * stepLen * t,
          from[1],
          from[2] + Math.cos(angle) * stepLen * t,
        ]);
      }
    }
  }

  return candidates;
}

function obstacleRepulsionVector(x: number, z: number, radius = AGENT_COLLISION_RADIUS): [number, number] {
  let rx = 0;
  let rz = 0;

  for (const obs of OFFICE_OBSTACLES) {
    if (obs.kind === 'circle') {
      const dx = x - obs.x;
      const dz = z - obs.z;
      const dist = Math.sqrt(dx * dx + dz * dz) || 0.0001;
      const minDist = obs.radius + radius + 0.02;
      if (dist < minDist) {
        const push = (minDist - dist) / dist;
        rx += dx * push;
        rz += dz * push;
      }
    } else {
      const cx = (obs.minX + obs.maxX) / 2;
      const cz = (obs.minZ + obs.maxZ) / 2;
      const halfW = (obs.maxX - obs.minX) / 2 + radius + 0.02;
      const halfD = (obs.maxZ - obs.minZ) / 2 + radius + 0.02;
      const dx = x - cx;
      const dz = z - cz;
      if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
        const overlapX = halfW - Math.abs(dx);
        const overlapZ = halfD - Math.abs(dz);
        if (overlapX < overlapZ) {
          rx += dx > 0 ? overlapX : -overlapX;
        } else {
          rz += dz > 0 ? overlapZ : -overlapZ;
        }
      }
    }
  }

  return [rx, rz];
}

function tryTangentSlides(
  from: [number, number, number],
  stepLen: number,
  tryCandidate: (candidate: [number, number, number]) => void,
): void {
  const [rx, rz] = obstacleRepulsionVector(from[0], from[2]);
  const repLen = Math.sqrt(rx * rx + rz * rz);
  if (repLen < 1e-5) return;

  const nx = rx / repLen;
  const nz = rz / repLen;
  const tanX = -nz;
  const tanZ = nx;

  for (const sign of [-1, 1]) {
    for (const scale of [0.72, 0.95, 1.1]) {
      tryCandidate([
        from[0] + tanX * sign * stepLen * scale,
        from[1],
        from[2] + tanZ * sign * stepLen * scale,
      ]);
    }
  }
}

export function moveWithCollision(
  from: [number, number, number],
  to: [number, number, number],
  options: WalkCollisionOptions = {},
): [number, number, number] {
  const target = withBounds(to);

  const direct = acceptMove(from, target, options);
  if (direct) return direct;

  const tryX = acceptMove(from, [target[0], from[1], from[2]], options);
  if (tryX) return tryX;

  const tryZ = acceptMove(from, [from[0], from[1], target[2]], options);
  if (tryZ) return tryZ;

  const dx = target[0] - from[0];
  const dz = target[2] - from[2];
  const stepLen = Math.sqrt(dx * dx + dz * dz) || 0.0001;
  const goalNx = dx / stepLen;
  const goalNz = dz / stepLen;

  let best: [number, number, number] | null = null;
  let bestScore = -1;

  const tryCandidate = (candidate: [number, number, number]) => {
    const accepted = acceptMove(from, candidate, options);
    if (!accepted) return;
    const ax = accepted[0] - from[0];
    const az = accepted[2] - from[2];
    const progress = Math.sqrt(ax * ax + az * az);
    if (progress < 1e-5) return;
    const toward = (ax * goalNx + az * goalNz) / progress;
    const score = progress * (0.55 + 0.45 * Math.max(0, toward));
    if (score > bestScore) {
      bestScore = score;
      best = accepted;
    }
  };

  for (const [sx, sz] of SLIDE_DIRS) {
    tryCandidate([from[0] + sx * stepLen, from[1], from[2] + sz * stepLen]);
  }

  for (const candidate of arcCandidates(from, target)) {
    tryCandidate(candidate);
  }

  tryTangentSlides(from, stepLen, tryCandidate);

  if (best) return best;

  for (const fraction of [0.55, 0.32, 0.18]) {
    const accepted = acceptMove(from, [from[0] + dx * fraction, from[1], from[2] + dz * fraction], options);
    if (accepted) return accepted;
  }

  return withBounds(from);
}

export function resolvePenetration(
  position: [number, number, number],
  skipFurniture = false,
): [number, number, number] {
  let [x, y, z] = withBounds(position);
  if (skipFurniture) return [x, y, z];

  const r = AGENT_COLLISION_RADIUS;

  for (let pass = 0; pass < 12; pass++) {
    let moved = false;
    for (const obs of OFFICE_OBSTACLES) {
      if (obs.kind === 'circle') {
        const dx = x - obs.x;
        const dz = z - obs.z;
        const dist = Math.sqrt(dx * dx + dz * dz) || 0.0001;
        const minDist = obs.radius + r + 0.03;
        if (dist < minDist) {
          const push = (minDist - dist) / dist;
          x += dx * push;
          z += dz * push;
          moved = true;
        }
      } else {
        const cx = (obs.minX + obs.maxX) / 2;
        const cz = (obs.minZ + obs.maxZ) / 2;
        const halfW = (obs.maxX - obs.minX) / 2 + r + 0.03;
        const halfD = (obs.maxZ - obs.minZ) / 2 + r + 0.03;
        const dx = x - cx;
        const dz = z - cz;
        if (Math.abs(dx) < halfW && Math.abs(dz) < halfD) {
          const overlapX = halfW - Math.abs(dx);
          const overlapZ = halfD - Math.abs(dz);
          if (overlapX < overlapZ) {
            x += dx > 0 ? overlapX : -overlapX;
          } else {
            z += dz > 0 ? overlapZ : -overlapZ;
          }
          moved = true;
        }
      }
    }

    [x, z] = clampToWalkBounds(x, z);
    if (!moved) break;
  }

  return [x, y, z];
}

export function findNearestWalkablePosition(
  position: [number, number, number],
  maxRadius = 1.35,
): [number, number, number] {
  const resolved = resolvePenetration(position);
  if (isWalkablePosition(resolved)) return resolved;

  for (let ring = 0.18; ring <= maxRadius; ring += 0.16) {
    const steps = Math.max(8, Math.ceil(ring * 10));
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const candidate: [number, number, number] = [
        position[0] + Math.cos(angle) * ring,
        position[1],
        position[2] + Math.sin(angle) * ring,
      ];
      const bounded = resolvePenetration(candidate);
      if (isWalkablePosition(bounded)) return bounded;
    }
  }

  return resolved;
}

export function findChatApproachPosition(
  anchorPosition: [number, number, number],
  arrivalRadius = 0.28,
): [number, number, number] {
  const [ax, y, az] = anchorPosition;

  if (isWalkablePosition(anchorPosition)) {
    return anchorPosition;
  }

  for (let ring = 0.08; ring <= arrivalRadius; ring += 0.05) {
    const steps = Math.max(8, Math.ceil(ring * 14));
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const candidate: [number, number, number] = [
        ax + Math.cos(angle) * ring,
        y,
        az + Math.sin(angle) * ring,
      ];
      if (!isWalkablePosition(candidate)) continue;
      const dx = candidate[0] - ax;
      const dz = candidate[2] - az;
      if (dx * dx + dz * dz <= arrivalRadius * arrivalRadius) {
        return candidate;
      }
    }
  }

  return findNearestWalkablePosition(anchorPosition);
}

export function findStandPositionNearSeat(
  seat: [number, number, number],
  preferredOffsets: [number, number][] = [],
): [number, number, number] {
  const [ax, y, az] = seat;

  for (const [ox, oz] of preferredOffsets) {
    const candidate = findNearestWalkablePosition([ax + ox, y, az + oz], 0.55);
    const dx = candidate[0] - ax;
    const dz = candidate[2] - az;
    if (dx * dx + dz * dz >= 0.28 * 0.28 && isWalkablePosition(candidate)) {
      return candidate;
    }
  }

  for (let ring = 0.52; ring <= 1.05; ring += 0.1) {
    const steps = Math.max(10, Math.ceil(ring * 12));
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const candidate: [number, number, number] = [
        ax + Math.cos(angle) * ring,
        y,
        az + Math.sin(angle) * ring,
      ];
      if (isWalkablePosition(candidate)) {
        return candidate;
      }
    }
  }

  return findNearestWalkablePosition(seat, 2);
}

export function ejectFromFurniture(
  position: [number, number, number],
): [number, number, number] {
  const resolved = resolvePenetration(withBounds(position));
  if (isWalkablePosition(resolved)) return resolved;
  return findNearestWalkablePosition(resolved, 2);
}

export function clampToWalkable(
  position: [number, number, number],
): [number, number, number] {
  return ejectFromFurniture(position);
}

export function sanitizeWalkPosition(
  position: [number, number, number],
  options: WalkCollisionOptions = {},
): [number, number, number] {
  if (options.allowFurniture) {
    return withBounds(position);
  }
  return findNearestWalkablePosition(position);
}

export function separateFromAgents(
  position: [number, number, number],
  selfId: string,
  others: AgentCircle[],
  skipFurniture = false,
  minDist = AGENT_PERSONAL_SPACE,
): [number, number, number] {
  let [x, y, z] = position;

  for (const other of others) {
    if (other.id === selfId) continue;

    let dx = x - other.position[0];
    let dz = z - other.position[2];
    let distSq = dx * dx + dz * dz;

    if (distSq >= minDist * minDist) continue;

    if (distSq < 1e-8) {
      const angle = hashAngle(`${selfId}:${other.id}`);
      dx = Math.cos(angle) * 0.001;
      dz = Math.sin(angle) * 0.001;
      distSq = dx * dx + dz * dz;
    }

    const dist = Math.sqrt(distSq);
    const push = (minDist - dist) / dist;
    x += dx * push;
    z += dz * push;
  }

  return resolvePenetration([x, y, z], skipFurniture);
}

export function nudgeAlongPath(
  from: [number, number, number],
  to: [number, number, number],
): [number, number, number] {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  const perpX = -dz / len;
  const perpZ = dx / len;

  for (const scale of [0.2, 0.35, 0.5, 0.7, 0.85]) {
    for (const sign of [-1, 1]) {
      for (const side of [0.28, 0.42, 0.58, 0.75, 0.92]) {
        const candidate: [number, number, number] = [
          from[0] + dx * scale + perpX * side * sign,
          from[1],
          from[2] + dz * scale + perpZ * side * sign,
        ];
        const safe = findNearestWalkablePosition(candidate, 0.85);
        if (distance2D(from, safe) > 0.025 && isWalkablePosition(safe)) {
          return safe;
        }
      }
    }
  }

  return findNearestWalkablePosition(from, 1.75);
}

export function isDirectPathWalkable(
  from: [number, number, number],
  to: [number, number, number],
  options: WalkCollisionOptions = {},
): boolean {
  return isSegmentWalkable(from, to, options, 0.11);
}

export function resolveWalkTarget(
  from: [number, number, number],
  target: [number, number, number],
): [number, number, number] {
  const safe = sanitizeWalkPosition(target);
  if (isDirectPathWalkable(from, safe)) return safe;

  const nudged = nudgeAlongPath(from, safe);
  if (isDirectPathWalkable(from, nudged) && distance2D(from, nudged) > 0.04) {
    return nudged;
  }

  return findNearestWalkablePosition(from, 1.1);
}

export function moveWithAgentAwareness(
  from: [number, number, number],
  to: [number, number, number],
  selfId: string,
  others: AgentCircle[],
  options: WalkCollisionOptions = {},
): [number, number, number] {
  const obstacleSafe = moveWithCollision(from, to, options);
  let result = separateFromAgents(
    obstacleSafe,
    selfId,
    others,
    options.allowFurniture,
    AGENT_WALK_GAP,
  );

  const progress = distance2D(from, result);
  const ideal = distance2D(from, to);

  if (ideal > 0.05 && progress < ideal * 0.18) {
    const dx = to[0] - from[0];
    const dz = to[2] - from[2];
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    const perpX = -dz / len;
    const perpZ = dx / len;

    for (const sign of [-1, 1]) {
      for (const scale of [0.28, 0.42, 0.56, 0.72]) {
        const sidestep: [number, number, number] = [
          from[0] + dx * 0.45 + perpX * sign * scale,
          from[1],
          from[2] + dz * 0.45 + perpZ * sign * scale,
        ];
        const candidate = separateFromAgents(
          moveWithCollision(from, sidestep, options),
          selfId,
          others,
          options.allowFurniture,
          AGENT_WALK_GAP,
        );
        if (distance2D(from, candidate) > progress + 0.01) {
          result = candidate;
          break;
        }
      }
    }
  }

  if (!options.allowFurniture && !isWalkablePosition(result)) {
    result = ejectFromFurniture(result);
  }

  return result;
}

export function sanitizeAgentPosition(
  position: [number, number, number],
  selfId: string,
  others: AgentCircle[],
  options: WalkCollisionOptions = {},
): [number, number, number] {
  const base = options.allowFurniture ? withBounds(position) : sanitizeWalkPosition(position);
  return separateFromAgents(base, selfId, others, options.allowFurniture);
}

function shouldSkipFurniture<T extends { status: string }>(state: T): boolean {
  return state.status === 'chatting';
}

function agentsOverlap(
  position: [number, number, number],
  selfId: string,
  others: AgentCircle[],
): boolean {
  const minDist = AGENT_BODY_RADIUS * 2 + 0.02;
  for (const other of others) {
    if (other.id === selfId) continue;
    if (distance2D(position, other.position) < minDist) return true;
  }
  return false;
}

function separationMinDist(status: string): number {
  return status === 'walking' ? AGENT_WALK_GAP : AGENT_PERSONAL_SPACE;
}

export function resolveAllAgentOverlaps<
  T extends { id: string; position: [number, number, number]; status: string },
>(states: Record<string, T>, iterations = 4): Record<string, T> {
  const next: Record<string, T> = { ...states };
  const ids = Object.keys(next);

  for (let pass = 0; pass < iterations; pass++) {
    for (const id of ids) {
      const state = next[id];
      if (!state) continue;

      const others = ids
        .filter((otherId) => otherId !== id)
        .map((otherId) => ({
          id: otherId,
          position: next[otherId].position,
        }));

      if (state.status === 'walking' && !agentsOverlap(state.position, id, others)) {
        continue;
      }

      const skipFurniture = shouldSkipFurniture(state);
      let position = separateFromAgents(
        state.position,
        id,
        others,
        skipFurniture,
        separationMinDist(state.status),
      );

      if (!skipFurniture && !isWalkablePosition(position)) {
        position = ejectFromFurniture(position);
      }

      next[id] = { ...state, position };
    }
  }

  return next;
}

export { isFurnitureOccupiedPosition };
