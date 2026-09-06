import { nearestZoneForPosition } from '@/components/office/config/agentZones.config';
import type { AgentHomeZone, AgentRuntimeState } from '@/components/office/types/agent';

const PRESENT_STATUSES = new Set<AgentRuntimeState['status']>([
  'idle',
  'coffee',
  'coffee-queue',
  'chatting',
]);

export function getZoneOccupancyCounts(
  runtime: Record<string, AgentRuntimeState | undefined>,
): Map<AgentHomeZone, number> {
  const counts = new Map<AgentHomeZone, number>();

  for (const state of Object.values(runtime)) {
    if (!state || !PRESENT_STATUSES.has(state.status)) continue;
    const zone = nearestZoneForPosition(state.position);
    counts.set(zone, (counts.get(zone) ?? 0) + 1);
  }

  return counts;
}

export function isZoneOccupied(
  zoneId: AgentHomeZone,
  runtime: Record<string, AgentRuntimeState | undefined>,
): boolean {
  return (getZoneOccupancyCounts(runtime).get(zoneId) ?? 0) > 0;
}
