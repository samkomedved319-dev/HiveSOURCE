import { useMemo } from 'react';
import * as THREE from 'three';
import { FurnitureEdges, FURNITURE_EDGE_THRESHOLD, FURNITURE_EDGE_THRESHOLD_SOFT } from './FurnitureEdges';
import { materials } from '../materials';
import { DeskSucculent, DeskMug, DeskNotebook, PenCup } from './decor/SceneDecor';

export type ChairStyle = 'mesh' | 'tan' | 'cream' | 'white' | 'sage' | 'forest' | 'terracotta';
export type DeskPropType = 'succulent' | 'mug' | 'notebook' | 'pen' | 'none';

export function TFrameLegs({ points }: { points: [number, number][] }) {
  return (
    <>
      {points.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.04, 0]} castShadow material={materials.deskLeg}>
            <boxGeometry args={[0.24, 0.05, 0.05]} />
          </mesh>
          <mesh position={[0, 0.04, 0]} rotation={[0, Math.PI / 2, 0]} castShadow material={materials.deskLeg}>
            <boxGeometry args={[0.24, 0.05, 0.05]} />
          </mesh>
          <mesh position={[0, 0.24, 0]} castShadow material={materials.deskLeg}>
            <boxGeometry args={[0.038, 0.36, 0.038]} />
          </mesh>
          <mesh position={[0, 0.44, 0]} castShadow material={materials.metal}>
            <boxGeometry args={[0.05, 0.04, 0.05]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export const StandingLegs = TFrameLegs;

export function CurvedMonitorGroup({ dual = false, thin = true }: { dual?: boolean; thin?: boolean }) {
  const h = thin ? 0.26 : 0.34;
  const w = thin ? 0.46 : 0.5;
  const d = thin ? 0.018 : 0.045;
  return (
    <group position={[0, 0.64, -0.14]}>
      <MonitorScreen x={dual ? -0.26 : 0} w={w} h={h} d={d} />
      {dual && <MonitorScreen x={0.26} w={w} h={h} d={d} />}
      {!dual && <pointLight position={[0, 0, 0.08]} intensity={0.14} color="#c8dcc8" distance={1.2} />}
    </group>
  );
}

function MonitorScreen({ x, w, h, d }: { x: number; w: number; h: number; d: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh castShadow material={materials.monitorBezel}>
        <boxGeometry args={[w, h + 0.06, d + 0.02]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
      </mesh>
      <mesh position={[0, 0.015, d / 2 + 0.004]} material={materials.monitor}>
        <boxGeometry args={[w * 0.9, h, 0.008]} />
      </mesh>
      <mesh position={[0, -(h / 2 + 0.04), 0]} material={materials.metal}>
        <boxGeometry args={[0.06, 0.05, 0.04]} />
      </mesh>
    </group>
  );
}

export function KeyboardMouse({
  position = [0, 0.44, 0.1],
}: {
  position?: [number, number, number];
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]}>
      <mesh material={materials.monitor}>
        <boxGeometry args={[0.24, 0.01, 0.09]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
      </mesh>
      <mesh position={[0.16, 0.008, 0.05]} material={materials.metal}>
        <boxGeometry args={[0.038, 0.012, 0.055]} />
      </mesh>
    </group>
  );
}

export function DeskPropsSlot({
  type,
  offset,
}: {
  type: DeskPropType;
  offset: [number, number, number];
}) {
  const [x, y, z] = offset;
  if (type === 'succulent') return <DeskSucculent position={[x, y, z]} />;
  if (type === 'mug') return <DeskMug position={[x, y, z]} />;
  if (type === 'notebook') return <DeskNotebook position={[x, y, z]} />;
  if (type === 'pen') return <PenCup position={[x, y, z]} />;
  return null;
}

const CASTER_ANGLES = [0, 1, 2, 3, 4].map((i) => (i / 5) * Math.PI * 2);

function MeshVentPanel({ width, height }: { width: number; height: number }) {
  const cols = 4;
  const rows = 5;
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
            <boxGeometry args={[cellW * 0.72, cellH * 0.72, 0.008]} />
          </mesh>
        )),
      )}
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
    m.color.multiplyScalar(0.58);
    m.roughness = Math.min(1, m.roughness + 0.08);
    return m;
  }, [color]);

  const piping = useMemo(() => materials.espresso.clone(), []);

  const rgbGlow = useMemo(() => {
    const m = color.clone();
    m.emissive = m.color.clone();
    m.emissiveIntensity = 0.42;
    m.roughness = 0.35;
    return m;
  }, [color]);

  const rgbSoft = useMemo(() => {
    const m = color.clone();
    m.emissive = m.color.clone();
    m.emissiveIntensity = 0.18;
    return m;
  }, [color]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.04, 0]} castShadow material={materials.espresso}>
        <cylinderGeometry args={[0.06, 0.075, 0.045, 12]} />
      </mesh>
      <mesh position={[0, 0.075, 0]} material={materials.metal}>
        <cylinderGeometry args={[0.034, 0.04, 0.05, 10]} />
      </mesh>
      <mesh position={[0, 0.105, 0]} material={materials.chairMesh}>
        <cylinderGeometry args={[0.026, 0.03, 0.055, 8]} />
      </mesh>

      {CASTER_ANGLES.map((angle, i) => (
        <group key={i} rotation={[0, angle, 0]}>
          <mesh position={[0.145, 0.048, 0]} castShadow material={materials.espresso}>
            <boxGeometry args={[0.26, 0.026, 0.042]} />
          </mesh>
          <mesh position={[0.285, 0.036, 0]} material={materials.chairMesh}>
            <cylinderGeometry args={[0.032, 0.032, 0.018, 10]} />
          </mesh>
          <mesh position={[0.285, 0.046, 0]} rotation={[Math.PI / 2, 0, 0]} material={rgbSoft}>
            <torusGeometry args={[0.022, 0.004, 6, 14]} />
          </mesh>
        </group>
      ))}

      <group position={[0, 0.19, 0.04]} rotation={[-0.07, 0, 0]}>
        <mesh position={[0, 0.085, 0.04]} castShadow material={color}>
          <boxGeometry args={[0.42, 0.1, 0.36]} />
          <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
        </mesh>
        <mesh position={[0, 0.1, 0.22]} castShadow material={color}>
          <boxGeometry args={[0.36, 0.07, 0.08]} />
        </mesh>
        <mesh position={[-0.2, 0.13, 0]} castShadow material={accent} rotation={[0, 0, 0.12]}>
          <boxGeometry args={[0.05, 0.16, 0.32]} />
        </mesh>
        <mesh position={[0.2, 0.13, 0]} castShadow material={accent} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.05, 0.16, 0.32]} />
        </mesh>
        <mesh position={[0, 0.135, 0.015]} material={piping}>
          <boxGeometry args={[0.36, 0.014, 0.28]} />
        </mesh>
        <mesh position={[0, 0.08, -0.12]} castShadow material={accent}>
          <boxGeometry args={[0.24, 0.1, 0.08]} />
        </mesh>
        <mesh position={[0, 0.075, -0.125]} castShadow material={color}>
          <boxGeometry args={[0.16, 0.06, 0.05]} />
        </mesh>
        <mesh position={[0, 0.055, 0.01]} material={rgbGlow}>
          <boxGeometry args={[0.38, 0.008, 0.02]} />
        </mesh>

        <group position={[0, 0.24, -0.18]} rotation={[-0.26, 0, 0]}>
          <mesh castShadow material={color}>
            <boxGeometry args={[0.4, 0.46, 0.07]} />
            <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD} />
          </mesh>
          <mesh position={[-0.19, 0.06, -0.015]} castShadow material={accent} rotation={[0, 0.22, 0]}>
            <boxGeometry args={[0.08, 0.38, 0.06]} />
          </mesh>
          <mesh position={[0.19, 0.06, -0.015]} castShadow material={accent} rotation={[0, -0.22, 0]}>
            <boxGeometry args={[0.08, 0.38, 0.06]} />
          </mesh>
          <mesh position={[-0.12, 0.1, -0.01]} material={materials.espresso}>
            <boxGeometry args={[0.05, 0.18, 0.04]} />
          </mesh>
          <mesh position={[0.12, 0.1, -0.01]} material={materials.espresso}>
            <boxGeometry args={[0.05, 0.18, 0.04]} />
          </mesh>

          {meshBack ? (
            <group position={[0, 0.05, -0.042]}>
              <MeshVentPanel width={0.22} height={0.28} />
            </group>
          ) : (
            <>
              <mesh position={[0, 0.04, -0.043]} material={piping}>
                <boxGeometry args={[0.3, 0.012, 0.008]} />
              </mesh>
              <mesh position={[0, -0.02, -0.043]} material={piping}>
                <boxGeometry args={[0.3, 0.012, 0.008]} />
              </mesh>
              <mesh position={[0, -0.08, -0.043]} material={piping}>
                <boxGeometry args={[0.3, 0.012, 0.008]} />
              </mesh>
            </>
          )}

          <mesh position={[-0.19, 0.02, -0.044]} material={rgbGlow}>
            <boxGeometry args={[0.012, 0.32, 0.008]} />
          </mesh>
          <mesh position={[0.19, 0.02, -0.044]} material={rgbGlow}>
            <boxGeometry args={[0.012, 0.32, 0.008]} />
          </mesh>
          <mesh position={[0, -0.06, -0.044]} material={rgbGlow}>
            <boxGeometry args={[0.34, 0.014, 0.008]} />
          </mesh>

          <group position={[0, 0.28, -0.05]}>
            <mesh castShadow material={color}>
              <boxGeometry args={[0.26, 0.1, 0.09]} />
            </mesh>
            <mesh position={[-0.12, 0.02, -0.02]} castShadow material={accent} rotation={[0, 0.35, 0]}>
              <boxGeometry args={[0.06, 0.08, 0.05]} />
            </mesh>
            <mesh position={[0.12, 0.02, -0.02]} castShadow material={accent} rotation={[0, -0.35, 0]}>
              <boxGeometry args={[0.06, 0.08, 0.05]} />
            </mesh>
            <mesh position={[0, 0.02, -0.04]} castShadow material={color}>
              <boxGeometry args={[0.14, 0.06, 0.05]} />
            </mesh>
          </group>
        </group>

        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.24, 0.13, 0.04]}>
            <mesh material={materials.metal}>
              <boxGeometry args={[0.03, 0.18, 0.03]} />
            </mesh>
            <mesh position={[0, 0.1, 0]} material={materials.espresso}>
              <cylinderGeometry args={[0.018, 0.018, 0.035, 8]} />
            </mesh>
            <mesh position={[side * 0.015, 0.125, 0.04]} castShadow material={materials.espresso}>
              <boxGeometry args={[0.06, 0.03, 0.18]} />
            </mesh>
            <mesh position={[side * 0.015, 0.135, 0.04]} castShadow material={accent}>
              <boxGeometry args={[0.055, 0.024, 0.16]} />
            </mesh>
            <mesh position={[side * 0.015, 0.145, 0.04]} material={piping}>
              <boxGeometry args={[0.048, 0.008, 0.14]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export function VintageGlobe() {
  return (
    <group position={[0, 0.54, 0]}>
      <mesh castShadow material={materials.sageDark}>
        <sphereGeometry args={[0.12, 18, 16]} />
        <FurnitureEdges threshold={FURNITURE_EDGE_THRESHOLD_SOFT} />
      </mesh>
      <mesh position={[0, 0.4, 0]} material={materials.woodDark}>
        <cylinderGeometry args={[0.025, 0.03, 0.08, 8]} />
      </mesh>
      <mesh position={[0, 0.46, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.woodLight}>
        <torusGeometry args={[0.13, 0.009, 8, 24]} />
      </mesh>
      <mesh position={[0, 0.58, 0.02]} material={materials.metal}>
        <boxGeometry args={[0.16, 0.025, 0.02]} />
      </mesh>
    </group>
  );
}
