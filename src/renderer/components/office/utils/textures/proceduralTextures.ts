import * as THREE from 'three';
import { OFFICE_PALETTE } from '@/components/office/config/agents.config';
import {
  canvasTexture,
  createCanvas,
  hexToRgb,
  paintNoise,
} from './textureHelpers';

export interface OfficeTextureSet {
  tileSage: THREE.CanvasTexture;
  tileGray: THREE.CanvasTexture;
  wallPlaster: THREE.CanvasTexture;
  wallMarble: THREE.CanvasTexture;
  woodGrain: THREE.CanvasTexture;
  woodGrainDark: THREE.CanvasTexture;
  rugJute: THREE.CanvasTexture;
  rugWeave: THREE.CanvasTexture;
  plantFoliage: THREE.CanvasTexture;
}

function fillBase(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hex: string,
): void {
  const [r, g, b] = hexToRgb(hex);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, w, h);
}

function createTileTexture(hex: string, variation: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = createCanvas(size, size);
  fillBase(ctx, size, size, hex);
  paintNoise(ctx, size, size, variation);

  ctx.fillStyle = OFFICE_PALETTE.tileGrout;
  ctx.fillRect(0, 0, size, size);

  const inset = 8;
  const [r, g, b] = hexToRgb(hex);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(inset, inset, size - inset * 2, size - inset * 2);
  paintNoise(ctx, size, size, variation * 0.5);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(inset + 2, inset + 2, size - (inset + 2) * 2, size - (inset + 2) * 2);

  return canvasTexture(canvas, [1, 1]);
}

function createWallPlaster(): THREE.CanvasTexture {
  const size = 384;
  const [canvas, ctx] = createCanvas(size, size);
  fillBase(ctx, size, size, OFFICE_PALETTE.wall);
  paintNoise(ctx, size, size, 14);

  for (let i = 0; i < 1200; i++) {
    const shade = 200 + Math.random() * 25;
    ctx.fillStyle = `rgba(${shade},${shade + 2},${shade + 4},0.12)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5);
  }

  for (let x = 0; x < size; x += 22) {
    const shade = 6 + Math.random() * 8;
    ctx.fillStyle = `rgba(${198 + shade},${202 + shade},${208 + shade},0.1)`;
    ctx.fillRect(x, 0, 6, size);
  }

  return canvasTexture(canvas, [2, 2]);
}

function createWallMarble(): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = createCanvas(size, size);
  fillBase(ctx, size, size, OFFICE_PALETTE.wallMarble);
  paintNoise(ctx, size, size, 10);

  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#c4b8a8';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.bezierCurveTo(
      Math.random() * size,
      Math.random() * size,
      Math.random() * size,
      Math.random() * size,
      Math.random() * size,
      Math.random() * size,
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  return canvasTexture(canvas, [1.5, 1.5]);
}

function createWoodGrain(hex: string, dark = false): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const [canvas, ctx] = createCanvas(w, h);
  fillBase(ctx, w, h, hex);
  paintNoise(ctx, w, h, dark ? 14 : 10);

  ctx.globalAlpha = dark ? 0.22 : 0.16;
  for (let y = 0; y < h; y += 2) {
    const [r, g, b] = hexToRgb(hex);
    const delta = (Math.sin(y * 0.15 + Math.sin(y * 0.04) * 2) + 1) * (dark ? 16 : 11);
    ctx.fillStyle = `rgb(${Math.max(0, r - delta)},${Math.max(0, g - delta)},${Math.max(0, b - delta)})`;
    ctx.fillRect(0, y, w, 1.5);
  }
  ctx.globalAlpha = 1;

  return canvasTexture(canvas, [2, 1]);
}

function createRugJute(): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = createCanvas(size, size);
  fillBase(ctx, size, size, OFFICE_PALETTE.rug);
  paintNoise(ctx, size, size, 18);

  ctx.strokeStyle = 'rgba(90,75,60,0.28)';
  ctx.lineWidth = 1.2;
  for (let i = -size; i < size * 2; i += 5) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, size);
    ctx.lineTo(i + size, 0);
    ctx.stroke();
  }

  return canvasTexture(canvas, [3, 3]);
}

function createRugWeave(): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = createCanvas(size, size);
  fillBase(ctx, size, size, OFFICE_PALETTE.rugWeave);
  paintNoise(ctx, size, size, 8);

  for (let y = 0; y < size; y += 3) {
    for (let x = 0; x < size; x += 3) {
      const weave = (Math.floor(x / 6) + Math.floor(y / 6)) % 2;
      ctx.fillStyle = weave ? 'rgba(255,255,255,0.07)' : 'rgba(60,50,42,0.06)';
      ctx.fillRect(x, y, 3, 3);
    }
  }

  ctx.strokeStyle = 'rgba(90,75,60,0.14)';
  ctx.lineWidth = 0.8;
  for (let i = -size; i < size * 2; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size * 0.5, size);
    ctx.stroke();
  }

  return canvasTexture(canvas, [3, 3]);
}

function createPlantFoliage(): THREE.CanvasTexture {
  const size = 192;
  const [canvas, ctx] = createCanvas(size, size);
  fillBase(ctx, size, size, OFFICE_PALETTE.plant);
  paintNoise(ctx, size, size, 22);

  ctx.globalAlpha = 0.15;
  ctx.fillStyle = OFFICE_PALETTE.plantDark;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * size,
      Math.random() * size,
      8 + Math.random() * 12,
      4 + Math.random() * 8,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  return canvasTexture(canvas, [1, 1]);
}

const TEXTURE_VERSION = 7;
let cached: OfficeTextureSet | null = null;
let cachedVersion = 0;

export function getOfficeTextures(): OfficeTextureSet {
  if (cached && cachedVersion === TEXTURE_VERSION) return cached;
  if (cached) {
    Object.values(cached).forEach((t) => t.dispose());
    cached = null;
  }
  cachedVersion = TEXTURE_VERSION;

  cached = {
    tileSage: createTileTexture(OFFICE_PALETTE.tileSage, 14),
    tileGray: createTileTexture(OFFICE_PALETTE.tileGray, 12),
    wallPlaster: createWallPlaster(),
    wallMarble: createWallMarble(),
    woodGrain: createWoodGrain(OFFICE_PALETTE.deskTop),
    woodGrainDark: createWoodGrain(OFFICE_PALETTE.woodTable, true),
    rugJute: createRugJute(),
    rugWeave: createRugWeave(),
    plantFoliage: createPlantFoliage(),
  };

  return cached;
}

export function disposeOfficeTextures(): void {
  if (!cached) return;
  Object.values(cached).forEach((t) => t.dispose());
  cached = null;
}
