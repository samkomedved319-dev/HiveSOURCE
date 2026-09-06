import { useEffect } from 'react';
import { useAgentsStore } from '@/components/office/agents';
import { OfficeScene } from '@/components/office/office/OfficeScene';
import { useSceneStore } from '@/components/office/runtime/scene.store';
import { useGraphicsStore } from '@/components/office/runtime/graphics.store';
import { useSyncHiveAgentsToScene } from '@/components/office/bridgeSyncAgents';
import './office.css';

/**
 * Office3D SEAM — isometric Map.WebGL OfficeScene drop-in.
 * Hydrates agents, syncs into scene runtime, focuses camera on focusRequestId.
 * Avatar clicks call focusOnAgent + openChat via the local agents seam.
 */
export function SceneCanvas() {
  useSyncHiveAgentsToScene();

  const hydrate = useAgentsStore((s) => s.hydrate);
  const focusRequestId = useAgentsStore((s) => s.focusRequestId);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    useGraphicsStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (!focusRequestId) return;
    useSceneStore.getState().focusOnAgent(focusRequestId);
    useAgentsStore.setState({ focusRequestId: null });
  }, [focusRequestId]);

  return (
    <div className="scene-root" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <OfficeScene />
      <div className="scene-badge">Map.WebGL OfficeScene — native</div>
    </div>
  );
}
