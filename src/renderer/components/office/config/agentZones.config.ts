import { COFFEE_LOUNGE_CENTER_Z, COFFEE_LOUNGE_POSITION, CAFE_HIGH_TABLE_LOCAL, CAFE_PRIMARY_STOOL_LOCAL } from '@/components/office/office/furniture/coffeeLoungeConstants';
import { COFFEE_BAR_FRONT_Z } from '@/components/office/config/coffeeBarQueue';
import {
  PRIVATE_DESK_CENTER,
  PRIVATE_DESK_POSITIONS,
  PRIVATE_DESK_X,
} from '@/components/office/office/furniture/deskConstants';
import {
  MEETING_PRIMARY_PUFF,
  MEETING_PRIMARY_PUFF_SCALE,
  MEETING_ZONE_POSITION,
} from '@/components/office/office/furniture/meetingConstants';
import { hubPerimeterPosition } from '@/components/office/config/officeObstacles';
import {
  findNearestWalkablePosition,
  findStandPositionNearSeat,
} from '@/components/office/utils/collision';
import type { AgentDefinition, AgentHomeZone } from '@/components/office/types/agent';
import type { ChatAnchor, Waypoint } from '@/components/office/types/scene';

const LIVING_PUFF_SEAT: [number, number, number] = [
  MEETING_ZONE_POSITION[0] + MEETING_PRIMARY_PUFF[0],
  0,
  MEETING_ZONE_POSITION[2] + MEETING_PRIMARY_PUFF[2],
];

const CAFE_STOOL_SEAT: [number, number, number] = [
  COFFEE_LOUNGE_POSITION[0] + CAFE_PRIMARY_STOOL_LOCAL[0],
  0,
  COFFEE_LOUNGE_POSITION[2] + CAFE_PRIMARY_STOOL_LOCAL[2],
];

const CHAT_ARRIVAL_RADIUS = 0.28;

function walkWaypoint(x: number, z: number): [number, number, number] {
  return findNearestWalkablePosition([x, 0, z]);
}

const HUB_WAYPOINT_ANGLE = Math.PI / 4 + 0.12;

function getLivingPuffStandPosition(): [number, number, number] {
  return findStandPositionNearSeat(LIVING_PUFF_SEAT, [
    [0, 0.95],
    [0.82, 0.52],
    [-0.82, 0.52],
    [0.48, -0.58],
    [-0.48, -0.58],
  ]);
}

export const ZONE_WAYPOINTS: Waypoint[] = [
  { id: 'wp-center-ne', zone: 'center-desk', position: hubPerimeterPosition(-HUB_WAYPOINT_ANGLE) },
  {
    id: 'wp-center-se',
    zone: 'center-desk',
    position: hubPerimeterPosition(HUB_WAYPOINT_ANGLE),
  },
  {
    id: 'wp-center-sw',
    zone: 'center-desk',
    position: hubPerimeterPosition(Math.PI - HUB_WAYPOINT_ANGLE),
  },
  {
    id: 'wp-center-nw',
    zone: 'center-desk',
    position: hubPerimeterPosition(-Math.PI + HUB_WAYPOINT_ANGLE),
  },
  {
    id: 'wp-living-puff',
    zone: 'living',
    position: getLivingPuffStandPosition(),
  },
  {
    id: 'wp-living-table',
    zone: 'living',
    position: walkWaypoint(MEETING_ZONE_POSITION[0] + 0.95, MEETING_ZONE_POSITION[2] - 0.55),
  },
  {
    id: 'wp-living-rug',
    zone: 'living',
    position: walkWaypoint(MEETING_ZONE_POSITION[0] - 0.25, MEETING_ZONE_POSITION[2] - 0.95),
  },
  {
    id: 'wp-living-board',
    zone: 'living',
    position: walkWaypoint(MEETING_ZONE_POSITION[0] - 1.35, MEETING_ZONE_POSITION[2] + 0.15),
  },
  {
    id: 'wp-cafeteria-table',
    zone: 'cafeteria',
    position: walkWaypoint(0.75, COFFEE_LOUNGE_CENTER_Z + 0.85),
  },
  {
    id: 'wp-cafeteria-bar',
    zone: 'cafeteria',
    position: walkWaypoint(0.55, COFFEE_BAR_FRONT_Z + 0.05),
  },
  {
    id: 'wp-cafeteria-high-table',
    zone: 'cafeteria',
    position: walkWaypoint(0.35, COFFEE_LOUNGE_CENTER_Z + 1.05),
  },
  { id: 'wp-wall-desks-path', zone: 'wall-desks', position: walkWaypoint(4.2, PRIVATE_DESK_CENTER[2]) },
  {
    id: 'wp-wall-desks-a',
    zone: 'wall-desks',
    position: walkWaypoint(PRIVATE_DESK_X - 0.55, PRIVATE_DESK_POSITIONS[0][2]),
  },
  {
    id: 'wp-wall-desks-b',
    zone: 'wall-desks',
    position: walkWaypoint(PRIVATE_DESK_X - 0.55, PRIVATE_DESK_POSITIONS[1][2]),
  },
  {
    id: 'wp-wall-desks-c',
    zone: 'wall-desks',
    position: walkWaypoint(PRIVATE_DESK_X - 0.55, PRIVATE_DESK_POSITIONS[2][2]),
  },
];

