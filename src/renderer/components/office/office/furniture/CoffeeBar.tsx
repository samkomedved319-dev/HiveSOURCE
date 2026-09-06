import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CoffeeSteam } from './decor/CoffeeSteam';
import {
  FurnitureEdges,
  FURNITURE_EDGE_THRESHOLD,
  FURNITURE_EDGE_THRESHOLD_SOFT,
} from './FurnitureEdges';
import { materials } from '../materials';

export function CoffeeGrinder({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow material={materials.espresso}>
        <boxGeometry args={[0.15, 0.3, 0.15]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
      </mesh>
      <mesh position={[0, 0.19, 0]} castShadow material={materials.metal}>
        <cylinderGeometry args={[0.075, 0.085, 0.11, 12]} />
      </mesh>
      <mesh position={[0, 0.27, 0]} material={materials.espresso}>
        <cylinderGeometry args={[0.05, 0.055, 0.04, 10]} />
      </mesh>
      <mesh position={[0.06, 0.22, 0]} rotation={[0, 0, -0.35]} material={materials.metal}>
        <boxGeometry args={[0.04, 0.012, 0.018]} />
      </mesh>
    </group>
  );
}

export function EspressoMachine({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const displayMat = useMemo(() => materials.underGlow.clone(), []);
  const displayRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    displayMat.emissiveIntensity = 0.55 + Math.sin(clock.elapsedTime * 3.2) * 0.18;
    if (displayRef.current) {
      displayRef.current.scale.x = 1 + Math.sin(clock.elapsedTime * 4.5) * 0.02;
    }
  });

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.03, 0.06]} castShadow material={materials.metal}>
        <boxGeometry args={[0.58, 0.06, 0.38]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
      </mesh>
      {[-0.18, -0.06, 0.06, 0.18].map((x, i) => (
        <mesh key={i} position={[x, 0.065, 0.14]} material={materials.espresso}>
          <boxGeometry args={[0.04, 0.008, 0.14]} />
        </mesh>
      ))}

      <mesh position={[0, 0.29, -0.04]} castShadow material={materials.espresso}>
        <boxGeometry args={[0.5, 0.42, 0.3]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
      </mesh>

      <mesh position={[0, 0.37, 0.08]} material={materials.metal}>
        <boxGeometry args={[0.52, 0.035, 0.02]} />
      </mesh>

      <mesh position={[0, 0.53, -0.02]} castShadow material={materials.metal}>
        <boxGeometry args={[0.48, 0.05, 0.26]} />
      </mesh>
      {[-0.16, 0, 0.16].map((x, i) => (
        <mesh key={i} position={[x, 0.57, 0.02]} material={materials.mug}>
          <cylinderGeometry args={[0.028, 0.03, 0.045, 8]} />
        </mesh>
      ))}

      <mesh position={[0, 0.33, -0.2]} material={materials.glass}>
        <boxGeometry args={[0.3, 0.28, 0.08]} />
      </mesh>

      <mesh position={[-0.17, 0.39, 0.08]} rotation={[Math.PI / 2, 0, 0]} material={materials.mug}>
        <cylinderGeometry args={[0.032, 0.032, 0.012, 14]} />
      </mesh>
      <mesh position={[-0.17, 0.39, 0.092]} material={materials.espresso}>
        <cylinderGeometry args={[0.012, 0.012, 0.006, 8]} />
      </mesh>

      <mesh position={[0.12, 0.41, 0.09]} material={materials.monitor}>
        <boxGeometry args={[0.14, 0.055, 0.008]} />
      </mesh>
      <mesh position={[0.12, 0.41, 0.096]} ref={displayRef} material={displayMat}>
        <boxGeometry args={[0.1, 0.028, 0.004]} />
      </mesh>

      <group position={[0, 0.31, 0.2]}>
        <mesh castShadow material={materials.metal}>
          <boxGeometry args={[0.1, 0.14, 0.1]} />
        </mesh>
        <mesh position={[0, -0.05, 0.07]} castShadow material={materials.metal}>
          <cylinderGeometry args={[0.058, 0.058, 0.045, 14]} />
        </mesh>

        <group position={[0, -0.08, 0.1]} rotation={[0.72, 0, 0]}>
          <mesh castShadow material={materials.metal}>
            <boxGeometry args={[0.045, 0.2, 0.055]} />
          </mesh>
          <mesh position={[0, -0.14, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={materials.woodDark}>
            <cylinderGeometry args={[0.022, 0.024, 0.16, 8]} />
          </mesh>
        </group>

        <mesh position={[0, -0.2, 0.12]} material={materials.mug}>
          <cylinderGeometry args={[0.028, 0.032, 0.04, 10]} />
        </mesh>
        <mesh position={[0, -0.17, 0.12]} material={materials.metal}>
          <cylinderGeometry args={[0.034, 0.034, 0.006, 10]} />
        </mesh>
      </group>

      <group position={[0.19, 0.29, 0.14]} rotation={[0, 0, -1.05]}>
        <mesh material={materials.metal}>
          <cylinderGeometry args={[0.009, 0.009, 0.16, 6]} />
        </mesh>
        <mesh position={[0, -0.09, 0.02]} material={materials.metal}>
          <sphereGeometry args={[0.016, 6, 6]} />
        </mesh>
      </group>

      <group position={[-0.19, 0.29, 0.14]} rotation={[0, 0, -0.75]}>
        <mesh material={materials.metal}>
          <cylinderGeometry args={[0.007, 0.007, 0.12, 6]} />
        </mesh>
      </group>

      <CoffeeSteam />

      <pointLight position={[0, 0.57, 0.28]} intensity={0.28} color="#ffdba0" distance={1.8} decay={2} />
    </group>
  );
}

export function MilkPitcher({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh material={materials.metal}>
        <cylinderGeometry args={[0.035, 0.045, 0.08, 10]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
      </mesh>
      <mesh position={[0.03, 0.02, 0]} rotation={[0, 0, 0.4]} material={materials.metal}>
        <torusGeometry args={[0.022, 0.006, 6, 10, Math.PI]} />
      </mesh>
    </group>
  );
}

export function CoffeeCanister({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow material={materials.espresso}>
        <cylinderGeometry args={[0.045, 0.05, 0.11, 10]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
      </mesh>
      <mesh position={[0, 0.06, 0]} material={materials.metal}>
        <cylinderGeometry args={[0.048, 0.048, 0.015, 10]} />
      </mesh>
    </group>
  );
}
