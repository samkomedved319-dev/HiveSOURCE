import type { ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export function SwayGroup({
  children,
  position,
  phase = 0,
  amplitude = 0.04,
  speed = 1.2,
}: {
  children: ReactNode;
  position?: [number, number, number];
  phase?: number;
  amplitude?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + phase;
    ref.current.rotation.z = Math.sin(t) * amplitude;
    ref.current.rotation.x = Math.sin(t * 0.7 + 0.5) * amplitude * 0.35;
  });

  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}
