import { Workstation } from './Workstation';
import { DESK_SCALE, HUB_DESK_RADIUS } from './deskConstants';
import { VintageGlobe } from './WorkstationParts';

export function CentralWorkHub() {
  const r = HUB_DESK_RADIUS;
  return (
    <group position={[0.5, 0, 1.05]}>
      <Workstation
        position={[0, 0, -r]}
        rotation={Math.PI}
        chairStyle="mesh"
        props="mug"
        dualMonitor
      />
      <Workstation
        position={[0, 0, r]}
        rotation={0}
        chairStyle="terracotta"
        props="succulent"
        dualMonitor
      />
      <Workstation
        position={[-r, 0, 0]}
        rotation={-Math.PI / 2}
        chairStyle="white"
        props="notebook"
        dualMonitor
      />
      <Workstation
        position={[r, 0, 0]}
        rotation={Math.PI / 2}
        chairStyle="cream"
        props="pen"
        dualMonitor
      />
      <group scale={[DESK_SCALE, DESK_SCALE, DESK_SCALE]}>
        <VintageGlobe />
      </group>
    </group>
  );
}
