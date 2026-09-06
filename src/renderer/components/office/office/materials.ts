import * as THREE from 'three';
import { OFFICE_PALETTE } from '@/components/office/config/agents.config';
import { getOfficeTextures } from '@/components/office/utils/textures/proceduralTextures';

export const OUTLINE_COLOR = OFFICE_PALETTE.outline;

export function softColor(
  color: string,
  opts?: {
    emissive?: string;
    emissiveIntensity?: number;
    map?: THREE.Texture | null;
    roughness?: number;
    metalness?: number;
  },
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    map: opts?.map ?? null,
    roughness: opts?.roughness ?? 0.96,
    metalness: opts?.metalness ?? 0.01,
    emissive: new THREE.Color(opts?.emissive ?? '#000000'),
    emissiveIntensity: opts?.emissiveIntensity ?? 0,
  });
}

function buildMaterials() {
  const tex = getOfficeTextures();

  return {
    tileSage: softColor('#eef3f1', { map: tex.tileSage, roughness: 0.82 }),
    tileGray: softColor('#f0f4f2', { map: tex.tileGray, roughness: 0.8 }),
    tileGrout: softColor(OFFICE_PALETTE.tileGrout, { roughness: 0.95 }),
    floorPlatform: softColor(OFFICE_PALETTE.floorPlatform, { map: tex.tileGray, roughness: 0.88 }),
    wall: softColor('#ffffff', { map: tex.wallPlaster, roughness: 0.94 }),
    wallMarble: softColor('#ffffff', { map: tex.wallMarble, roughness: 0.78 }),
    wallStripe: softColor(OFFICE_PALETTE.wallStripe, { roughness: 0.9 }),
    wallAccent: softColor(OFFICE_PALETTE.wallAccent, { map: tex.wallPlaster, roughness: 0.9 }),
    wood: softColor(OFFICE_PALETTE.wood, { map: tex.woodGrain, roughness: 0.78 }),
    woodLight: softColor(OFFICE_PALETTE.woodLight, { map: tex.woodGrain, roughness: 0.72 }),
    woodDark: softColor(OFFICE_PALETTE.woodDark, { map: tex.woodGrainDark, roughness: 0.74 }),
    deskTop: softColor('#ffffff', { map: tex.woodGrain, roughness: 0.68 }),
    deskLeg: softColor(OFFICE_PALETTE.deskLeg, { roughness: 0.4, metalness: 0.2 }),
    monitor: softColor(OFFICE_PALETTE.monitor, {
      emissive: OFFICE_PALETTE.monitorGlow,
      emissiveIntensity: 0.4,
      roughness: 0.24,
      metalness: 0.32,
    }),
    monitorBezel: softColor(OFFICE_PALETTE.monitor, { roughness: 0.35, metalness: 0.25 }),
    sage: softColor(OFFICE_PALETTE.sage, { map: tex.plantFoliage, roughness: 0.88 }),
    sageDark: softColor(OFFICE_PALETTE.sageDark, { map: tex.plantFoliage, roughness: 0.9 }),
    terracotta: softColor(OFFICE_PALETTE.terracotta, { roughness: 0.8 }),
    terracottaLight: softColor(OFFICE_PALETTE.terracottaLight, { roughness: 0.78 }),
    plant: softColor('#ffffff', { map: tex.plantFoliage, roughness: 0.92 }),
    plantDark: softColor(OFFICE_PALETTE.plantDark, { map: tex.plantFoliage, roughness: 0.94 }),
    plantPot: softColor(OFFICE_PALETTE.plantPot, { roughness: 0.7 }),
    potCeramic: softColor(OFFICE_PALETTE.potCeramic, { roughness: 0.32, metalness: 0.02 }),
    whiteboard: softColor(OFFICE_PALETTE.whiteboard, { roughness: 0.28 }),
    woodTable: softColor('#ffffff', { map: tex.woodGrainDark, roughness: 0.66 }),
    rug: softColor('#ffffff', { map: tex.rugJute, roughness: 0.98 }),
    rugWeave: softColor('#ffffff', { map: tex.rugWeave, roughness: 0.98 }),
    metal: softColor(OFFICE_PALETTE.metal, { roughness: 0.28, metalness: 0.65 }),
    espresso: softColor(OFFICE_PALETTE.espresso, { roughness: 0.62 }),
    stringLight: softColor(OFFICE_PALETTE.stringLight, {
      emissive: OFFICE_PALETTE.stringLight,
      emissiveIntensity: 1,
    }),
    underGlow: softColor(OFFICE_PALETTE.underGlow, {
      emissive: OFFICE_PALETTE.underGlow,
      emissiveIntensity: 0.65,
    }),
    chairMesh: softColor(OFFICE_PALETTE.chairMesh, { roughness: 0.52 }),
    chairTan: softColor(OFFICE_PALETTE.chairTan, { roughness: 0.7 }),
    chairCream: softColor(OFFICE_PALETTE.chairCream, { roughness: 0.72 }),
    chairWhite: softColor(OFFICE_PALETTE.chairWhite, { roughness: 0.68 }),
    chairForest: softColor(OFFICE_PALETTE.chairForest, { roughness: 0.74 }),
    chairYellow: softColor(OFFICE_PALETTE.chairYellow, { roughness: 0.72 }),
    stoolGray: softColor(OFFICE_PALETTE.stoolGray, { roughness: 0.62 }),
    platformWood: softColor(OFFICE_PALETTE.platformWood, { map: tex.woodGrain, roughness: 0.76 }),
    olive: softColor(OFFICE_PALETTE.olive, { roughness: 0.82 }),
    zoneMatSage: softColor(OFFICE_PALETTE.zoneMatSage, { map: tex.tileSage, roughness: 0.9 }),
    glass: softColor(OFFICE_PALETTE.glass, {
      emissive: '#a0d0d8',
      emissiveIntensity: 0.15,
      roughness: 0.12,
      metalness: 0.08,
    }),
    matTransition: softColor(OFFICE_PALETTE.matTransition, { map: tex.rugWeave, roughness: 0.92 }),
    beanBagTerracotta: softColor(OFFICE_PALETTE.terracotta, { map: tex.rugWeave, roughness: 0.94 }),
    beanBagTerracottaLight: softColor(OFFICE_PALETTE.terracottaLight, { map: tex.rugWeave, roughness: 0.93 }),
    beanBagSage: softColor(OFFICE_PALETTE.sage, { map: tex.rugWeave, roughness: 0.94 }),
    chairTerracotta: softColor(OFFICE_PALETTE.terracottaLight, { roughness: 0.68 }),
    mug: softColor(OFFICE_PALETTE.mug, { roughness: 0.35 }),
    notebook: softColor(OFFICE_PALETTE.notebook, { roughness: 0.84 }),
  };
}

export const materials = buildMaterials();
