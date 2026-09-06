import { create } from 'zustand';
import type { AgentDefinition } from './types';
import { loadAgentsConfig } from './loadAgentsConfig';

export interface AgentsState {
  agents: AgentDefinition[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  /** HUD / panel selection (subscribe here). */
  selectedAgentId: string | null;
  /** Currently active chat / HQ target (subscribe here). */
  activeAgentId: string | null;
  /** Scene camera focus request — Office3D listens and clears after apply. */
  focusRequestId: string | null;
  hydrate: () => Promise<void>;
  selectAgent: (id: string | null) => void;
  focusOnAgent: (id: string) => void;
  openChat: (id: string) => void;
  closeChat: () => void;
}

/**
 * Shared agent/ops store. Panels subscribe to selectedAgentId / activeAgentId.
 * Scene: call focusOnAgent(id); Office3D reacts to focusRequestId.
 */
export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  status: 'idle',
  error: null,
  selectedAgentId: null,
  activeAgentId: null,
  focusRequestId: null,

  hydrate: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading', error: null });
    try {
      const agents = await loadAgentsConfig();
      set({ agents, status: 'ready' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ status: 'error', error: message, agents: [] });
    }
  },

  selectAgent: (id) => set({ selectedAgentId: id }),

  focusOnAgent: (id) =>
    set({ selectedAgentId: id, focusRequestId: id }),

  openChat: (id) =>
    set({ selectedAgentId: id, activeAgentId: id }),

  closeChat: () => set({ activeAgentId: null }),
}));

export function focusOnAgent(id: string): void {
  useAgentsStore.getState().focusOnAgent(id);
}

export function openChat(id: string): void {
  useAgentsStore.getState().openChat(id);
}
