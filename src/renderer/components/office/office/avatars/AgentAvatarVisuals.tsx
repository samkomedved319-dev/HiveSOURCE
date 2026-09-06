import { Edges, RoundedBox } from '@react-three/drei';
import type { ReactNode } from 'react';
import type * as THREE from 'three';
import type { AvatarDesignId } from '@/components/office/types/avatarDesign';
import { AVATAR_HAIR_CAP, AVATAR_HAIR_LAYOUTS } from './avatarHairLayouts';

export const AVATAR_SKIN = '#e8ceb8';
export const AVATAR_PANTS = '#5c4a3a';
export const AVATAR_SHOE = '#3a3228';
export const AVATAR_SOLE = '#2a241c';

interface MaterialProps {
  shirtMat: THREE.MeshStandardMaterial;
  pantsMat: THREE.MeshStandardMaterial;
  shoeMat: THREE.MeshStandardMaterial;
  soleMat: THREE.MeshStandardMaterial;
  skinMat: THREE.MeshStandardMaterial;
  accentMat: THREE.MeshStandardMaterial;
  trimMat: THREE.MeshStandardMaterial;
  hairMat: THREE.MeshStandardMaterial;
  eyeWhiteMat: THREE.MeshStandardMaterial;
  eyeMat: THREE.MeshStandardMaterial;
  cheekMat: THREE.MeshStandardMaterial;
  noseMat: THREE.MeshStandardMaterial;
  outlineColor: string;
}

export function AgentTorso({
  designId,
  shirtMat,
  pantsMat,
  accentMat,
  trimMat,
  outlineColor,
}: Pick<
  MaterialProps,
  'shirtMat' | 'pantsMat' | 'accentMat' | 'trimMat' | 'outlineColor'
> & { designId: AvatarDesignId }) {
  return (
    <>
      <RoundedBox
        args={[0.21, 0.23, 0.13]}
        radius={0.028}
        smoothness={3}
        position={[0, 0.34, 0]}
        castShadow
        receiveShadow
        material={shirtMat}
      >
        <Edges color={outlineColor} threshold={14} />
      </RoundedBox>

      {designId === 'bob-marley' && (
        <>
          <mesh position={[-0.05, 0.36, 0.068]} material={trimMat}>
            <boxGeometry args={[0.04, 0.08, 0.008]} />
          </mesh>
          <mesh position={[0.05, 0.36, 0.068]} material={accentMat}>
            <boxGeometry args={[0.04, 0.08, 0.008]} />
          </mesh>
        </>
      )}

      {designId === 'freddie-mercury' && (
        <>
          <mesh position={[-0.105, 0.415, 0.01]} castShadow material={accentMat}>
            <boxGeometry args={[0.048, 0.042, 0.02]} />
          </mesh>
          <mesh position={[0.105, 0.415, 0.01]} castShadow material={accentMat}>
            <boxGeometry args={[0.048, 0.042, 0.02]} />
          </mesh>
          <mesh position={[0, 0.3, 0.068]} material={trimMat}>
            <boxGeometry args={[0.14, 0.014, 0.008]} />
          </mesh>
        </>
      )}

      {designId === 'michael-jackson' && (
        <>
          <mesh position={[0, 0.36, 0.069]} material={trimMat}>
            <boxGeometry args={[0.04, 0.14, 0.007]} />
          </mesh>
          <mesh position={[-0.04, 0.33, 0.069]} rotation={[0, 0, 0.45]} material={trimMat}>
            <boxGeometry args={[0.03, 0.1, 0.007]} />
          </mesh>
          <mesh position={[0.04, 0.33, 0.069]} rotation={[0, 0, -0.45]} material={trimMat}>
            <boxGeometry args={[0.03, 0.1, 0.007]} />
          </mesh>
          <mesh position={[-0.105, 0.415, 0.012]} castShadow material={accentMat}>
            <boxGeometry args={[0.042, 0.035, 0.018]} />
          </mesh>
          <mesh position={[0.105, 0.415, 0.012]} castShadow material={accentMat}>
            <boxGeometry args={[0.042, 0.035, 0.018]} />
          </mesh>
          <mesh position={[0, 0.22, 0.069]} material={accentMat}>
            <boxGeometry args={[0.14, 0.014, 0.008]} />
          </mesh>
        </>
      )}

      {designId === 'shakira' && (
        <mesh position={[0, 0.32, 0.068]} material={trimMat}>
          <boxGeometry args={[0.05, 0.05, 0.008]} />
        </mesh>
      )}

      <mesh position={[0, 0.24, 0]} castShadow material={pantsMat}>
        <boxGeometry args={[0.19, 0.055, 0.115]} />
      </mesh>
      <mesh position={[0, 0.215, 0.01]} material={accentMat}>
        <boxGeometry args={[0.17, 0.012, 0.09]} />
      </mesh>

      <mesh position={[-0.105, 0.415, 0.01]} castShadow material={shirtMat}>
        <sphereGeometry args={[0.048, 8, 8]} />
      </mesh>
      <mesh position={[0.105, 0.415, 0.01]} castShadow material={shirtMat}>
        <sphereGeometry args={[0.048, 8, 8]} />
      </mesh>

      <mesh position={[0, 0.455, 0.05]} castShadow material={accentMat}>
        <torusGeometry args={[0.055, 0.01, 8, 16]} />
      </mesh>
      <mesh position={[-0.018, 0.36, 0.066]} material={accentMat}>
        <boxGeometry args={[0.012, 0.14, 0.008]} />
      </mesh>
      <RoundedBox
        args={[0.042, 0.048, 0.01]}
        radius={0.006}
        smoothness={2}
        position={[0, 0.295, 0.072]}
        material={accentMat}
      />
    </>
  );
}

