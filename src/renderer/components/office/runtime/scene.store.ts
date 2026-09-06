import { create } from 'zustand';
import { getAgentFocusView } from '@/components/office/config/agentFocusView';
import { getOfficeZone, type OfficeZoneId } from '@/components/office/config/officeZones';
import { resolveActiveOfficeZone } from '@/components/office/config/resolveActiveOfficeZone';
import { useAgentsStore } from '@/components/office/runtime/agents.store';

const MIN_ZOOM = 0.55;
const MAX_ZOOM = 2.4;
const DEFAULT_ZOOM = 1;
const ZOOM_STEP = 0.12;
const PAN_LIMIT_X = 5.8;
const PAN_LIMIT_Z = 5.2;

export type ViewIntent = 'agent-focus' | 'agent-follow' | 'zone-focus' | null;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function clampPan(value: number, limit: number): number {
  return Math.min(limit, Math.max(-limit, value));
}

function clearViewIntentOnManualCamera(viewIntent: ViewIntent) {
  if (
    viewIntent === 'agent-follow' ||
    viewIntent === 'zone-focus' ||
    viewIntent === 'agent-focus'
  ) {
    return {
      followAgentId: null as string | null,
      viewIntent: null as ViewIntent,
    };
  }
  return { followAgentId: null, viewIntent };
}

