import {
  DESK_SCALE,
  HUB_DESK_PLACEMENTS,
  HUB_DESK_RADIUS,
  HUB_COLLISION_HALF_X,
  HUB_COLLISION_HALF_Z,
  PRIVATE_DESK_MAX_Z,
  PRIVATE_DESK_MIN_Z,
  PRIVATE_DESK_POSITIONS,
  PRIVATE_DESK_SPACING_Z,
  PRIVATE_DESK_X,
  workstationChairOffsetZ,
} from '@/components/office/office/furniture/deskConstants';
import {
  BAR_STATION_LOCAL_Z,
  CAFE_BAR_STOOL_RADIUS,
  CAFE_WALL_PLANT_LOCAL,
  CAFE_HIGH_TABLE_LOCAL,
  COFFEE_LOUNGE_POSITION,
} from '@/components/office/office/furniture/coffeeLoungeConstants';
import {
  MEETING_PUFF_LAYOUT,
  MEETING_TABLE_RADIUS,
  MEETING_ZONE_POSITION,
} from '@/components/office/office/furniture/meetingConstants';
import { PERIMETER_PLANTS } from '@/components/office/config/officePerimeterPlants';

export const AGENT_COLLISION_RADIUS = 0.25;

export const SCENE_WALK_BOUNDS = {
  minX: -6.5,
  maxX: 7,
  minZ: -5.5,
  maxZ: 5,
} as const;

export type CircleObstacle = {
  kind: 'circle';
  x: number;
  z: number;
  radius: number;
};

export type BoxObstacle = {
  kind: 'box';
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type OfficeObstacle = CircleObstacle | BoxObstacle;

const HUB_X = 0.5;
const HUB_Z = 1.05;
const HUB_PERIMETER_MARGIN = 0.38;
const [MEETING_X, , MEETING_Z] = MEETING_ZONE_POSITION;
const [LOUNGE_X, , LOUNGE_Z] = COFFEE_LOUNGE_POSITION;
const PRIVATE_WALL_X = PRIVATE_DESK_X - 0.3;

const PLANT_RADIUS: Record<'small' | 'medium' | 'tall' | 'fiddle' | 'snake', number> = {
  small: 0.3,
  medium: 0.36,
  tall: 0.4,
  fiddle: 0.44,
  snake: 0.36,
};

const CAFE_STOOL_ANGLES = [Math.PI / 2, Math.PI / 2 + 0.78, Math.PI / 2 - 0.78];

function loungeWorld(lx: number, lz: number): { x: number; z: number } {
  return { x: LOUNGE_X + lx, z: LOUNGE_Z + lz };
}

function meetingWorld(lx: number, lz: number): { x: number; z: number } {
  return { x: MEETING_X + lx, z: MEETING_Z + lz };
}

function circleObstacle(x: number, z: number, radius: number): CircleObstacle {
  return { kind: 'circle', x, z, radius };
}

function boxObstacle(
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
): BoxObstacle {
  return { kind: 'box', minX, maxX, minZ, maxZ };
}

function wallObstacles(): BoxObstacle[] {
  const pad = 0.42;
  const { minX, maxX, minZ, maxZ } = SCENE_WALK_BOUNDS;
  return [
    boxObstacle(minX - 2, maxX + 2, minZ - 2, minZ + pad),
    boxObstacle(minX - 2, minX + pad, minZ - 2, maxZ + 2),
    boxObstacle(maxX - pad, maxX + 2, minZ - 2, maxZ + 2),
    boxObstacle(minX - 2, maxX + 2, maxZ - pad, maxZ + 2),
  ];
}

function rotateXZ(x: number, z: number, angle: number): [number, number] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x * c - z * s, x * s + z * c];
}

