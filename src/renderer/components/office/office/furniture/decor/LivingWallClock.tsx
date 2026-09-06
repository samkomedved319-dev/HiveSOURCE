import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { FurnitureEdges, FURNITURE_EDGE_THRESHOLD_SOFT } from '../FurnitureEdges';
import { materials } from '../../materials';

interface LivingWallClockProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}
export function LivingWallClock({
  position,
  rotation = [0, Math.PI / 2, 0],
}: LivingWallClockProps) {
  const hourRef = useRef<THREE.Group>(null);
  const minuteRef = useRef<THREE.Group>(null);
  const tickMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#8a949c',
        roughness: 0.82,
        metalness: 0.08,
      }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (minuteRef.current) minuteRef.current.rotation.z = -(t * 0.45) % (Math.PI * 2);
    if (hourRef.current) hourRef.current.rotation.z = -(t * 0.0375) % (Math.PI * 2);
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1.42, 0]} material={materials.espresso}>
        <cylinderGeometry args={[0.155, 0.155, 0.034, 24]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
      </mesh>
      <mesh position={[0, 1.42, 0.019]} material={materials.wall}>
        <cylinderGeometry args={[0.125, 0.125, 0.012, 24]} />
      </mesh>

      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r = i % 3 === 0 ? 0.1 : 0.088;
        return (
          <mesh
            key={i}
            position={[Math.sin(angle) * r, 1.42 + Math.cos(angle) * r, 0.021]}
            material={tickMat}
          >
            <boxGeometry args={[0.008, i % 3 === 0 ? 0.022 : 0.014, 0.003]} />
          </mesh>
        );
      })}

      <group ref={hourRef} position={[0, 1.42, 0.024]}>
        <mesh position={[0, 0.032, 0]} material={materials.espresso}>
          <boxGeometry args={[0.007, 0.064, 0.004]} />
        </mesh>
      </group>
      <group ref={minuteRef} position={[0, 1.42, 0.026]}>
        <mesh position={[0, 0.048, 0]} material={materials.terracotta}>
          <boxGeometry args={[0.005, 0.096, 0.004]} />
        </mesh>
      </group>
      <mesh position={[0, 1.42, 0.028]} material={materials.terracottaLight}>
        <sphereGeometry args={[0.009, 8, 8]} />
      </mesh>

      <pointLight position={[0, 1.42, 0.18]} intensity={0.18} color="#ffe8c8" distance={1.4} decay={2} />
    </group>
  );
}
