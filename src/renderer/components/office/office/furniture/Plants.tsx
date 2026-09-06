import { FurnitureEdges, FURNITURE_EDGE_THRESHOLD_SOFT } from './FurnitureEdges';
import { materials } from '../materials';
import { SwayGroup } from './decor/AnimatedDecor';

interface PlantProps {
  position: [number, number, number];
  variant?: 'small' | 'medium' | 'tall' | 'fiddle' | 'snake';
}

export function Plant({ position, variant = 'medium' }: PlantProps) {
  if (variant === 'snake') {
    return (
      <SwayGroup position={position} phase={0.4} amplitude={0.035}>
        <mesh position={[0, 0.2, 0]} castShadow material={materials.potCeramic}>
          <cylinderGeometry args={[0.2, 0.22, 0.4, 12]} />
          <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
        </mesh>
        {[
          [0, 0.55, 0],
          [0.06, 0.75, 0.02],
          [-0.05, 0.95, -0.02],
          [0.04, 1.15, 0.03],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} castShadow material={materials.plantDark}>
            <boxGeometry args={[0.06, 0.22 + (i % 2) * 0.08, 0.04]} />
          </mesh>
        ))}
      </SwayGroup>
    );
  }

  if (variant === 'fiddle' || variant === 'tall') {
    return (
      <SwayGroup position={position} phase={1.2} amplitude={0.03}>
        <mesh position={[0, 0.22, 0]} castShadow material={materials.plantPot}>
          <cylinderGeometry args={[0.22, 0.24, 0.44, 12]} />
          <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
        </mesh>
        <mesh position={[0, 0.55, 0]} castShadow material={materials.plantDark}>
          <boxGeometry args={[0.08, 0.38, 0.06]} />
        </mesh>
        <mesh position={[0, 0.98, 0]} castShadow material={materials.plant}>
          <boxGeometry args={[0.16, 0.58, 0.12]} />
        </mesh>
        <mesh position={[0.12, 1.2, 0.05]} castShadow material={materials.plantDark}>
          <boxGeometry args={[0.24, 0.3, 0.1]} />
        </mesh>
      </SwayGroup>
    );
  }

  const scale = variant === 'small' ? 0.8 : 1;
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.11, 0]} castShadow material={materials.plantPot}>
        <cylinderGeometry args={[0.11, 0.13, 0.22, 10]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow material={materials.plant}>
        <sphereGeometry args={[0.15, 8, 7]} />
      </mesh>
      <mesh position={[0.09, 0.34, 0.05]} castShadow material={materials.plantDark}>
        <sphereGeometry args={[0.09, 6, 5]} />
      </mesh>
    </group>
  );
}
