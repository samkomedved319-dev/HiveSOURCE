import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import {
  FurnitureEdges,
  FURNITURE_EDGE_THRESHOLD,
  FURNITURE_EDGE_THRESHOLD_SOFT,
} from '../FurnitureEdges';
import { materials } from '../../materials';

const CASTER_ANGLES = [0, 1, 2, 3, 4].map((i) => (i / 5) * Math.PI * 2);

function MeshVentPanel({ width, height }: { width: number; height: number }) {
  const cols = 5;
  const rows = 7;
  const cellW = width / cols;
  const cellH = height / rows;
  return (
    <group>
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[
              -width / 2 + cellW * (col + 0.5),
              -height / 2 + cellH * (row + 0.5),
              0,
            ]}
            material={materials.chairMesh}
          >
            <boxGeometry args={[cellW * 0.68, cellH * 0.68, 0.01]} />
          </mesh>
        )),
      )}
    </group>
  );
}

function ChairArmrest({
  side,
  accent,
  piping,
  rgbSoft,
}: {
  side: -1 | 1;
  accent: THREE.MeshStandardMaterial;
  piping: THREE.MeshStandardMaterial;
  rgbSoft: THREE.MeshStandardMaterial;
}) {
  return (
    <group position={[side * 0.245, 0.14, 0.06]}>
      <mesh material={materials.metal}>
        <boxGeometry args={[0.028, 0.2, 0.028]} />
      </mesh>
      <mesh position={[0, 0.11, 0]} material={materials.espresso}>
        <cylinderGeometry args={[0.016, 0.018, 0.04, 8]} />
      </mesh>
      <mesh position={[side * 0.012, 0.135, 0.05]} castShadow material={materials.espresso}>
        <boxGeometry args={[0.07, 0.034, 0.2]} />
      </mesh>
      <mesh position={[side * 0.012, 0.148, 0.05]} castShadow material={accent}>
        <boxGeometry args={[0.062, 0.022, 0.18]} />
      </mesh>
      <mesh position={[side * 0.012, 0.158, 0.05]} material={piping}>
        <boxGeometry args={[0.054, 0.008, 0.16]} />
      </mesh>
      <mesh position={[side * 0.012, 0.128, 0.14]} material={rgbSoft}>
        <boxGeometry args={[0.048, 0.006, 0.012]} />
      </mesh>
    </group>
  );
}
export function ErgonomicChairMesh({
  position,
  rotation,
  color,
  meshBack = false,
}: {
  position: [number, number, number];
  rotation: number;
  color: THREE.MeshStandardMaterial;
  meshBack?: boolean;
}) {
  const accent = useMemo(() => {
    const m = color.clone();
    m.color.multiplyScalar(0.55);
    m.roughness = Math.min(1, m.roughness + 0.1);
    return m;
  }, [color]);

  const piping = useMemo(() => materials.espresso.clone(), []);

  const rgbGlow = useMemo(() => {
    const m = color.clone();
    m.emissive = m.color.clone();
    m.emissiveIntensity = 0.38;
    m.roughness = 0.32;
    return m;
  }, [color]);

  const rgbSoft = useMemo(() => {
    const m = color.clone();
    m.emissive = m.color.clone();
    m.emissiveIntensity = 0.16;
    return m;
  }, [color]);

  useFrame(({ clock }) => {
    const pulse = 0.28 + Math.sin(clock.elapsedTime * 2.6) * 0.12;
    rgbGlow.emissiveIntensity = pulse + 0.08;
    rgbSoft.emissiveIntensity = 0.1 + pulse * 0.35;
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.028, 0]} castShadow material={materials.espresso}>
        <cylinderGeometry args={[0.07, 0.085, 0.038, 12]} />
      </mesh>
      <mesh position={[0, 0.072, 0]} material={materials.metal}>
        <cylinderGeometry args={[0.036, 0.042, 0.058, 10]} />
      </mesh>
      <mesh position={[0, 0.1, 0]} material={materials.metal}>
        <cylinderGeometry args={[0.048, 0.048, 0.012, 12]} />
      </mesh>
      <mesh position={[0, 0.108, 0]} material={materials.chairMesh}>
        <cylinderGeometry args={[0.028, 0.032, 0.048, 8]} />
      </mesh>

      {CASTER_ANGLES.map((angle, i) => (
        <group key={i} rotation={[0, angle, 0]}>
          <mesh position={[0.152, 0.046, 0]} castShadow material={materials.espresso}>
            <boxGeometry args={[0.28, 0.028, 0.046]} />
          </mesh>
          <mesh position={[0.3, 0.034, 0]} material={materials.chairMesh}>
            <cylinderGeometry args={[0.034, 0.034, 0.02, 10]} />
          </mesh>
          <mesh position={[0.3, 0.038, 0]} material={materials.metal}>
            <cylinderGeometry args={[0.014, 0.014, 0.012, 8]} />
          </mesh>
          <mesh position={[0.3, 0.044, 0]} rotation={[Math.PI / 2, 0, 0]} material={rgbSoft}>
            <torusGeometry args={[0.024, 0.0045, 6, 14]} />
          </mesh>
        </group>
      ))}

      <group position={[0, 0.19, 0.045]} rotation={[-0.08, 0, 0]}>
        <mesh position={[0, 0.085, 0.035]} castShadow material={color}>
          <boxGeometry args={[0.44, 0.105, 0.37]} />
          <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
        </mesh>
        <mesh position={[0, 0.042, 0.19]} castShadow material={color}>
          <boxGeometry args={[0.4, 0.055, 0.09]} />
        </mesh>
        <mesh position={[-0.21, 0.1, 0.02]} castShadow material={accent} rotation={[0, 0, 0.22]}>
          <boxGeometry args={[0.055, 0.14, 0.3]} />
        </mesh>
        <mesh position={[0.21, 0.1, 0.02]} castShadow material={accent} rotation={[0, 0, -0.22]}>
          <boxGeometry args={[0.055, 0.14, 0.3]} />
        </mesh>
        <mesh position={[0, 0.092, 0.04]} material={piping}>
          <boxGeometry args={[0.1, 0.008, 0.26]} />
        </mesh>
        <mesh position={[0, 0.078, 0.055]} material={piping}>
          <boxGeometry args={[0.34, 0.006, 0.008]} />
        </mesh>
        <mesh position={[0, 0.058, 0.06]} material={rgbGlow}>
          <boxGeometry args={[0.36, 0.007, 0.018]} />
        </mesh>

        <group position={[0, 0.26, -0.17]} rotation={[-0.3, 0, 0]}>
          <mesh castShadow material={color}>
            <boxGeometry args={[0.42, 0.52, 0.075]} />
            <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
          </mesh>
          <mesh position={[-0.2, 0.08, 0.01]} castShadow material={accent} rotation={[0, 0, 0.28]}>
            <boxGeometry args={[0.07, 0.36, 0.065]} />
          </mesh>
          <mesh position={[0.2, 0.08, 0.01]} castShadow material={accent} rotation={[0, 0, -0.28]}>
            <boxGeometry args={[0.07, 0.36, 0.065]} />
          </mesh>
          <mesh position={[0, 0.02, 0.042]} material={piping}>
            <boxGeometry args={[0.32, 0.012, 0.008]} />
          </mesh>
          <mesh position={[0, -0.06, 0.042]} material={piping}>
            <boxGeometry args={[0.32, 0.012, 0.008]} />
          </mesh>
          <mesh position={[0, -0.14, 0.042]} material={piping}>
            <boxGeometry args={[0.32, 0.012, 0.008]} />
          </mesh>

          <mesh position={[0, -0.06, 0.055]} castShadow material={accent}>
            <boxGeometry args={[0.26, 0.11, 0.055]} />
          </mesh>
          <mesh position={[0, -0.06, 0.082]} material={piping}>
            <boxGeometry args={[0.22, 0.008, 0.008]} />
          </mesh>

          {meshBack ? (
            <group position={[0, 0.04, -0.044]}>
              <MeshVentPanel width={0.24} height={0.32} />
            </group>
          ) : (
            <>
              <mesh position={[-0.13, 0.1, -0.01]} material={materials.espresso}>
                <boxGeometry args={[0.05, 0.2, 0.04]} />
              </mesh>
              <mesh position={[0.13, 0.1, -0.01]} material={materials.espresso}>
                <boxGeometry args={[0.05, 0.2, 0.04]} />
              </mesh>
            </>
          )}

          {([-1, 1] as const).map((side) => (
            <mesh
              key={side}
              position={[side * 0.2, 0.02, -0.045]}
              material={rgbGlow}
            >
              <boxGeometry args={[0.013, 0.34, 0.008]} />
            </mesh>
          ))}
          <mesh position={[0, -0.08, -0.045]} material={rgbGlow}>
            <boxGeometry args={[0.35, 0.014, 0.008]} />
          </mesh>

          <group position={[0, 0.31, -0.04]}>
            <mesh castShadow material={color}>
              <boxGeometry args={[0.28, 0.11, 0.095]} />
            </mesh>
            <mesh position={[-0.13, 0.01, 0.02]} castShadow material={accent} rotation={[0, 0, 0.35]}>
              <boxGeometry args={[0.06, 0.09, 0.07]} />
            </mesh>
            <mesh position={[0.13, 0.01, 0.02]} castShadow material={accent} rotation={[0, 0, -0.35]}>
              <boxGeometry args={[0.06, 0.09, 0.07]} />
            </mesh>
            <mesh position={[0, 0.02, 0.05]} material={piping}>
              <boxGeometry args={[0.14, 0.008, 0.008]} />
            </mesh>
            <mesh position={[0, -0.02, 0.052]} material={rgbGlow}>
              <boxGeometry args={[0.2, 0.007, 0.008]} />
            </mesh>
          </group>
        </group>

        <ChairArmrest
          side={-1}
          accent={accent}
          piping={piping}
          rgbSoft={rgbSoft}
        />
        <ChairArmrest
          side={1}
          accent={accent}
          piping={piping}
          rgbSoft={rgbSoft}
        />
      </group>
    </group>
  );
}
