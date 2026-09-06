import { getZoneWaypoints } from '@/components/office/config/agentZones.config';
import type { OfficeZoneId } from '@/components/office/config/officeZones';
import type { AgentDefinition } from '@/components/office/types/agent';

export const AVATAR_ILLUSTRATED_PALETTE: {
  avatarColor: string;
  accentColor: string;
  logoUrl: string;
}[] = [
  { avatarColor: '#9aab9e', accentColor: '#5a7358', logoUrl: '/logos/cursor.svg' },
  { avatarColor: '#c4a882', accentColor: '#8f7354', logoUrl: '/logos/research.svg' },
  { avatarColor: '#e2725b', accentColor: '#c86a48', logoUrl: '/logos/design.svg' },
  { avatarColor: '#87a685', accentColor: '#4a6b52', logoUrl: '/logos/ops.svg' },
  { avatarColor: '#d4a574', accentColor: '#a67b5b', logoUrl: '/logos/review.svg' },
  { avatarColor: '#bea078', accentColor: '#6b5340', logoUrl: '/logos/data.svg' },
];

export const OFFICE_PALETTE = {
  sceneBackground: '#1a382e',
  outline: '#3d5248',
  tileSage: '#b8c8c0',
  tileGray: '#ccd4d0',
  tileGrout: '#a8b4ae',
  floorPlatform: '#9eaaa4',
  wall: '#f0ebe3',
  wallMarble: '#ebe4d8',
  wallStripe: '#ddd4c8',
  wallAccent: '#e8e0d4',
  wood: '#c4a882',
  woodLight: '#e8d9bc',
  woodDark: '#8f7354',
  woodTable: '#6b5340',
  deskTop: '#e6d4b6',
  deskLeg: '#faf6f0',
  monitor: '#3a4038',
  monitorGlow: '#b8c9a8',
  sage: '#87a685',
  sageDark: '#5a7358',
  terracotta: '#c86a48',
  terracottaLight: '#e2725b',
  plant: '#5c9a6c',
  plantDark: '#3d6848',
  plantPot: '#b89068',
  potCeramic: '#f4f6f8',
  whiteboard: '#fafcfd',
  rug: '#a89078',
  rugWeave: '#9a8570',
  metal: '#a8b2bc',
  espresso: '#2a2a30',
  stringLight: '#ffedb8',
  underGlow: '#ffdba0',
  chairMesh: '#383e46',
  chairTan: '#bea078',
  chairCream: '#e8dece',
  chairWhite: '#f4f2ee',
  chairYellow: '#e5c76a',
  olive: '#7a8c68',
  stoolGray: '#c8ccd0',
  chairForest: '#4a6b52',
  platformWood: '#a67b5b',
  zoneMatSage: '#a8b8ae',
  matTransition: '#b0bab4',
  glass: '#b8dce4',
  mug: '#f0f2f4',
  notebook: '#faf8f4',
  selectionGlow: '#ffe9a8',
  fog: '#2a4538',
} as const;

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: 'lib-apollo',
    name: 'Apollo',
    role: 'Lead Software Engineer',
    modelId: 'nvidia/nemotron-3.5-lightning:free',
    logoUrl: '/logos/ops.svg',
    avatarColor: '#F97316',
    accentColor: '#FDBA74',
    homeZone: 'center-desk',
    systemPrompt: 'You are Apollo, Hive lead engineer.',
  },
  {
    id: 'lib-athena',
    name: 'Athena',
    role: 'Research Intelligence',
    modelId: 'minimax/minimax-m3:free',
    logoUrl: '/logos/research.svg',
    avatarColor: '#3B82F6',
    accentColor: '#93C5FD',
    homeZone: 'living',
    systemPrompt: 'You are Athena, Hive researcher.',
  },
  {
    id: 'lib-hermes',
    name: 'Hermes',
    role: 'Writer',
    modelId: 'minimax/minimax-m3:free',
    logoUrl: '/logos/design.svg',
    avatarColor: '#14B8A6',
    accentColor: '#5EEAD4',
    homeZone: 'cafeteria',
    systemPrompt: 'You are Hermes, Hive writer.',
  },
  {
    id: 'lib-hephaestus',
    name: 'Hephaestus',
    role: 'Debugger',
    modelId: 'nvidia/nemotron-3.5-lightning:free',
    logoUrl: '/logos/review.svg',
    avatarColor: '#EF4444',
    accentColor: '#FCA5A5',
    homeZone: 'wall-desks',
    wallDeskSlot: 0,
    systemPrompt: 'You are Hephaestus, Hive debugger.',
  },
  {
    id: 'lib-iris',
    name: 'Iris',
    role: 'Designer',
    modelId: 'minimax/minimax-m3:free',
    logoUrl: '/logos/design.svg',
    avatarColor: '#F43F5E',
    accentColor: '#FDA4AF',
    homeZone: 'wall-desks',
    wallDeskSlot: 1,
    systemPrompt: 'You are Iris, Hive designer.',
  },
  {
    id: 'lib-mnemosyne',
    name: 'Mnemosyne',
    role: 'Translator',
    modelId: 'minimax/minimax-m3:free',
    logoUrl: '/logos/data.svg',
    avatarColor: '#E7E5E4',
    accentColor: '#A8A29E',
    homeZone: 'wall-desks',
    wallDeskSlot: 2,
    systemPrompt: 'You are Mnemosyne, Hive translator.',
  },
];

export function getAgentsByZone(zoneId: OfficeZoneId): AgentDefinition[] {
  if (zoneId === 'all') return AGENT_DEFINITIONS;
  return AGENT_DEFINITIONS.filter((agent) => agent.homeZone === zoneId);
}

export const OFFICE_WAYPOINTS = getZoneWaypoints('center-desk');

export const SCENE_CONFIG = {
  bounds: { minX: -6.5, maxX: 7, minZ: -5.5, maxZ: 5 },
  walkSpeed: 1.05,
  idlePauseMin: 2,
  idlePauseMax: 5,
  coffeeBreakChance: 0.24,
  coffeeDurationMin: 4,
  coffeeDurationMax: 9,
} as const;
