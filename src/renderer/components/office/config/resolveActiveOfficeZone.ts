import { OFFICE_ZONE_LINKS, OFFICE_WORK_ZONES, type OfficeZoneId } from '@/components/office/config/officeZones';

const OVERVIEW = OFFICE_ZONE_LINKS.find((z) => z.id === 'all')!;

function panDistance(
  pan: [number, number, number],
  target: [number, number, number],
): number {
  return Math.hypot(pan[0] - target[0], pan[2] - target[2]);
}

function matchesPresetView(
  pan: [number, number, number],
  zoom: number,
  zonePan: [number, number, number],
  zoneZoom: number,
): boolean {
  return panDistance(pan, zonePan) < 0.45 && Math.abs(zoom - zoneZoom) < 0.14;
}export function resolveActiveOfficeZone(
  pan: [number, number, number],
  zoom: number,
): OfficeZoneId {
  for (const zone of OFFICE_ZONE_LINKS) {
    if (matchesPresetView(pan, zoom, zone.pan, zone.zoom)) {
      return zone.id;
    }
  }

  const overviewPanDist = panDistance(pan, OVERVIEW.pan);
  if (overviewPanDist < 1.25 && Math.abs(zoom - OVERVIEW.zoom) < 0.22) {
    return 'all';
  }

  let nearest: OfficeZoneId = 'all';
  let nearestDist = Infinity;

  for (const zone of OFFICE_WORK_ZONES) {
    const dist = panDistance(pan, zone.pan);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = zone.id;
    }
  }

  return nearestDist <= 2.35 ? nearest : 'all';
}
