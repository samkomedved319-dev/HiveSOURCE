import type { IconName } from '@/components/office/stubs/UiIcon';
import { COFFEE_LOUNGE_CENTER_Z } from '@/components/office/office/furniture/coffeeLoungeConstants';
import { PRIVATE_DESK_CENTER, PRIVATE_DESK_SPAN_Z } from '@/components/office/office/furniture/deskConstants';
import { MEETING_ZONE_POSITION } from '@/components/office/office/furniture/meetingConstants';

export type OfficeZoneId = 'all' | 'living' | 'center-desk' | 'cafeteria' | 'wall-desks';

export interface OfficeZoneLink {
  id: OfficeZoneId;
  /** @deprecated Use i18n keys via `ZONE_PLAQUE_LABEL_KEYS` / `NAV_ZONE_LABEL_KEYS` */
  label: string;
  /** @deprecated Use i18n keys via `NAV_ZONE_LABEL_KEYS` */
  shortLabel: string;
  sceneKey: 'overview' | 'MeetingZone' | 'CentralWorkHub' | 'CoffeeLounge' | 'PrivateDesk';
  icon: IconName;
  pan: [number, number, number];
  zoom: number;
  accent: string;
  identity?: {
    /** @deprecated Use i18n keys via `ZONE_SUBTITLE_KEYS` */
    subtitle: string;
    plaquePosition: [number, number, number];
  };
  hotspot?: {
    position: [number, number, number];
    size: [number, number];
  };
}

export const OFFICE_ZONE_LINKS: OfficeZoneLink[] = [
  {
    id: 'all',
    label: 'Full Office',
    shortLabel: 'All',
    sceneKey: 'overview',
    icon: 'home',
    pan: [0, 0, 0],
    zoom: 1,
    accent: '#d4a574',
  },
  {
    id: 'living',
    label: 'Living',
    shortLabel: 'Living',
    sceneKey: 'MeetingZone',
    icon: 'living',
    pan: [MEETING_ZONE_POSITION[0], 0, MEETING_ZONE_POSITION[2]],
    zoom: 0.82,
    accent: '#e8dcc8',
    identity: {
      subtitle: 'Puffs Â· meeting table',
      plaquePosition: [-4.35, 0, 0.82],
    },
    hotspot: {
      position: [MEETING_ZONE_POSITION[0], 0.015, MEETING_ZONE_POSITION[2]],
      size: [2.9, 2.6],
    },
  },
  {
    id: 'center-desk',
    label: 'Center Desk',
    shortLabel: 'Center',
    sceneKey: 'CentralWorkHub',
    icon: 'center-desk',
    pan: [0.5, 0, 1.05],
    zoom: 0.78,
    accent: '#c9925a',
    identity: {
      subtitle: 'Four-desk team hub',
      plaquePosition: [0.5, 0, 2.72],
    },
    hotspot: { position: [0.5, 0.015, 1.05], size: [4.1, 3.5] },
  },
  {
    id: 'cafeteria',
    label: 'Cafeteria',
    shortLabel: 'CafÃ©',
    sceneKey: 'CoffeeLounge',
    icon: 'cafeteria',
    pan: [0, 0, COFFEE_LOUNGE_CENTER_Z + 0.15],
    zoom: 0.82,
    accent: '#b8c9a8',
    identity: {
      subtitle: 'Coffee bar Â· lounge',
      plaquePosition: [0, 0, -3.35],
    },
    hotspot: {
      position: [0, 0.015, COFFEE_LOUNGE_CENTER_Z],
      size: [5.4, 2.9],
    },
  },
  {
    id: 'wall-desks',
    label: 'Wall Desks',
    shortLabel: 'Desks',
    sceneKey: 'PrivateDesk',
    icon: 'wall-desks',
    pan: [PRIVATE_DESK_CENTER[0], 0, PRIVATE_DESK_CENTER[2]],
    zoom: 0.78,
    accent: '#8fa38c',
    identity: {
      subtitle: 'Private workstations',
      plaquePosition: [4.85, 0, PRIVATE_DESK_CENTER[2]],
    },
    hotspot: {
      position: [PRIVATE_DESK_CENTER[0], 0.015, PRIVATE_DESK_CENTER[2]],
      size: [2.2, PRIVATE_DESK_SPAN_Z + 0.65],
    },
  },
];

export const OFFICE_HOTSPOT_ZONES = OFFICE_ZONE_LINKS.filter((z) => z.hotspot);

export const OFFICE_WORK_ZONES = OFFICE_ZONE_LINKS.filter((z) => z.id !== 'all');

export function getOfficeZone(id: OfficeZoneId): OfficeZoneLink | undefined {
  return OFFICE_ZONE_LINKS.find((z) => z.id === id);
}
