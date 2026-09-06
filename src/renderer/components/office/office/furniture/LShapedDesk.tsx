import { useMemo } from 'react';
import * as THREE from 'three';
import { FurnitureEdges, FURNITURE_EDGE_THRESHOLD } from './FurnitureEdges';
import { materials } from '../materials';
import { DESK_SCALE, hubChairOffsetZ } from './deskConstants';
import {
  CurvedMonitorGroup,
  DeskPropsSlot,
  ErgonomicChairMesh,
  KeyboardMouse,
  TFrameLegs,
  type ChairStyle,
  type DeskPropType,
} from './WorkstationParts';
import { PenCup } from './decor/SceneDecor';

export function LShapedDesk({
  position,
  rotation = 0,
  chairStyle = 'sage',
  deskProp = 'succulent',
  dualMonitor = false,
  corner = 'inner',
}: {
  position: [number, number, number];
  rotation?: number;
  chairStyle?: ChairStyle;
  deskProp?: DeskPropType;
  dualMonitor?: boolean;
  corner?: 'inner' | 'outer';
}) {
  const seatMat = useMemo(() => {
    const mats: Record<ChairStyle, THREE.MeshStandardMaterial> = {
      mesh: materials.chairMesh,
      tan: materials.chairTan,
      cream: materials.chairCream,
      white: materials.chairWhite,
      sage: materials.sage,
      forest: materials.chairForest,
      terracotta: materials.chairTerracotta,
    };
    return mats[chairStyle].clone();
  }, [chairStyle]);

  const flip = corner === 'inner' ? 1 : -1;
  const chairZ = hubChairOffsetZ(DESK_SCALE);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <group scale={[DESK_SCALE, DESK_SCALE, DESK_SCALE]}>
        <mesh position={[0, 0.41, 0.12 * flip]} castShadow receiveShadow material={materials.deskTop}>
          <boxGeometry args={[0.9, 0.05, 0.54]} />
          <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
        </mesh>
        <mesh position={[0.28 * flip, 0.41, -0.18 * flip]} castShadow receiveShadow material={materials.deskTop}>
          <boxGeometry args={[0.44, 0.05, 0.5]} />
          <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
        </mesh>

        <TFrameLegs
          points={[
            [-0.34, -0.04],
            [0.34, -0.04],
            [-0.34, 0.26],
            [0.46 * flip, -0.36 * flip],
            [0.1 * flip, -0.36 * flip],
          ]}
        />

        <group position={[0, 0, 0.05 * flip]}>
          <CurvedMonitorGroup dual={dualMonitor} />
        </group>

        <KeyboardMouse position={[0, 0.44, 0.08 * flip]} />
        <DeskPropsSlot type={deskProp} offset={[0.34 * flip, 0.41, 0.18 * flip]} />
        <PenCup position={[-0.22 * flip, 0.41, 0.12 * flip]} />
      </group>

      <ErgonomicChairMesh
        position={[0, 0, chairZ * flip]}
        rotation={Math.PI}
        color={seatMat}
        meshBack
      />
    </group>
  );
}
