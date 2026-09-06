import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OFFICE_WORK_ZONES } from '@/components/office/config/officeZones';
import { useAgentsStore } from '@/components/office/runtime/agents.store';
import type { AgentHomeZone } from '@/components/office/types/agent';
import { isZoneOccupied } from '@/components/office/utils/zoneOccupancy';

const BASE_INTENSITY = 0.06;
const OCCUPIED_INTENSITY = 0.34;
const BASE_FLOOR_INTENSITY = 0.04;
const OCCUPIED_FLOOR_INTENSITY = 0.2;

function zoneLightColor(accent: string): string {
  const color = new THREE.Color(accent);
  color.lerp(new THREE.Color('#e8f0ec'), 0.45);
  return `#${color.getHexString()}`;
}

function ZoneLightPair({
  zoneId,
  position,
  size,
  accent,
}: {
  zoneId: AgentHomeZone;
  position: [number, number, number];
  size: [number, number];
  accent: string;
}) {
  const overheadRef = useRef<THREE.PointLight>(null);
  const floorRef = useRef<THREE.PointLight>(null);
  const overheadIntensity = useRef(BASE_INTENSITY);
  const floorIntensity = useRef(BASE_FLOOR_INTENSITY);
  const lightColor = useMemo(() => zoneLightColor(accent), [accent]);
  const [cx, , cz] = position;
  const reach = Math.max(size[0], size[1]) * 0.72 + 1.6;

  useFrame((_, delta) => {
    const occupied = isZoneOccupied(zoneId, useAgentsStore.getState().runtime);
    const overheadGoal = occupied ? OCCUPIED_INTENSITY : BASE_INTENSITY;
    const floorGoal = occupied ? OCCUPIED_FLOOR_INTENSITY : BASE_FLOOR_INTENSITY;
    const lerp = 1 - Math.exp(-delta * 5.2);

    overheadIntensity.current = THREE.MathUtils.lerp(
      overheadIntensity.current,
      overheadGoal,
      lerp,
    );
    floorIntensity.current = THREE.MathUtils.lerp(floorIntensity.current, floorGoal, lerp);

    if (overheadRef.current) overheadRef.current.intensity = overheadIntensity.current;
    if (floorRef.current) floorRef.current.intensity = floorIntensity.current;
  });

  return (
    <group>
      <pointLight
        ref={overheadRef}
        position={[cx, 2.1, cz]}
        color={lightColor}
        intensity={BASE_INTENSITY}
        distance={reach}
        decay={2}
      />
      <pointLight
        ref={floorRef}
        position={[cx, 0.55, cz]}
        color={lightColor}
        intensity={BASE_FLOOR_INTENSITY}
        distance={reach * 0.85}
        decay={2}
      />
    </group>
  );
}

export function OfficeZoneLights() {
  return (
    <group>
      {OFFICE_WORK_ZONES.map((zone) => {
        if (!zone.hotspot) return null;

        return (
          <ZoneLightPair
            key={zone.id}
            zoneId={zone.id as AgentHomeZone}
            position={zone.hotspot.position}
            size={zone.hotspot.size}
            accent={zone.accent}
          />
        );
      })}
    </group>
  );
}
