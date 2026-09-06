import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function CupSteamWisp({
  offset,
  phase,
}: {
  offset: [number, number, number];
  phase: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.75 + phase;
    const cycle = t % 1;
    if (!meshRef.current || !matRef.current) return;

    meshRef.current.position.set(
      offset[0] + Math.sin(t * 5.1) * 0.008,
      offset[1] + cycle * 0.11,
      offset[2] + Math.cos(t * 4.3) * 0.006,
    );
    meshRef.current.scale.setScalar(0.45 + cycle * 0.65);
    matRef.current.opacity = (1 - cycle) * 0.32;
  });

  return (
    <mesh ref={meshRef} position={offset}>
      <sphereGeometry args={[0.014, 5, 5]} />
      <meshBasicMaterial
        ref={matRef}
        color="#f5efe6"
        transparent
        opacity={0.22}
        depthWrite={false}
      />
    </mesh>
  );
}

export function CoffeeHandCup() {
  return (
    <group position={[0.012, -0.048, 0.058]} rotation={[-0.42, 0.2, 0.14]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.024, 0.028, 0.048, 10]} />
        <meshStandardMaterial color="#faf8f4" roughness={0.82} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.028, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.026, 0.004, 6, 12]} />
        <meshStandardMaterial color="#e8d9bc" roughness={0.75} />
      </mesh>
      <mesh position={[0, -0.012, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.006, 10]} />
        <meshStandardMaterial color="#6b4a34" roughness={0.92} />
      </mesh>
      {[0, 0.85, 1.7].map((phase) => (
        <CupSteamWisp key={phase} offset={[0, 0.05, 0]} phase={phase} />
      ))}
    </group>
  );
}
