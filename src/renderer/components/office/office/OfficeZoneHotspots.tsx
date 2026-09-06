import { OFFICE_HOTSPOT_ZONES } from '@/components/office/config/officeZones';
import { ZONE_PLAQUE_LABEL_KEYS, type WorkZoneId } from '@/components/office/stubs/navZones';
import { useTranslation } from '@/components/office/stubs/i18n';
import { useSceneStore } from '@/components/office/runtime/scene.store';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';

export function OfficeZoneHotspots() {
  const { t } = useTranslation();
  const focusedZoneId = useSceneStore((s) => s.focusedZoneId);
  const focusZone = useSceneStore((s) => s.focusZone);
  const [hovered, setHovered] = useState<string | null>(null);
  const ringsRef = useRef<Record<string, THREE.Mesh | null>>({});

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    for (const zone of OFFICE_HOTSPOT_ZONES) {
      if (!zone.hotspot) continue;
      const mesh = ringsRef.current[zone.id];
      if (!mesh) continue;
      const isFocused = focusedZoneId === zone.id;
      const isHovered = hovered === zone.id;
      const active = isFocused || isHovered ? 1 : 0;
      const pulse = 1 + Math.sin(time * 3.5) * 0.06 * active;
      mesh.scale.set(pulse, pulse, pulse);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (isFocused) {
        mat.opacity = 0.28 + Math.sin(time * 2.8) * 0.08;
      } else if (isHovered) {
        mat.opacity = 0.35 + Math.sin(time * 3.5) * 0.12;
      } else {
        mat.opacity = 0.1;
      }
    }
  });

  return (
    <group>
      {OFFICE_HOTSPOT_ZONES.map((zone) => {
        if (!zone.hotspot) return null;
        const { position, size } = zone.hotspot;
        const zoneLabel = t(ZONE_PLAQUE_LABEL_KEYS[zone.id as WorkZoneId]);
        const isFocused = focusedZoneId === zone.id;
        const isHovered = hovered === zone.id;

        return (
          <group key={zone.id} position={position}>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(zone.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHovered((current) => (current === zone.id ? null : current));
                document.body.style.cursor = 'default';
              }}
              onClick={(e) => {
                e.stopPropagation();
                focusZone(zone.id);
              }}
            >
              <planeGeometry args={size} />
              <meshBasicMaterial
                color={zone.accent}
                transparent
                opacity={isFocused ? 0.08 : isHovered ? 0.1 : 0.02}
              />
            </mesh>

            <mesh
              ref={(el) => {
                ringsRef.current[zone.id] = el;
              }}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.44, 0.56, 32]} />
              <meshBasicMaterial
                color={zone.accent}
                transparent
                opacity={isFocused ? 0.28 : 0.1}
              />
            </mesh>

            {(isHovered || isFocused) && (
              <Billboard position={[0, 0.7, 0]} follow lockX lockZ>
                <group>
                  <mesh position={[0, 0.04, -0.01]}>
                    <planeGeometry args={[1.35, 0.28]} />
                    <meshBasicMaterial color="#21342b" transparent opacity={0.72} />
                  </mesh>
                  <Text
                    fontSize={0.09}
                    color="#f5f3ef"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.008}
                    outlineColor="#1f2f27"
                  >
                    {t('zones.hotspotFocus', { label: zoneLabel })}
                  </Text>
                </group>
              </Billboard>
            )}
          </group>
        );
      })}
    </group>
  );
}