export function SparkGlove({ gloveMat, accentMat }: { gloveMat: THREE.MeshStandardMaterial; accentMat?: THREE.MeshStandardMaterial }) {
  return (
    <>
      <mesh position={[0, 0.01, 0]} castShadow material={accentMat ?? gloveMat}>
        <boxGeometry args={[0.042, 0.018, 0.04]} />
      </mesh>
      <mesh castShadow material={gloveMat}>
        <sphereGeometry args={[0.036, 8, 8]} />
      </mesh>
    </>
  );
}

export function AgentArmSegment({
  shirtMat,
  skinMat,
  accentMat,
  gloveMat,
  side,
  gloved,
  handAccessory,
}: Pick<MaterialProps, 'shirtMat' | 'skinMat' | 'accentMat'> & {
  gloveMat?: THREE.MeshStandardMaterial;
  side: -1 | 1;
  gloved?: boolean;
  handAccessory?: ReactNode;
}) {
  return (
    <>
      <mesh position={[0, -0.055, 0]} castShadow material={shirtMat}>
        <capsuleGeometry args={[0.034, 0.11, 5, 8]} />
      </mesh>
      <mesh position={[0, -0.105, side * 0.008]} castShadow material={accentMat}>
        <boxGeometry args={[0.038, 0.018, 0.024]} />
      </mesh>
      <group position={[0, -0.125, 0.012]}>
        {!gloved && (
          <mesh castShadow material={skinMat}>
            <sphereGeometry args={[0.032, 8, 7]} />
          </mesh>
        )}
        {gloved && gloveMat && !handAccessory && (
          <SparkGlove gloveMat={gloveMat} accentMat={accentMat} />
        )}
        {handAccessory}
      </group>
    </>
  );
}

export function AgentThigh({ pantsMat }: Pick<MaterialProps, 'pantsMat'>) {
  return (
    <>
      <mesh position={[0, -0.06, 0]} castShadow material={pantsMat}>
        <capsuleGeometry args={[0.036, 0.1, 5, 8]} />
      </mesh>
      <mesh position={[0, -0.115, 0.01]} castShadow material={pantsMat}>
        <boxGeometry args={[0.034, 0.02, 0.034]} />
      </mesh>
    </>
  );
}

export function AgentShinFoot({
  pantsMat,
  shoeMat,
  soleMat,
}: Pick<MaterialProps, 'pantsMat' | 'shoeMat' | 'soleMat'>) {
  return (
    <>
      <mesh position={[0, -0.02, 0.018]} castShadow material={pantsMat}>
        <capsuleGeometry args={[0.032, 0.075, 5, 8]} />
      </mesh>
      <RoundedBox
        args={[0.064, 0.042, 0.105]}
        radius={0.012}
        smoothness={2}
        position={[0, -0.085, 0.028]}
        castShadow
        material={shoeMat}
      />
      <mesh position={[0, -0.102, 0.038]} castShadow material={soleMat}>
        <boxGeometry args={[0.068, 0.014, 0.11]} />
      </mesh>
    </>
  );
}

export function AgentMusicianHair({
  designId,
  hairMat,
}: {
  designId: AvatarDesignId;
  hairMat: THREE.MeshStandardMaterial;
}) {
  const strands = AVATAR_HAIR_LAYOUTS[designId];
  const capSize = AVATAR_HAIR_CAP[designId];

  return (
    <>
      {capSize && (
        <mesh position={[0, 0.05, -0.025]} castShadow material={hairMat}>
          <boxGeometry args={capSize} />
        </mesh>
      )}
      {strands.map((strand, index) => (
        <mesh
          key={index}
          position={strand.pos}
          rotation={strand.rot}
          castShadow
          material={hairMat}
        >
          <capsuleGeometry args={[strand.radius, strand.length, 4, 6]} />
        </mesh>
      ))}
    </>
  );
}

