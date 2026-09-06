import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import { OFFICE_WORK_ZONES } from '@/components/office/config/officeZones';
import { useActiveOfficeZone } from '@/components/office/runtime/useActiveOfficeZone';
import { useAgentsStore } from '@/components/office/runtime/agents.store';
import type { AgentHomeZone } from '@/components/office/types/agent';
import { getZoneOccupancyCounts } from '@/components/office/utils/zoneOccupancy';
import {
  ZONE_PLAQUE_LABEL_KEYS,
  ZONE_SUBTITLE_KEYS,
  type WorkZoneId,
} from '@/components/office/stubs/navZones';
import { useTranslation } from '@/components/office/stubs/i18n';
import { Billboard, Text } from '@react-three/drei';
import { materials } from './materials';

function ZoneFloorAccent({
  position,
  size,
  accent,
  active,
}: {
  position: [number, number, number];
  size: [number, number];
  accent: string;
  active: boolean;
}) {
  const [px, py, pz] = position;
  const [w, h] = size;
  const pad = 0.12;
  const outlinePoints = useMemo(
    () =>
      new Float32Array([
        -(w + pad) / 2, 0, -(h + pad) / 2,
        (w + pad) / 2, 0, -(h + pad) / 2,
        (w + pad) / 2, 0, (h + pad) / 2,
        -(w + pad) / 2, 0, (h + pad) / 2,
      ]),
    [w, h, pad],
  );

  return (
    <group position={[px, py, pz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <planeGeometry args={[w + pad, h + pad]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={active ? 0.1 : 0.045}
          depthWrite={false}
        />
      </mesh>
      <lineLoop rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[outlinePoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={accent} transparent opacity={active ? 0.55 : 0.28} />
      </lineLoop>
    </group>
  );
}

function ZonePlaque({
  label,
  subtitle,
  accent,
  position,
  active,
}: {
  label: string;
  subtitle: string;
  accent: string;
  position: [number, number, number];
  active: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.11, 0]} material={materials.woodDark}>
        <cylinderGeometry args={[0.018, 0.024, 0.22, 8]} />
      </mesh>
      <Billboard position={[0, 0.28, 0]} follow lockX lockZ>
        <group>
          <mesh position={[0, 0.02, -0.012]}>
            <planeGeometry args={[1.05, active ? 0.3 : 0.26]} />
            <meshBasicMaterial color="#243830" transparent opacity={active ? 0.88 : 0.72} />
          </mesh>
          <Text
            fontSize={0.072}
            color={accent}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.006}
            outlineColor="#1f2f27"
            letterSpacing={0.04}
          >
            {label.toUpperCase()}
          </Text>
          <Text
            position={[0, -0.05, 0]}
            fontSize={0.034}
            color="#d8dde0"
            anchorX="center"
            anchorY="top"
            outlineWidth={0.004}
            outlineColor="#1f2f27"
          >
            {subtitle}
          </Text>
        </group>
      </Billboard>
    </group>
  );
}

function useZoneOccupancySnapshot(): Map<AgentHomeZone, number> {
  const [occupancy, setOccupancy] = useState(() => new Map<AgentHomeZone, number>());
  const lastKey = useRef('');

  useFrame(() => {
    const next = getZoneOccupancyCounts(useAgentsStore.getState().runtime);
    const key = [...next.entries()].map(([zone, count]) => `${zone}:${count}`).join('|');
    if (key === lastKey.current) return;
    lastKey.current = key;
    setOccupancy(next);
  });

  return occupancy;
}

export function OfficeZoneIdentity() {
  const { t } = useTranslation();
  const activeZoneId = useActiveOfficeZone();
  const occupancy = useZoneOccupancySnapshot();

  return (
    <group>
      {OFFICE_WORK_ZONES.map((zone) => {
        if (!zone.hotspot || !zone.identity) return null;
        const agentsHere = occupancy.get(zone.id as WorkZoneId) ?? 0;
        const isActive = activeZoneId === zone.id || agentsHere > 0;
        const zoneId = zone.id as WorkZoneId;

        return (
          <group key={zone.id}>
            <ZoneFloorAccent
              position={zone.hotspot.position}
              size={zone.hotspot.size}
              accent={zone.accent}
              active={isActive}
            />
            <ZonePlaque
              label={t(ZONE_PLAQUE_LABEL_KEYS[zoneId])}
              subtitle={t(ZONE_SUBTITLE_KEYS[zoneId])}
              accent={zone.accent}
              position={zone.identity.plaquePosition}
              active={isActive}
            />
          </group>
        );
      })}
    </group>
  );
}