interface SceneStore {
  selectedAgentId: string | null;
  followAgentId: string | null;
  panOffset: [number, number, number];
  zoomLevel: number;
  focusedZoneId: OfficeZoneId;
  viewIntent: ViewIntent;
  selectAgent: (id: string) => void;
  focusOnAgent: (id: string) => void;
  clearSelection: () => void;
  setFollowAgent: (id: string | null) => void;
  toggleFollowAgent: (id: string) => void;
  setFollowPan: (x: number, z: number) => void;
  focusZone: (id: OfficeZoneId) => void;
  addPan: (dx: number, dz: number) => void;
  setView: (pan: [number, number, number], zoom?: number, zoneId?: OfficeZoneId) => void;
  setZoomLevel: (level: number) => void;
  zoomAtWorldPoint: (delta: number, worldX: number, worldZ: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  resetView: () => void;
}

export const useSceneStore = create<SceneStore>((set, get) => ({
  selectedAgentId: null,
  followAgentId: null,
  panOffset: [0, 0, 0],
  zoomLevel: DEFAULT_ZOOM,
  focusedZoneId: 'all',
  viewIntent: null,

  selectAgent: (id) =>
    set({
      selectedAgentId: id,
    }),

  focusOnAgent: (id) => {
    const def = useAgentsStore.getState().definitions.find((agent) => agent.id === id);
    if (!def) return;

    const runtime = useAgentsStore.getState().getRuntime(id);
    const { pan, zoom } = getAgentFocusView(def, runtime?.position);
    const panOffset: [number, number, number] = [
      clampPan(pan[0], PAN_LIMIT_X),
      0,
      clampPan(pan[2], PAN_LIMIT_Z),
    ];
    const zoomLevel = clampZoom(zoom);

    set({
      selectedAgentId: id,
      followAgentId: null,
      panOffset,
      zoomLevel,
      focusedZoneId: def.homeZone,
      viewIntent: 'agent-focus',
    });
  },

  clearSelection: () =>
    set({
      selectedAgentId: null,
      followAgentId: null,
      viewIntent: null,
    }),

  setFollowAgent: (id) => {
    if (id === null) {
      set(clearViewIntentOnManualCamera(get().viewIntent));
      return;
    }

    const def = useAgentsStore.getState().definitions.find((agent) => agent.id === id);
    if (!def) return;

    const runtime = useAgentsStore.getState().getRuntime(id);
    const { pan, zoom } = getAgentFocusView(def, runtime?.position);
    const panOffset: [number, number, number] = [
      clampPan(pan[0], PAN_LIMIT_X),
      0,
      clampPan(pan[2], PAN_LIMIT_Z),
    ];

    set({
      selectedAgentId: id,
      followAgentId: id,
      panOffset,
      zoomLevel: clampZoom(zoom),
      focusedZoneId: def.homeZone,
      viewIntent: 'agent-follow',
    });
  },

  toggleFollowAgent: (id) => {
    if (get().followAgentId === id) {
      get().setFollowAgent(null);
      return;
    }
    get().setFollowAgent(id);
  },

  setFollowPan: (x, z) => {
    const panOffset: [number, number, number] = [
      clampPan(x, PAN_LIMIT_X),
      0,
      clampPan(z, PAN_LIMIT_Z),
    ];
    set({
      panOffset,
      focusedZoneId: resolveActiveOfficeZone(panOffset, get().zoomLevel),
    });
  },

  focusZone: (id) => {
    const zone = getOfficeZone(id);
    if (!zone) return;

    const panOffset: [number, number, number] = [
      clampPan(zone.pan[0], PAN_LIMIT_X),
      0,
      clampPan(zone.pan[2], PAN_LIMIT_Z),
    ];
    const zoomLevel = clampZoom(zone.zoom);

    set({
      followAgentId: null,
      panOffset,
      zoomLevel,
      focusedZoneId: id,
      viewIntent: 'zone-focus',
    });
  },

  addPan: (dx, dz) => {
    const [x, y, z] = get().panOffset;
    const panOffset: [number, number, number] = [
      clampPan(x + dx, PAN_LIMIT_X),
      y,
      clampPan(z + dz, PAN_LIMIT_Z),
    ];
    set({
      panOffset,
      focusedZoneId: resolveActiveOfficeZone(panOffset, get().zoomLevel),
      ...clearViewIntentOnManualCamera(get().viewIntent),
    });
  },

  setView: (pan, zoom, zoneId) => {
    const panOffset: [number, number, number] = [
      clampPan(pan[0], PAN_LIMIT_X),
      pan[1],
      clampPan(pan[2], PAN_LIMIT_Z),
    ];
    const zoomLevel = zoom === undefined ? get().zoomLevel : clampZoom(zoom);
    set({
      panOffset,
      zoomLevel,
      focusedZoneId: zoneId ?? resolveActiveOfficeZone(panOffset, zoomLevel),
      ...clearViewIntentOnManualCamera(get().viewIntent),
    });
  },

  setZoomLevel: (level) => {
    const zoomLevel = clampZoom(level);
    set({
      zoomLevel,
      focusedZoneId: resolveActiveOfficeZone(get().panOffset, zoomLevel),
      ...clearViewIntentOnManualCamera(get().viewIntent),
    });
  },

  zoomAtWorldPoint: (delta, worldX, worldZ) => {
    const { panOffset, zoomLevel: oldZoom, viewIntent } = get();
    const zoomLevel = clampZoom(oldZoom + delta);
    if (zoomLevel === oldZoom) return;

    const ratio = zoomLevel / oldZoom;
    const [panX, panY, panZ] = panOffset;
    const nextPan: [number, number, number] = [
      clampPan(panX + (worldX - panX) * (1 - ratio), PAN_LIMIT_X),
      panY,
      clampPan(panZ + (worldZ - panZ) * (1 - ratio), PAN_LIMIT_Z),
    ];

    set({
      zoomLevel,
      panOffset: nextPan,
      focusedZoneId: resolveActiveOfficeZone(nextPan, zoomLevel),
      ...clearViewIntentOnManualCamera(viewIntent),
    });
  },

  zoomIn: () => {
    const zoomLevel = clampZoom(get().zoomLevel - ZOOM_STEP);
    set({
      zoomLevel,
      focusedZoneId: resolveActiveOfficeZone(get().panOffset, zoomLevel),
      ...clearViewIntentOnManualCamera(get().viewIntent),
    });
  },

  zoomOut: () => {
    const zoomLevel = clampZoom(get().zoomLevel + ZOOM_STEP);
    set({
      zoomLevel,
      focusedZoneId: resolveActiveOfficeZone(get().panOffset, zoomLevel),
      ...clearViewIntentOnManualCamera(get().viewIntent),
    });
  },

  resetZoom: () => {
    const zoomLevel = DEFAULT_ZOOM;
    set({
      zoomLevel,
      focusedZoneId: resolveActiveOfficeZone(get().panOffset, zoomLevel),
      ...clearViewIntentOnManualCamera(get().viewIntent),
    });
  },

  resetView: () => {
    get().focusZone('all');
  },
}));
