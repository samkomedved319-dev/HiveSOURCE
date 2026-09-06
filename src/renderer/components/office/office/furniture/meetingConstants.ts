const LEFT_WALL_INNER_X = -6.85 + 0.09;

export const MEETING_RUG_OUTER: [number, number] = [3.85, 3.55];
export const MEETING_RUG_INNER: [number, number] = [3.35, 3.05];

const MEETING_RUG_HALF_X = MEETING_RUG_OUTER[0] / 2;

export const MEETING_ZONE_POSITION: [number, number, number] = [
  LEFT_WALL_INNER_X + MEETING_RUG_HALF_X + 0.06,
  0,
  0.08,
];

export const MEETING_TABLE_RADIUS = 1.02;
export const MEETING_TABLE_TOP_Y = 0.52;

const PUFF_RING_RADIUS = 1.82;

function puffOnRing(index: number, count: number, scale: number) {
  const angle = -Math.PI / 2 + (index / count) * Math.PI * 2 + 0.12;
  return {
    position: [
      Math.sin(angle) * PUFF_RING_RADIUS,
      0,
      Math.cos(angle) * PUFF_RING_RADIUS,
    ] as [number, number, number],
    scale,
  };
}

export const MEETING_PUFF_LAYOUT: {
  position: [number, number, number];
  scale: number;
}[] = [
  puffOnRing(1, 6, 0.86),
  puffOnRing(2, 6, 0.92),
  puffOnRing(3, 6, 0.88),
  puffOnRing(4, 6, 0.86),
  puffOnRing(5, 6, 0.91),
];

const MEETING_PRIMARY_PUFF_ENTRY = MEETING_PUFF_LAYOUT.reduce((best, entry) =>
  entry.position[2] > best.position[2] ? entry : best,
);

export const MEETING_PRIMARY_PUFF = MEETING_PRIMARY_PUFF_ENTRY.position;
export const MEETING_PRIMARY_PUFF_SCALE = MEETING_PRIMARY_PUFF_ENTRY.scale;
