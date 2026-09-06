import type { AgentStatus } from '@/components/office/types/agent';

export function isAgentMoving(status: AgentStatus): boolean {
  return status === 'walking' || status === 'coffee-queue';
}