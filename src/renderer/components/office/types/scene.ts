import type { AgentHomeZone } from '@/components/office/types/agent';

export interface Waypoint {
  id: string;
  position: [number, number, number];
  zone: AgentHomeZone;
}

export interface ChatAnchor {
  position: [number, number, number];
  rotation: number;
  posture: 'stand' | 'sit';
}

export interface OfficeBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface CameraFocusTarget {
  position: [number, number, number];
  agentId: string;
}
