import { useEffect, useRef } from 'react';
import { useAgentsStore as useHiveAgentsStore } from '@/components/office/agents';
import type { AgentDefinition as HiveAgent } from '@/components/office/agents';
import { useAgentsStore as useSceneAgentsStore } from '@/components/office/runtime/agents.store';
import type { AgentDefinition as SceneAgent } from '@/components/office/types/agent';
import { applyAvatarDesigns } from '@/components/office/config/avatarDesigns';
import type { AgentHomeZone } from '@/components/office/types/agent';

const VALID_ZONES: AgentHomeZone[] = ['living', 'center-desk', 'cafeteria', 'wall-desks'];

function toSceneAgent(agent: HiveAgent): SceneAgent {
  const homeZone = VALID_ZONES.includes(agent.homeZone as AgentHomeZone)
    ? (agent.homeZone as AgentHomeZone)
    : 'center-desk';

  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    modelId: agent.modelId,
    logoUrl: agent.logoUrl,
    avatarColor: agent.avatarColor,
    accentColor: agent.accentColor,
    homeZone,
    wallDeskSlot: agent.wallDeskSlot,
  };
}

function signature(agents: HiveAgent[]): string {
  return agents
    .map((a) => `${a.id}:${a.homeZone}:${a.wallDeskSlot ?? ''}:${a.name}`)
    .sort()
    .join('|');
}

/** Sync hydrated HiveOffice agents into the scene movement/runtime store. */
export function useSyncHiveAgentsToScene() {
  const status = useHiveAgentsStore((s) => s.status);
  const agents = useHiveAgentsStore((s) => s.agents);
  const lastSig = useRef<string>('');

  useEffect(() => {
    if (status !== 'ready' || agents.length === 0) return;
    const sig = signature(agents);
    if (sig === lastSig.current) return;
    lastSig.current = sig;

    const defs = applyAvatarDesigns(agents.map(toSceneAgent));
    const store = useSceneAgentsStore.getState();
    store.setDefinitions(defs);
    store.initialize();
  }, [status, agents]);
}