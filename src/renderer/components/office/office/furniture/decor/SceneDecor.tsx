import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import {
  FurnitureEdges,
  FURNITURE_EDGE_THRESHOLD,
  FURNITURE_EDGE_THRESHOLD_SOFT,
} from '../FurnitureEdges';
import { materials } from '../../materials';

export const BEAN_BAG_SEAT_Y = 0.36;

export function StringLights({
  start,
  count,
  spacing,
  height = 1.55,
  depth = -0.35,
}: {
  start: [number, number, number];
  count: number;
  spacing: number;
  height?: number;
  depth?: number;
}) {
  const bulbRefs = useRef<(THREE.Mesh | null)[]>([]);
  const [sx, , sz] = start;
  const z = sz + depth;
  const span = (count - 1) * spacing;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    bulbRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const flicker = 0.82 + Math.sin(t * 2.4 + i * 1.7) * 0.12 + Math.sin(t * 5.1 + i * 0.9) * 0.06;
      mat.emissiveIntensity = flicker;
      mesh.scale.setScalar(0.92 + flicker * 0.1);
    });
  });

  return (
    <group>
      <mesh position={[sx + span / 2, height + 0.05, z - 0.02]} material={materials.metal}>
        <boxGeometry args={[span + 0.4, 0.012, 0.012]} />
      </mesh>
      {Array.from({ length: count }, (_, i) => (
        <group key={i} position={[sx + i * spacing, height, z]}>
          <mesh
            ref={(el) => {
              bulbRefs.current[i] = el;
            }}
            material={materials.stringLight}
          >
            <sphereGeometry args={[0.045, 8, 8]} />
          </mesh>
          <pointLight intensity={0.2} color="#ffedb8" distance={2.8} decay={2} />
        </group>
      ))}
    </group>
  );
}

export function BeanBag({
  position,
  color,
  scale = 1,
  rotation = 0,
}: {
  position: [number, number, number];
  color: THREE.MeshStandardMaterial;
  scale?: number;
  rotation?: number;
}) {
  const mat = color.clone();
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <RoundedBox
        args={[0.76, 0.28, 0.76]}
        radius={0.05}
        smoothness={3}
        position={[0, 0.16, 0]}
        castShadow
        receiveShadow
        material={mat}
      >
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
      </RoundedBox>
      <mesh position={[0, BEAN_BAG_SEAT_Y, 0]} castShadow receiveShadow material={mat}>
        <boxGeometry args={[0.72, 0.1, 0.72]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
      </mesh>
    </group>
  );
}

export function ZoneMat({
  position,
  size,
  variant = 'sage',
  elevation = 0.013,
}: {
  position: [number, number, number];
  size: [number, number];
  variant?: 'sage' | 'jute' | 'transition';
  elevation?: number;
}) {
  const mat =
    variant === 'sage'
      ? materials.zoneMatSage
      : variant === 'jute'
        ? materials.rugWeave
        : materials.matTransition;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[position[0], elevation, position[2]]}
      receiveShadow
      material={mat}
    >
      <planeGeometry args={size} />
    </mesh>
  );
}

