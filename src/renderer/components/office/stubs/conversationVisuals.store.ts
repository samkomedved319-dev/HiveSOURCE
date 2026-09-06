import { create } from 'zustand';
import type { UserChatVisualMode } from '@/components/office/stubs/chatVisualMode';

export interface PeerConversation {
  id: string;
  agentA: string;
  agentB: string;
  endsAt: number;
  lastMessage: string;
  lastSpeakerId: string | null;
  generatingAgentId: string | null;
  streaming: boolean;
}

interface ConversationVisualsState {
  peerConversations: PeerConversation[];
  userChatAgentId: string | null;
  userChatMode: UserChatVisualMode;
}

export const useConversationVisualsStore = create<ConversationVisualsState>(() => ({
  peerConversations: [],
  userChatAgentId: null,
  userChatMode: 'off',
}));