function hubDeskSegmentBox(
  deskOffsetX: number,
  deskOffsetZ: number,
  rotation: number,
  localCx: number,
  localCz: number,
  localHalfX: number,
  localHalfZ: number,
  padding = 0.08,
): BoxObstacle {
  const cx = localCx * DESK_SCALE;
  const cz = localCz * DESK_SCALE;
  const hx = localHalfX * DESK_SCALE + padding;
  const hz = localHalfZ * DESK_SCALE + padding;

  const corners = [
    [cx - hx, cz - hz],
    [cx + hx, cz - hz],
    [cx - hx, cz + hz],
    [cx + hx, cz + hz],
  ].map(([lx, lz]) => rotateXZ(lx, lz, rotation));

  const xs = corners.map(([x]) => HUB_X + deskOffsetX + x);
  const zs = corners.map(([, z]) => HUB_Z + deskOffsetZ + z);
  return boxObstacle(Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs));
}

const HUB_DESK_COLLISION_PADDING = 0.14;
const HUB_CHAIR_RADIUS = 0.32;
const HUB_INNER_CORNER_OFFSET = 0.38;
const HUB_INNER_CORNER_RADIUS = 0.3;

function hubObstacles(): OfficeObstacle[] {
  const chairLocalZ = workstationChairOffsetZ(DESK_SCALE);
  const obstacles: OfficeObstacle[] = [];

  for (const { offset, rotation } of HUB_DESK_PLACEMENTS) {
    const [dx, dz] = offset;

    obstacles.push(
      hubDeskSegmentBox(
        dx,
        dz,
        rotation,
        0,
        0,
        HUB_COLLISION_HALF_X,
        HUB_COLLISION_HALF_Z,
        HUB_DESK_COLLISION_PADDING,
      ),
    );

    const [chairX, chairZ] = rotateXZ(0, chairLocalZ, rotation);
    obstacles.push(
      circleObstacle(HUB_X + dx + chairX, HUB_Z + dz + chairZ, HUB_CHAIR_RADIUS),
    );
  }

  obstacles.push(circleObstacle(HUB_X, HUB_Z, 0.2 * DESK_SCALE));

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      obstacles.push(
        circleObstacle(
          HUB_X + sx * HUB_INNER_CORNER_OFFSET,
          HUB_Z + sz * HUB_INNER_CORNER_OFFSET,
          HUB_INNER_CORNER_RADIUS,
        ),
      );
    }
  }

  return obstacles;
}

function meetingObstacles(): OfficeObstacle[] {
  const table = meetingWorld(0, 0);
  const board = meetingWorld(-1.62, 0.05);

  return [
    circleObstacle(table.x, table.z, MEETING_TABLE_RADIUS + 0.22),
    boxObstacle(board.x - 0.2, board.x + 0.95, board.z - 0.55, board.z + 0.55),
    ...MEETING_PUFF_LAYOUT.map(({ position, scale }) => {
      const world = meetingWorld(position[0], position[2]);
      return circleObstacle(world.x, world.z, 0.44 * scale + 0.08);
    }),
  ];
}

function coffeeLoungeObstacles(): OfficeObstacle[] {
  const bar = loungeWorld(0, BAR_STATION_LOCAL_Z);
  const highTable = loungeWorld(CAFE_HIGH_TABLE_LOCAL[0], CAFE_HIGH_TABLE_LOCAL[2]);

  const obstacles: OfficeObstacle[] = [
    boxObstacle(bar.x - 1.35, bar.x + 1.35, bar.z - 0.28, bar.z + 0.32),
    circleObstacle(highTable.x, highTable.z, 0.3),
    ...CAFE_WALL_PLANT_LOCAL.map(([lx, , lz]) => {
      const world = loungeWorld(lx, lz);
      return circleObstacle(world.x, world.z, PLANT_RADIUS.snake + 0.06);
    }),
  ];

  for (const angle of CAFE_STOOL_ANGLES) {
    const lx = CAFE_HIGH_TABLE_LOCAL[0] + Math.sin(angle) * CAFE_BAR_STOOL_RADIUS;
    const lz = CAFE_HIGH_TABLE_LOCAL[2] + Math.cos(angle) * CAFE_BAR_STOOL_RADIUS;
    const stool = loungeWorld(lx, lz);
    obstacles.push(circleObstacle(stool.x, stool.z, 0.24));
  }

  return obstacles;
}