export function AgentMusicianHeadExtras({
  designId,
  accentMat,
  trimMat,
  hairMat,
}: {
  designId: AvatarDesignId;
  accentMat: THREE.MeshStandardMaterial;
  trimMat: THREE.MeshStandardMaterial;
  hairMat: THREE.MeshStandardMaterial;
}) {
  if (designId === 'bob-marley') {
    return (
      <>
        <mesh position={[0, 0.105, 0.025]} castShadow material={trimMat}>
          <boxGeometry args={[0.24, 0.032, 0.17]} />
        </mesh>
        <mesh position={[0, 0.118, 0.03]} castShadow material={accentMat}>
          <boxGeometry args={[0.18, 0.012, 0.14]} />
        </mesh>
      </>
    );
  }

  if (designId === 'michael-jackson') {
    return (
      <>
        <mesh position={[0, 0.155, -0.015]} castShadow material={hairMat}>
          <cylinderGeometry args={[0.1, 0.108, 0.055, 10]} />
        </mesh>
        <mesh position={[0, 0.185, -0.01]} castShadow material={hairMat}>
          <cylinderGeometry args={[0.068, 0.1, 0.038, 10]} />
        </mesh>
        <mesh position={[0, 0.168, -0.005]} material={trimMat}>
          <cylinderGeometry args={[0.102, 0.102, 0.012, 10]} />
        </mesh>
        <mesh position={[0, 0.145, 0.02]} castShadow material={hairMat}>
          <cylinderGeometry args={[0.125, 0.13, 0.012, 12]} />
        </mesh>
      </>
    );
  }

  if (designId === 'freddie-mercury') {
    return (
      <>
        <mesh position={[-0.038, -0.048, 0.112]} material={hairMat}>
          <boxGeometry args={[0.03, 0.008, 0.008]} />
        </mesh>
        <mesh position={[0.038, -0.048, 0.112]} material={hairMat}>
          <boxGeometry args={[0.03, 0.008, 0.008]} />
        </mesh>
      </>
    );
  }

  return (
    <>
      <mesh position={[0, 0.042, 0.103]} material={accentMat}>
        <boxGeometry args={[0.16, 0.022, 0.012]} />
      </mesh>
      <mesh position={[0, 0.055, 0.104]} material={trimMat}>
        <boxGeometry args={[0.12, 0.012, 0.01]} />
      </mesh>
    </>
  );
}

export function AgentHumanHead({
  designId,
  skinMat,
  hairMat,
  accentMat,
  trimMat,
  eyeWhiteMat,
  eyeMat,
  cheekMat,
  noseMat,
  outlineColor,
}: Pick<
  MaterialProps,
  | 'skinMat'
  | 'hairMat'
  | 'accentMat'
  | 'trimMat'
  | 'eyeWhiteMat'
  | 'eyeMat'
  | 'cheekMat'
  | 'noseMat'
  | 'outlineColor'
> & { designId: AvatarDesignId }) {
  const showBrows = designId === 'freddie-mercury' || designId === 'bob-marley';

  return (
    <>
      <mesh castShadow material={skinMat}>
        <sphereGeometry args={[0.128, 14, 12]} />
        <Edges color={outlineColor} threshold={12} />
      </mesh>

      <AgentMusicianHair designId={designId} hairMat={hairMat} />

      <mesh position={[-0.045, 0.018, 0.108]} material={eyeWhiteMat}>
        <sphereGeometry args={[0.018, 8, 8]} />
      </mesh>
      <mesh position={[0.045, 0.018, 0.108]} material={eyeWhiteMat}>
        <sphereGeometry args={[0.018, 8, 8]} />
      </mesh>
      <mesh position={[-0.045, 0.016, 0.118]} material={eyeMat}>
        <sphereGeometry args={[0.01, 6, 6]} />
      </mesh>
      <mesh position={[0.045, 0.016, 0.118]} material={eyeMat}>
        <sphereGeometry args={[0.01, 6, 6]} />
      </mesh>
      <mesh position={[-0.041, 0.022, 0.121]} material={eyeWhiteMat}>
        <sphereGeometry args={[0.004, 4, 4]} />
      </mesh>
      <mesh position={[0.049, 0.022, 0.121]} material={eyeWhiteMat}>
        <sphereGeometry args={[0.004, 4, 4]} />
      </mesh>

      {showBrows && (
        <>
          <mesh position={[-0.05, 0.038, 0.102]} rotation={[0, 0, 0.12]} material={hairMat}>
            <boxGeometry args={[0.034, 0.008, 0.012]} />
          </mesh>
          <mesh position={[0.05, 0.038, 0.102]} rotation={[0, 0, -0.12]} material={hairMat}>
            <boxGeometry args={[0.034, 0.008, 0.012]} />
          </mesh>
        </>
      )}

      <mesh position={[0, -0.028, 0.112]} material={noseMat}>
        <sphereGeometry args={[0.011, 6, 6]} />
      </mesh>
      <mesh position={[-0.072, -0.008, 0.095]} material={cheekMat}>
        <sphereGeometry args={[0.015, 6, 6]} />
      </mesh>
      <mesh position={[0.072, -0.008, 0.095]} material={cheekMat}>
        <sphereGeometry args={[0.015, 6, 6]} />
      </mesh>

      <mesh position={[0, -0.048, 0.114]} rotation={[0.15, 0, 0]} material={noseMat}>
        <torusGeometry args={[0.022, 0.006, 6, 12, Math.PI]} />
      </mesh>

      <AgentMusicianHeadExtras
        designId={designId}
        accentMat={accentMat}
        trimMat={trimMat}
        hairMat={hairMat}
      />
    </>
  );
}

/** @deprecated Use AgentHumanHead */
export const AgentRobotHead = AgentHumanHead;
