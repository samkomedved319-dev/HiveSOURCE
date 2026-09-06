import { useAgentsStore } from '@/components/office/runtime/agents.store';
import { AgentAvatarEntry } from './AgentAvatarEntry';
import { AgentConversationLinks } from './AgentConversationLinks';

export function AgentsLayer() {
  const definitions = useAgentsStore((s) => s.definitions);

  return (
    <group>
      <AgentConversationLinks />
      {definitions.map((def) => (
        <AgentAvatarEntry key={def.id} definition={def} />
      ))}
    </group>
  );
}
