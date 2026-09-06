import type * as THREE from 'three';
import { FurnitureEdges, FURNITURE_EDGE_THRESHOLD, FURNITURE_EDGE_THRESHOLD_SOFT } from './FurnitureEdges';
import { materials } from '../materials';
import {
  MEETING_PUFF_LAYOUT,
  MEETING_RUG_INNER,
  MEETING_RUG_OUTER,
  MEETING_TABLE_RADIUS,
  MEETING_TABLE_TOP_Y,
  MEETING_ZONE_POSITION,
} from './meetingConstants';
import { BeanBag, DeskNotebook, WallNotes } from './decor/SceneDecor';
import { LivingWallClock } from './decor/LivingWallClock';
import { MiniScreenGlow } from './decor/GlowingScreen';

const PUFF_COLORS: THREE.MeshStandardMaterial[] = [
  materials.beanBagTerracotta,
  materials.beanBagSage,
  materials.beanBagTerracottaLight,
  materials.beanBagSage,
  materials.olive,
];

export function MeetingZone() {
  return (
    <group position={MEETING_ZONE_POSITION}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow material={materials.rug}>
        <planeGeometry args={MEETING_RUG_OUTER} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow material={materials.rugWeave}>
        <planeGeometry args={MEETING_RUG_INNER} />
      </mesh>

      <mesh position={[0, MEETING_TABLE_TOP_Y - 0.085, 0]} castShadow material={materials.woodTable}>
        <cylinderGeometry args={[MEETING_TABLE_RADIUS, MEETING_TABLE_RADIUS + 0.02, 0.09, 22]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
      </mesh>
      <mesh position={[0, MEETING_TABLE_TOP_Y / 2 - 0.04, 0]} material={materials.woodDark}>
        <cylinderGeometry args={[0.065, 0.075, MEETING_TABLE_TOP_Y - 0.08, 10]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
      </mesh>

      <DeskNotebook position={[0.12, MEETING_TABLE_TOP_Y + 0.02, 0.08]} />

      {MEETING_PUFF_LAYOUT.map(({ position, scale }, i) => (
        <BeanBag
          key={i}
          position={position}
          color={PUFF_COLORS[i % PUFF_COLORS.length]}
          scale={scale}
        />
      ))}

      <group position={[-1.62, 0, 0.05]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 1.12, 0]} material={materials.metal}>
          <boxGeometry args={[1.65, 0.05, 0.07]} />
          <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
        </mesh>
        <mesh position={[0, 1.12, 0.045]} material={materials.whiteboard}>
          <boxGeometry args={[1.5, 0.92, 0.02]} />
          <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
        </mesh>
        <mesh position={[-0.42, 1.22, 0.055]} material={materials.sage}>
          <boxGeometry args={[0.36, 0.05, 0.008]} />
        </mesh>
        <mesh position={[0.05, 1.08, 0.055]} material={materials.terracotta}>
          <boxGeometry args={[0.28, 0.2, 0.008]} />
        </mesh>
        <MiniScreenGlow position={[0.35, 1.28, 0.059]} size={[0.18, 0.14, 0.008]} />
        <mesh position={[-0.15, 0.86, 0.055]} material={materials.sageDark}>
          <boxGeometry args={[0.5, 0.04, 0.008]} />
        </mesh>
        <mesh position={[0.22, 0.92, 0.055]} material={materials.terracottaLight}>
          <boxGeometry args={[0.12, 0.12, 0.008]} />
        </mesh>
        <mesh position={[-0.05, 1.02, 0.056]} material={materials.metal}>
          <boxGeometry args={[0.08, 0.08, 0.008]} />
        </mesh>
      </group>

      <WallNotes position={[-1.32, 0.95, 0.12]} rotation={[0, Math.PI / 2, 0]} />
      <LivingWallClock position={[-1.55, 0, -1.15]} />
    </group>
  );
}
