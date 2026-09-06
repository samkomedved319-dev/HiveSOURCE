import { useFrame } from '@react-three/fiber';
import { useAgentsStore } from '@/components/office/runtime/agents.store';
import { useSceneStore } from '@/components/office/runtime/scene.store';
import { isAgentMoving } from '@/components/office/utils/agentMovement';

export function AgentFollowCamera() {
  useFrame(() => {
    const { followAgentId, setFollowPan, setFollowAgent } = useSceneStore.getState();
    if (!followAgentId) return;

    const runtime = useAgentsStore.getState().getRuntime(followAgentId);
    if (!runtime || !isAgentMoving(runtime.status)) {
      setFollowAgent(null);
      return;
    }

    const [x, , z] = runtime.position;
    setFollowPan(x, z);
  });

  return null;
}
