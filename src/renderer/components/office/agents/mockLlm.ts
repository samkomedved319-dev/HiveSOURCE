import type { AgentDefinition } from './types';

const replyIndex = new Map<string, number>();

export function mockAgentReply(agent: AgentDefinition, _userText: string): string {
  const replies = agent.hq?.mockReplies?.length ? agent.hq.mockReplies : ['Mock mode — live LLM later.'];
  const i = replyIndex.get(agent.id) ?? 0;
  replyIndex.set(agent.id, i + 1);
  return replies[i % replies.length];
}