export function WallNotes({
  position,
  rotation = [0, 0, 0] as [number, number, number],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const notes: [number, number, number, number, number][] = [
    [0, 0.08, 0, 0.14, 0.1],
    [0.18, -0.05, 0, 0.1, 0.08],
    [-0.15, -0.12, 0, 0.12, 0.09],
    [0.08, 0.2, 0, 0.08, 0.06],
  ];
  return (
    <group position={position} rotation={rotation}>
      {notes.map(([x, y, z, w, h], i) => (
        <mesh
          key={i}
          position={[x, y, z]}
          rotation={[0, 0, (i - 1) * 0.08]}
          material={i % 2 ? materials.notebook : materials.mug}
        >
          <boxGeometry args={[w, h, 0.004]} />
        </mesh>
      ))}
    </group>
  );
}

export function DeskCactus({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh material={materials.plantPot}>
        <cylinderGeometry args={[0.05, 0.055, 0.06, 8]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow material={materials.plant}>
        <cylinderGeometry args={[0.025, 0.028, 0.12, 6]} />
      </mesh>
      <mesh position={[0.03, 0.14, 0]} castShadow material={materials.plantDark}>
        <cylinderGeometry args={[0.02, 0.022, 0.08, 6]} />
      </mesh>
    </group>
  );
}

export function DeskSucculent({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.04, 0]} material={materials.plantPot}>
        <cylinderGeometry args={[0.04, 0.045, 0.045, 8]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
      </mesh>
      <mesh position={[0, 0.085, 0]} castShadow material={materials.plant}>
        <sphereGeometry args={[0.045, 6, 5]} />
      </mesh>
    </group>
  );
}

export function DeskMug({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh material={materials.mug}>
        <cylinderGeometry args={[0.035, 0.038, 0.07, 10]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
      </mesh>
      <mesh position={[0, 0.035, 0.03]} material={materials.terracotta}>
        <boxGeometry args={[0.05, 0.01, 0.02]} />
      </mesh>
    </group>
  );
}

export function DeskNotebook({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, 0.4, 0]}>
      <mesh material={materials.notebook}>
        <boxGeometry args={[0.14, 0.008, 0.1]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
      </mesh>
      <mesh position={[0, 0.005, 0]} material={materials.sage}>
        <boxGeometry args={[0.1, 0.004, 0.08]} />
      </mesh>
    </group>
  );
}

export function PenCup({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh material={materials.potCeramic}>
        <cylinderGeometry args={[0.03, 0.035, 0.05, 8]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
      </mesh>
      <mesh position={[0.01, 0.06, 0]} rotation={[0.1, 0, 0.2]} material={materials.metal}>
        <boxGeometry args={[0.004, 0.05, 0.004]} />
      </mesh>
      <mesh position={[-0.01, 0.055, 0.01]} rotation={[0, 0, -0.15]} material={materials.sage}>
        <boxGeometry args={[0.004, 0.045, 0.004]} />
      </mesh>
    </group>
  );
}

export function Terrarium({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh material={materials.woodLight}>
        <cylinderGeometry args={[0.1, 0.11, 0.05, 10]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
      </mesh>
      <mesh position={[0, 0.11, 0]} material={materials.glass}>
        <sphereGeometry args={[0.095, 10, 8]} />
      </mesh>
      <mesh position={[0, 0.1, 0]} material={materials.plant}>
        <sphereGeometry args={[0.045, 6, 5]} />
      </mesh>
    </group>
  );
}

export function CeramicFloorPlant({
  position,
  variant = 'tall',
}: {
  position: [number, number, number];
  variant?: 'tall' | 'compact';
}) {
  const scale = variant === 'compact' ? 0.72 : 1;
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.24, 0]} castShadow material={materials.potCeramic}>
        <cylinderGeometry args={[0.26, 0.28, 0.48, 14]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow material={materials.plantDark}>
        <boxGeometry args={[0.1, 0.45, 0.08]} />
      </mesh>
      <mesh position={[0.08, 0.95, 0.02]} castShadow material={materials.plant}>
        <boxGeometry args={[0.28, 0.35, 0.14]} />
      </mesh>
      <mesh position={[-0.06, 0.82, -0.04]} castShadow material={materials.plantDark}>
        <boxGeometry args={[0.18, 0.22, 0.1]} />
      </mesh>
    </group>
  );
}

export function WallTextureStripes({
  width,
  height,
  depth,
}: {
  width: number;
  height: number;
  depth: number;
}) {
  const count = Math.floor(width / 0.35);
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          position={[-width / 2 + 0.2 + i * 0.35, height / 2, depth]}
          material={materials.wallStripe}
        >
          <boxGeometry args={[0.04, height * 0.9, 0.01]} />
        </mesh>
      ))}
    </group>
  );
}
