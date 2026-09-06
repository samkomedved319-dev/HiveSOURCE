import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { lazy, Suspense, useMemo } from 'react';
import { OFFICE_PALETTE } from '@/components/office/config/agents.config';
import { useAgentMovement } from '@/components/office/runtime/useAgentMovement';
import { useGraphicsStore } from '@/components/office/runtime/graphics.store';
import {
  isPostProcessingEnabled,
  presetToFlags,
  type GraphicsQualityFlags,
} from '@/components/office/types/graphics';
import { OfficeFloor } from './OfficeFloor';
import { OfficeLayout } from './OfficeLayout';
import { OfficeLighting } from './OfficeLighting';
import { IsometricCamera } from './IsometricCamera';
import { AgentFollowCamera } from './AgentFollowCamera';
import { AgentsLayer } from './avatars/AgentsLayer';
import { CameraPanHandler } from './CameraPanHandler';
import { CameraZoomHandler } from './CameraZoomHandler';
import { TextureWarmup } from './TextureWarmup';
import { OptionalTextureLoader } from './OptionalTextureLoader';
import { OfficeZoneHotspots } from './OfficeZoneHotspots';
import { OfficeZoneIdentity } from './OfficeZoneIdentity';
import { SceneErrorBoundary } from './SceneErrorBoundary';

const OfficePostProcessing = lazy(() =>
  import('./OfficePostProcessing').then((module) => ({
    default: module.OfficePostProcessing,
  })),
);

const BG = OFFICE_PALETTE.sceneBackground;

interface SceneContentsProps {
  qualityFlags: GraphicsQualityFlags;
  showPostProcessing: boolean;
}

function SceneContents({ qualityFlags, showPostProcessing }: SceneContentsProps) {
  useAgentMovement();

  return (
    <>
      <TextureWarmup />
      <OptionalTextureLoader />
      <IsometricCamera />
      <AgentFollowCamera />
      <CameraPanHandler />
      <CameraZoomHandler />
      <OfficeLighting />
      <OfficeFloor />
      <OfficeLayout />
      <OfficeZoneIdentity />
      <OfficeZoneHotspots />
      <ContactShadows
        position={[0.5, 0.01, 0.2]}
        opacity={0.2}
        width={14}
        height={11}
        blur={2.6}
        far={2.5}
        color="#3d5248"
      />
      <AgentsLayer />
      {showPostProcessing && (
        <SceneErrorBoundary>
          <Suspense fallback={null}>
            <OfficePostProcessing flags={qualityFlags} />
          </Suspense>
        </SceneErrorBoundary>
      )}
    </>
  );
}

export function OfficeScene() {
  const preset = useGraphicsStore((state) => state.preset);
  const qualityFlags = useMemo(() => presetToFlags(preset), [preset]);
  const showPostProcessing = isPostProcessingEnabled(preset);

  return (
    <Canvas
      orthographic
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
      camera={{
        position: [11, 12.5, 11],
        near: -50,
        far: 200,
        zoom: 1,
      }}
      style={{ background: BG }}
      onPointerMissed={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[OFFICE_PALETTE.fog, 26, 50]} />
      <SceneContents
        qualityFlags={qualityFlags}
        showPostProcessing={showPostProcessing}
      />
    </Canvas>
  );
}
