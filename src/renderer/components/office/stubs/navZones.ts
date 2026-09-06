export type WorkZoneId = 'living' | 'center-desk' | 'cafeteria' | 'wall-desks';

export const ZONE_PLAQUE_LABEL_KEYS: Record<string, string> = {
  living: 'Living',
  'center-desk': 'Center Desk',
  cafeteria: 'Cafeteria',
  'wall-desks': 'Wall Desks',
  meeting: 'Meeting',
  all: 'Full Office',
};

export const NAV_ZONE_LABEL_KEYS = ZONE_PLAQUE_LABEL_KEYS;

export const ZONE_SUBTITLE_KEYS: Record<string, string> = {
  living: 'Puffs · meeting table',
  'center-desk': 'Four-desk team hub',
  cafeteria: 'Coffee bar',
  'wall-desks': 'Private wall desks',
};