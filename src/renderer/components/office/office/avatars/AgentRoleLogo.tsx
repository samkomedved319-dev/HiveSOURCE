import { Suspense } from 'react';
import { Billboard, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface AgentRoleLogoProps {
  logoUrl: string;
  accentColor: string;
}

function RoleLogoMark({ logoUrl, accentColor }: AgentRoleLogoProps) {
  const logo = useTexture(logoUrl);
  logo.colorSpace = THREE.SRGBColorSpace;

  return (
    <>
      <mesh position={[0, 0, -0.004]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.14, 0.14]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.96} />
      </mesh>
      <mesh position={[0, 0, -0.002]}>
        <circleGeometry args={[0.052, 24]} />
        <meshBasicMaterial color="#f8f6f2" transparent opacity={0.98} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[0.088, 0.088]} />
        <meshBasicMaterial
          map={logo}
          transparent
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

export function AgentRoleLogo({ logoUrl, accentColor }: AgentRoleLogoProps) {
  return (
    <Billboard position={[0, 0.9, 0.02]} follow lockX lockZ>
      <Suspense
        fallback={
          <mesh position={[0, 0, -0.002]} rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[0.12, 0.12]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.92} />
          </mesh>
        }
      >
        <RoleLogoMark logoUrl={logoUrl} accentColor={accentColor} />
      </Suspense>
    </Billboard>
  );
}