import {
  FurnitureEdges,
  FURNITURE_EDGE_THRESHOLD_SHELF,
} from './FurnitureEdges';
import {
  PRIVATE_DESK_CENTER,
  PRIVATE_DESK_MAX_Z,
  PRIVATE_DESK_MIN_Z,
  PRIVATE_DESK_POSITIONS,
  PRIVATE_DESK_SPACING_Z,
  PRIVATE_DESK_SPAN_Z,
  PRIVATE_DESK_X,
} from './deskConstants';
import { Plant } from './Plants';
import {
  CeramicFloorPlant,
  DeskCactus,
  Terrarium,
  ZoneMat,
} from './decor/SceneDecor';
import { Workstation, type ChairStyle, type DeskPropType } from './Workstation';
import { materials } from '../materials';

const DESK_ROTATION = -Math.PI / 2;

const DESK_VARIANTS: { chairStyle: ChairStyle; props: DeskPropType }[] = [
  { chairStyle: 'forest', props: 'succulent' },
  { chairStyle: 'terracotta', props: 'mug' },
  { chairStyle: 'sage', props: 'notebook' },
];

function DeskShelf({ side = 1 }: { side?: 1 | -1 }) {
  const x = 0.58 * side;
  const rotY = side > 0 ? -Math.PI / 2 : Math.PI / 2;

  return (
    <group position={[x, 0, 0]} rotation={[0, rotY, 0]}>
      {[0.88, 1.28, 1.68].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh castShadow material={materials.woodLight}>
            <boxGeometry args={[0.72, 0.04, 0.22]} />
            <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SHELF} />
          </mesh>
        </group>
      ))}
      <Terrarium position={[0, 1.72, 0.08]} />
      <DeskCactus position={[0, 1.32, -0.1]} />
    </group>
  );
}

function PrivateDeskUnit({
  position,
  variantIndex,
}: {
  position: [number, number, number];
  variantIndex: number;
}) {
  const { chairStyle, props } = DESK_VARIANTS[variantIndex % DESK_VARIANTS.length];

  return (
    <group position={position}>
      <Workstation position={[0, 0, 0]} rotation={DESK_ROTATION} chairStyle={chairStyle} props={props} />
      {variantIndex === 0 && <DeskShelf side={1} />}
    </group>
  );
}

export function PrivateDesk() {
  const [, , centerZ] = PRIVATE_DESK_CENTER;
  const wallSideX = PRIVATE_DESK_X - 0.3;
  const gapA = PRIVATE_DESK_MIN_Z + PRIVATE_DESK_SPACING_Z / 2;
  const gapB = PRIVATE_DESK_MAX_Z - PRIVATE_DESK_SPACING_Z / 2;

  return (
    <group>
      <ZoneMat
        position={[PRIVATE_DESK_X - 0.52, 0, centerZ]}
        size={[2.05, PRIVATE_DESK_SPAN_Z + 0.55]}
        variant="transition"
      />

      {PRIVATE_DESK_POSITIONS.map((position, i) => (
        <PrivateDeskUnit key={i} position={position} variantIndex={i} />
      ))}

      <Plant position={[wallSideX, 0, gapA]} variant="snake" />
      <Plant position={[wallSideX, 0, gapB]} variant="medium" />
      <Plant position={[wallSideX, 0, PRIVATE_DESK_MIN_Z - 0.58]} variant="tall" />
      <Plant position={[wallSideX, 0, PRIVATE_DESK_MAX_Z + 0.52]} variant="fiddle" />
      <CeramicFloorPlant position={[wallSideX - 0.06, 0, PRIVATE_DESK_MAX_Z + 0.12]} variant="compact" />
      <Plant position={[wallSideX, 0, PRIVATE_DESK_MIN_Z - 0.18]} variant="small" />
    </group>
  );
}
