import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function SteamWisp({
  basePosition,
  phase,
}: {
  basePosition: [number, number, number];
  phase: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.62 + phase;
    const cycle = t % 1;
    if (!meshRef.current || !matRef.current) return;

    meshRef.current.position.set(
      basePosition[0] + Math.sin(t * 4.2) * 0.016,
      basePosition[1] + cycle * 0.24,
      basePosition[2] + Math.cos(t * 3.4) * 0.012,
    );
    const scale = 0.55 + cycle * 0.75;
    meshRef.current.scale.setScalar(scale);
    matRef.current.opacity = (1 - cycle) * 0.26;
  });

  return (
    <mesh ref={meshRef} position={basePosition}>
      <sphereGeometry args={[0.026, 6, 6]} />
      <meshBasicMaterial
        ref={matRef}
        color="#eef5fa"
        transparent
        opacity={0.18}
        depthWrite={false}
      />
    </mesh>
  );
}

export function CoffeeSteam() {
  const wandBase: [number, number, number] = [0.19, 0.34, 0.14];
  const cupBase: [number, number, number] = [0, 0.06, 0.32];

  return (
    <group>
      {[0, 0.9, 1.85, 2.7].map((phase) => (
        <SteamWisp key={`wand-${phase}`} basePosition={wandBase} phase={phase} />
      ))}
      {[0.35, 1.25, 2.1].map((phase) => (
        <SteamWisp key={`cup-${phase}`} basePosition={cupBase} phase={phase} />
      ))}
    </group>
  );
}
