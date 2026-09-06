export const DESK_SCALE = 1.65;
export const HUB_DESK_RADIUS = 0.92 * DESK_SCALE;

const L_DESK_FRONT_Z = 0.12 + 0.54 / 2;
const WORKSTATION_FRONT_Z = 0.6 / 2;
const CHAIR_HALF_DEPTH = 0.26;
const CHAIR_GAP = 0.16;

export function hubChairOffsetZ(scale = DESK_SCALE): number {
  return L_DESK_FRONT_Z * scale + CHAIR_GAP + CHAIR_HALF_DEPTH;
}

export const HUB_WORKSTATION_HALF_X = 0.525;
export const HUB_WORKSTATION_HALF_Z = 0.3;

export const HUB_COLLISION_HALF_X = HUB_WORKSTATION_HALF_X + 0.05;
export const HUB_COLLISION_HALF_Z = HUB_WORKSTATION_HALF_Z + 0.08;

export const HUB_DESK_PLACEMENTS = [
  { offset: [0, -HUB_DESK_RADIUS] as const, rotation: Math.PI },
  { offset: [0, HUB_DESK_RADIUS] as const, rotation: 0 },
  { offset: [-HUB_DESK_RADIUS, 0] as const, rotation: -Math.PI / 2 },
  { offset: [HUB_DESK_RADIUS, 0] as const, rotation: Math.PI / 2 },
] as const;

export function workstationChairOffsetZ(scale = DESK_SCALE): number {
  return WORKSTATION_FRONT_Z * scale + CHAIR_GAP + CHAIR_HALF_DEPTH;
}

const RIGHT_WALL_INNER_X = 7.15 - 0.09;
const PRIVATE_DESK_DEPTH_HALF = (0.6 * DESK_SCALE) / 2;

export const PRIVATE_DESK_X = RIGHT_WALL_INNER_X - PRIVATE_DESK_DEPTH_HALF - 0.025;
export const PRIVATE_DESK_WIDTH_Z = 1.05 * DESK_SCALE;
export const PRIVATE_DESK_GAP_Z = 0.3;
export const PRIVATE_DESK_SPACING_Z = PRIVATE_DESK_WIDTH_Z + PRIVATE_DESK_GAP_Z;

const PRIMARY_DESK_Z = 1.12;

const PRIVATE_DESK_Z_POSITIONS = [
  PRIMARY_DESK_Z,
  PRIMARY_DESK_Z - PRIVATE_DESK_SPACING_Z,
  PRIMARY_DESK_Z + PRIVATE_DESK_SPACING_Z,
];

export const PRIVATE_DESK_POSITIONS: [number, number, number][] = PRIVATE_DESK_Z_POSITIONS.map(
  (z) => [PRIVATE_DESK_X, 0, z],
);

export const PRIVATE_DESK_POSITION = PRIVATE_DESK_POSITIONS[0];

export const PRIVATE_DESK_MIN_Z = Math.min(...PRIVATE_DESK_Z_POSITIONS);
export const PRIVATE_DESK_MAX_Z = Math.max(...PRIVATE_DESK_Z_POSITIONS);
export const PRIVATE_DESK_SPAN_Z = PRIVATE_DESK_MAX_Z - PRIVATE_DESK_MIN_Z + PRIVATE_DESK_WIDTH_Z;

export const PRIVATE_DESK_CENTER: [number, number, number] = [
  PRIVATE_DESK_X,
  0,
  (PRIVATE_DESK_MIN_Z + PRIVATE_DESK_MAX_Z) / 2,
];
