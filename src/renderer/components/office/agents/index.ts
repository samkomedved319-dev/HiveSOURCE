/** AgentOps seam for native HiveSOURCE office — PREMADE_BOTS floor + HQ. */
export { loadAgentsConfig } from './loadAgentsConfig';
export {
  useAgentsStore,
  focusOnAgent,
  openChat,
} from './agentsStore';
export { AgentChatPanel } from './AgentChatPanel';
export { HqShell } from './HqShell';
export { mockAgentReply } from './mockLlm';
export {
  listPeerThread,
  listAllPeerMessages,
  sendPeerMessage,
  startAmbientFloorChat,
  stopAmbientFloorChat,
  subscribePeerChat,
} from './peerChat';
export type { PeerMessage } from './peerChat';
export type {
  AgentConfig,
  AgentDefinition,
  AgentStatus,
  AgentsConfigFile,
  HqConfig,
  HqPanelId,
  HomeZone,
} from './types';
