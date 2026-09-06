import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function AgentThinkingAura() {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 1.6;
    }
    if (ringRef.current) {
      const pulse = 0.88 + Math.sin(t * 4.2) * 0.12;
      ringRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.94, 0]}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.008, 8, 24]} />
        <meshBasicMaterial color="#d4a574" transparent opacity={0.55} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.14, Math.sin(angle) * 0.04, Math.sin(angle) * 0.14]}>
            <sphereGeometry args={[0.014, 6, 6]} />
            <meshBasicMaterial color="#d4a574" transparent opacity={0.85} />
          </mesh>
        );
      })}
    </group>
  );
}