const ZONE_CHAT_ANCHORS: Record<AgentHomeZone, ChatAnchor> = {
  living: {
    position: LIVING_PUFF_SEAT,
    rotation: Math.atan2(
      MEETING_ZONE_POSITION[0] - LIVING_PUFF_SEAT[0],
      MEETING_ZONE_POSITION[2] - LIVING_PUFF_SEAT[2],
    ),
    posture: 'sit',
  },
  'center-desk': {
    position: hubPerimeterPosition(HUB_WAYPOINT_ANGLE + 0.08),
    rotation: Math.PI * 0.75,
    posture: 'stand',
  },
  cafeteria: {
    position: CAFE_STOOL_SEAT,
    rotation: Math.atan2(
      CAFE_HIGH_TABLE_LOCAL[0] - CAFE_PRIMARY_STOOL_LOCAL[0],
      CAFE_HIGH_TABLE_LOCAL[2] - CAFE_PRIMARY_STOOL_LOCAL[2],
    ),
    posture: 'sit',
  },
  'wall-desks': {
    position: [PRIVATE_DESK_X - 0.82, 0, PRIVATE_DESK_CENTER[2]],
    rotation: Math.PI * 0.92,
    posture: 'sit',
  },
};

function wallDeskChatAnchor(slot: 0 | 1 | 2): ChatAnchor {
  const deskZ = PRIVATE_DESK_POSITIONS[slot][2];
  return {
    position: [PRIVATE_DESK_X - 0.82, 0, deskZ],
    rotation: Math.PI * 0.92,
    posture: 'sit',
  };
}

export function getLivingRelaxWalkTarget(): [number, number, number] {
  return getLivingPuffStandPosition();
}

export function getZoneWaypoints(zone: AgentHomeZone): Waypoint[] {
  return ZONE_WAYPOINTS.filter((wp) => wp.zone === zone);
}

export function nearestZoneForPosition(
  position: [number, number, number],
): AgentHomeZone {
  const zones: AgentHomeZone[] = ['living', 'center-desk', 'cafeteria', 'wall-desks'];
  let bestZone: AgentHomeZone = 'living';
  let bestDist = Infinity;

  for (const zone of zones) {
    const index = nearestZoneWaypointIndex(zone, position);
    const waypoint = getZoneWaypoints(zone)[index];
    if (!waypoint) continue;
    const dx = waypoint.position[0] - position[0];
    const dz = waypoint.position[2] - position[2];
    const dist = dx * dx + dz * dz;
    if (dist < bestDist) {
      bestDist = dist;
      bestZone = zone;
    }
  }

  return bestZone;
}

export function getAgentChatAnchor(def: AgentDefinition): ChatAnchor {
  if (def.homeZone === 'wall-desks' && def.wallDeskSlot !== undefined) {
    return wallDeskChatAnchor(def.wallDeskSlot);
  }
  return ZONE_CHAT_ANCHORS[def.homeZone];
}

export function getAgentSpawnAnchor(def: AgentDefinition): ChatAnchor {
  const anchor = getAgentChatAnchor(def);

  if (anchor.posture === 'sit') {
    const standPosition = findStandPositionNearSeat([...anchor.position], [
      [0, 0.72],
      [0.55, 0.45],
      [-0.55, 0.45],
    ]);
    return {
      position: standPosition,
      rotation: anchor.rotation,
      posture: 'stand',
    };
  }

  return {
    ...anchor,
    position: findNearestWalkablePosition([...anchor.position]),
  };
}

export function getAgentPuffScale(def: AgentDefinition): number {
  if (def.homeZone === 'living') return MEETING_PRIMARY_PUFF_SCALE;
  return 1;
}

export function nearestZoneWaypointIndex(
  zone: AgentHomeZone,
  position: [number, number, number],
): number {
  const list = getZoneWaypoints(zone);
  if (list.length === 0) return 0;

  let best = 0;
  let bestDist = Infinity;
  list.forEach((wp, index) => {
    const dx = wp.position[0] - position[0];
    const dz = wp.position[2] - position[2];
    const dist = dx * dx + dz * dz;
    if (dist < bestDist) {
      bestDist = dist;
      best = index;
    }
  });
  return best;
}

export function isNearChatAnchor(
  position: [number, number, number],
  anchor: ChatAnchor,
): boolean {
  const dx = position[0] - anchor.position[0];
  const dz = position[2] - anchor.position[2];
  return Math.sqrt(dx * dx + dz * dz) <= CHAT_ARRIVAL_RADIUS;
}

export { CHAT_ARRIVAL_RADIUS };
