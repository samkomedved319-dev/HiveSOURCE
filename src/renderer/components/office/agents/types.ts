/** AgentOps + Office3D shared agent config (mock-first). Preserve hq for HQ panels. */
export type HomeZone = 'center-desk' | 'living' | 'cafeteria' | 'wall-desks';

export type AgentStatus = 'idle' | 'working' | 'blocked' | 'away';

export type HqPanelId = 'chat' | 'inbox' | 'tools' | 'settings' | string;

export interface HqConfig {
  panels?: HqPanelId[];
  tools?: string[];
  inbox?: boolean | unknown[];
  peerChat?: boolean;
  mockReplies?: string[];
}

/** Scene + HQ agent definition (hq optional; scene ignores hq/botId/status). */
export interface AgentDefinition {
  id: string;
  /** Optional bot library id (PREMADE lib-*). */
  botId?: string;
  name: string;
  role: string;
  modelId: string;
  logoUrl: string;
  avatarColor: string;
  accentColor: string;
  homeZone: HomeZone;
  wallDeskSlot?: 0 | 1 | 2;
  status?: AgentStatus;
  systemPrompt?: string;
  hq?: HqConfig;
}

export type AgentConfig = AgentDefinition;

export interface AgentsConfigFile {
  agents: AgentDefinition[];
}
