import { openChat as hiveOpenChat, focusOnAgent as hiveFocus } from '@/components/office/agents';

type ChatState = {
  openChat: (id: string) => void;
};

const state: ChatState = {
  openChat: (id: string) => {
    hiveFocus(id);
    hiveOpenChat(id);
  },
};

/** Minimal store shim — AgentAvatar uses useChatStore((s) => s.openChat) */
export function useChatStore<T>(selector: (s: ChatState) => T): T {
  return selector(state);
}

useChatStore.getState = () => state;