function privateDeskObstacles(): OfficeObstacle[] {
  const chairReach = workstationChairOffsetZ(DESK_SCALE) * 0.55 + 0.35;
  const obstacles: OfficeObstacle[] = PRIVATE_DESK_POSITIONS.map(([, , z]) =>
    circleObstacle(PRIVATE_DESK_X - chairReach * 0.35, z, 0.52),
  );

  const gapA = PRIVATE_DESK_MIN_Z + PRIVATE_DESK_SPACING_Z / 2;
  const gapB = PRIVATE_DESK_MAX_Z - PRIVATE_DESK_SPACING_Z / 2;

  obstacles.push(
    circleObstacle(PRIVATE_WALL_X, gapA, PLANT_RADIUS.snake),
    circleObstacle(PRIVATE_WALL_X, gapB, PLANT_RADIUS.medium),
    circleObstacle(PRIVATE_WALL_X, PRIVATE_DESK_MIN_Z - 0.58, PLANT_RADIUS.tall),
    circleObstacle(PRIVATE_WALL_X, PRIVATE_DESK_MAX_Z + 0.52, PLANT_RADIUS.fiddle),
    circleObstacle(PRIVATE_WALL_X - 0.06, PRIVATE_DESK_MAX_Z + 0.12, 0.24),
    circleObstacle(PRIVATE_WALL_X, PRIVATE_DESK_MIN_Z - 0.18, PLANT_RADIUS.small),
  );

  return obstacles;
}

function scatteredPlants(): CircleObstacle[] {
  return PERIMETER_PLANTS.map(({ position, variant }) =>
    circleObstacle(position[0], position[2], PLANT_RADIUS[variant]),
  );
}

export const OFFICE_OBSTACLES: OfficeObstacle[] = [
  ...wallObstacles(),
  ...hubObstacles(),
  ...meetingObstacles(),
  ...coffeeLoungeObstacles(),
  ...privateDeskObstacles(),
  ...scatteredPlants(),
];

export const HUB_PERIMETER_RADIUS =
  HUB_DESK_RADIUS + workstationChairOffsetZ(DESK_SCALE) + AGENT_COLLISION_RADIUS + 0.18;

export function hubPerimeterPosition(angleRad: number, margin = 0.35): [number, number, number] {
  const dist = HUB_PERIMETER_RADIUS + margin - HUB_PERIMETER_MARGIN;
  return [HUB_X + Math.cos(angleRad) * dist, 0, HUB_Z + Math.sin(angleRad) * dist];
}

export function isWithinWalkBounds(x: number, z: number): boolean {
  return (
    x >= SCENE_WALK_BOUNDS.minX + AGENT_COLLISION_RADIUS &&
    x <= SCENE_WALK_BOUNDS.maxX - AGENT_COLLISION_RADIUS &&
    z >= SCENE_WALK_BOUNDS.minZ + AGENT_COLLISION_RADIUS &&
    z <= SCENE_WALK_BOUNDS.maxZ - AGENT_COLLISION_RADIUS
  );
}

export function clampToWalkBounds(x: number, z: number): [number, number] {
  const pad = AGENT_COLLISION_RADIUS + 0.04;
  return [
    Math.max(SCENE_WALK_BOUNDS.minX + pad, Math.min(SCENE_WALK_BOUNDS.maxX - pad, x)),
    Math.max(SCENE_WALK_BOUNDS.minZ + pad, Math.min(SCENE_WALK_BOUNDS.maxZ - pad, z)),
  ];
}

export function isFurnitureOccupiedPosition(
  x: number,
  z: number,
  radius = 0.14,
): boolean {
  return OFFICE_OBSTACLES.some((obs) => {
    if (obs.kind === 'circle') {
      const dx = x - obs.x;
      const dz = z - obs.z;
      return dx * dx + dz * dz < (obs.radius + radius) ** 2;
    }
    return x >= obs.minX - radius && x <= obs.maxX + radius && z >= obs.minZ - radius && z <= obs.maxZ + radius;
  });
}
