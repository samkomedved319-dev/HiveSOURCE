import { getAgentChatAnchor } from '@/components/office/config/agentZones.config';
import { getOfficeZone } from '@/components/office/config/officeZones';
import type { AgentDefinition } from '@/components/office/types/agent';
export const AGENT_FOCUS_ZOOM = 0.62;

export function getAgentFocusView(
  def: AgentDefinition,
  livePosition?: [number, number, number],
): { pan: [number, number, number]; zoom: number } {
  const anchor = getAgentChatAnchor(def);
  const [x, , z] = livePosition ?? anchor.position;
  const zone = getOfficeZone(def.homeZone);
  const zoom = zone ? Math.min(zone.zoom - 0.12, AGENT_FOCUS_ZOOM) : AGENT_FOCUS_ZOOM;

  return {
    pan: [x, 0, z],
    zoom: Math.max(0.55, zoom),
  };
}
