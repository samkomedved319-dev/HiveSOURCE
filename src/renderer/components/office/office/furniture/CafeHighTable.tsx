import {
  CAFE_BAR_STOOL_RADIUS,
  CAFE_BAR_STOOL_SEAT_Y,
  CAFE_HIGH_TABLE_LOCAL,
  CAFE_HIGH_TABLE_TOP_Y,
} from './coffeeLoungeConstants';
import {
  FurnitureEdges,
  FURNITURE_EDGE_THRESHOLD,
  FURNITURE_EDGE_THRESHOLD_SOFT,
} from './FurnitureEdges';
import { materials } from '../materials';

const STOOL_ANGLES = [Math.PI / 2, Math.PI / 2 + 0.78, Math.PI / 2 - 0.78];

function rotationTowardTable(stoolX: number, stoolZ: number): number {
  const [tx, , tz] = CAFE_HIGH_TABLE_LOCAL;
  return Math.atan2(tx - stoolX, tz - stoolZ);
}

function BarStool({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: number;
}) {
  const seatY = CAFE_BAR_STOOL_SEAT_Y;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.015, 0]} castShadow material={materials.espresso}>
        <cylinderGeometry args={[0.095, 0.11, 0.03, 12]} />
      </mesh>
      <mesh position={[0, seatY / 2 - 0.02, 0]} material={materials.metal}>
        <cylinderGeometry args={[0.022, 0.026, seatY - 0.08, 8]} />
      </mesh>
      <mesh position={[0, 0.2, 0]} material={materials.metal}>
        <torusGeometry args={[0.11, 0.012, 8, 16]} />
      </mesh>
      <mesh position={[0, seatY - 0.03, 0]} castShadow material={materials.stoolGray}>
        <cylinderGeometry args={[0.13, 0.135, 0.05, 14]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
      </mesh>
      <mesh position={[0, seatY - 0.005, 0]} castShadow material={materials.terracottaLight}>
        <cylinderGeometry args={[0.115, 0.12, 0.028, 14]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
      </mesh>
    </group>
  );
}

export function CafeHighTable() {
  const topY = CAFE_HIGH_TABLE_TOP_Y;
  const legHeight = topY - 0.06;

  return (
    <group position={CAFE_HIGH_TABLE_LOCAL}>
      <mesh position={[0, 0.025, 0]} castShadow material={materials.espresso}>
        <cylinderGeometry args={[0.14, 0.16, 0.05, 12]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
      </mesh>
      <mesh position={[0, legHeight / 2, 0]} material={materials.metal}>
        <cylinderGeometry args={[0.038, 0.045, legHeight, 10]} />
      </mesh>
      <mesh position={[0, topY - 0.028, 0]} castShadow material={materials.woodLight}>
        <cylinderGeometry args={[0.3, 0.3, 0.055, 20]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
      </mesh>
      <mesh position={[0, topY, 0]} castShadow material={materials.woodTable}>
        <cylinderGeometry args={[0.29, 0.29, 0.018, 20]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
      </mesh>

      <mesh position={[0.08, topY + 0.012, 0.06]} material={materials.mug}>
        <cylinderGeometry args={[0.028, 0.032, 0.05, 8]} />
      </mesh>
      <mesh position={[-0.1, topY + 0.011, -0.05]} material={materials.mug}>
        <cylinderGeometry args={[0.024, 0.028, 0.045, 8]} />
      </mesh>

      {STOOL_ANGLES.map((angle, i) => {
        const x = Math.sin(angle) * CAFE_BAR_STOOL_RADIUS;
        const z = Math.cos(angle) * CAFE_BAR_STOOL_RADIUS;
        return (
          <BarStool
            key={i}
            position={[x, 0, z]}
            rotation={rotationTowardTable(x, z)}
          />
        );
      })}
    </group>
  );
}
