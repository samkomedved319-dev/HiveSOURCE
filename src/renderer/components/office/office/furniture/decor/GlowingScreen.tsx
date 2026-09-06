import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { materials } from '../../materials';

const GLOW_COLOR = '#9ab8d8';

interface GlowingScreenProps {
  width: number;
  height: number;
  depth?: number;
  position?: [number, number, number];
  phase?: number;
  light?: number;
}

export function GlowingScreen({
  width,
  height,
  depth = 0.008,
  position = [0, 0, 0],
  phase = 0,
  light = 1,
}: GlowingScreenProps) {
  const mat = useMemo(() => materials.monitor.clone(), []);

  useFrame(({ clock }) => {
    const pulse = 0.34 + Math.sin(clock.elapsedTime * 2.1 + phase) * 0.1;
    mat.emissiveIntensity = pulse;
  });

  return (
    <group position={position}>
      <mesh material={mat}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>
      <pointLight
        position={[0, 0, 0.1]}
        intensity={0.16 * light}
        color={GLOW_COLOR}
        distance={1.1}
        decay={2}
      />
    </group>
  );
}

interface MiniScreenGlowProps {
  position: [number, number, number];
  size: [number, number, number];
  phase?: number;
}

export function MiniScreenGlow({ position, size, phase = 0 }: MiniScreenGlowProps) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2e343c',
        emissive: GLOW_COLOR,
        emissiveIntensity: 0.45,
        roughness: 0.28,
        metalness: 0.2,
      }),
    [],
  );

  useFrame(({ clock }) => {
    mat.emissiveIntensity = 0.38 + Math.sin(clock.elapsedTime * 2.4 + phase) * 0.12;
  });

  return (
    <group position={position}>
      <mesh material={mat}>
        <boxGeometry args={size} />
      </mesh>
    </group>
  );
}
