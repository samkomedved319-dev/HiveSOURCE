import { FurnitureEdges, FURNITURE_EDGE_THRESHOLD } from './FurnitureEdges';
import { useMemo } from 'react';
import * as THREE from 'three';
import { materials } from '../materials';
import { DESK_SCALE, workstationChairOffsetZ } from './deskConstants';
import {
  CurvedMonitorGroup,
  DeskPropsSlot,
  ErgonomicChairMesh,
  KeyboardMouse,
  TFrameLegs,
  type ChairStyle,
  type DeskPropType,
} from './WorkstationParts';

export type { ChairStyle, DeskPropType };

interface WorkstationProps {
  position: [number, number, number];
  rotation?: number;
  chairStyle?: ChairStyle;
  props?: DeskPropType;
  dualMonitor?: boolean;
}

export function Workstation({
  position,
  rotation = 0,
  chairStyle = 'sage',
  props: deskProp = 'succulent',
  dualMonitor = false,
}: WorkstationProps) {
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

  const chairZ = workstationChairOffsetZ(DESK_SCALE);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <group scale={[DESK_SCALE, DESK_SCALE, DESK_SCALE]}>
        <mesh position={[0, 0.41, 0]} castShadow receiveShadow material={materials.deskTop}>
          <boxGeometry args={[1.05, 0.05, 0.6]} />
          <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
        </mesh>

        <TFrameLegs
          points={[
            [-0.4, -0.2],
            [0.4, -0.2],
            [-0.4, 0.2],
            [0.4, 0.2],
          ]}
        />

        <CurvedMonitorGroup dual={dualMonitor} />
        <KeyboardMouse position={[0, 0.44, 0.1]} />
        <DeskPropsSlot type={deskProp} offset={[0.34, 0.41, 0.12]} />
      </group>

      <ErgonomicChairMesh
        position={[0, 0, chairZ]}
        rotation={Math.PI}
        color={seatMat}
        meshBack
      />
    </group>
  );
}

export { ErgonomicChairMesh } from './WorkstationParts';