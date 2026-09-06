import { useFrame } from '@react-three/fiber';
import { useAgentBootstrap } from '@/components/office/stubs/useBootstrap';
import { useAmbientAgentConversations } from '@/components/office/stubs/useAmbientAgentConversations';
import { useAgentsStore } from '@/components/office/runtime/agents.store';

export function useAgentMovement() {
  useAgentBootstrap();
  useAmbientAgentConversations();
  const tick = useAgentsStore((state) => state.tick);

  useFrame(
    (_, delta) => {
      tick(delta);
    },
    -1,
  );
}