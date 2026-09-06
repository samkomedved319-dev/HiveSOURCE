import type { AgentsConfigFile, AgentDefinition } from './types';

const DEFAULT_URL = '/agents.json';

/**
 * Load agents config from VITE_AGENTS_CONFIG_URL or /agents.json.
 * Preserves full agent objects including hq (panels, tools, inbox, peerChat, mockReplies).
 */
export async function loadAgentsConfig(
  signal?: AbortSignal,
): Promise<AgentDefinition[]> {
  const url = import.meta.env.VITE_AGENTS_CONFIG_URL?.trim() || DEFAULT_URL;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Failed to load agents config from ${url}: ${res.status}`);
  }
  const data = (await res.json()) as AgentsConfigFile;
  if (!data?.agents || !Array.isArray(data.agents)) {
    throw new Error(`Invalid agents config at ${url}: missing agents[]`);
  }
  return data.agents;
}
