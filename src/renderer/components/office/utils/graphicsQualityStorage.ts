import type { GraphicsQualityPreset } from '@/components/office/types/graphics';

const STORAGE_KEY = 'office-map-graphics-quality';

const PRESETS: GraphicsQualityPreset[] = ['high', 'balanced', 'low'];

function isPreset(value: unknown): value is GraphicsQualityPreset {
  return typeof value === 'string' && PRESETS.includes(value as GraphicsQualityPreset);
}

function detectDefaultPreset(): GraphicsQualityPreset {
  if (typeof navigator === 'undefined') return 'high';

  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;

  if (cores <= 4 || (memory !== undefined && memory <= 4)) {
    return 'balanced';
  }

  return 'high';
}

export function readGraphicsQualityPreset(): GraphicsQualityPreset {
  if (typeof window === 'undefined') return 'high';

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isPreset(raw)) return raw;
  } catch {
    // private mode / blocked storage
  }

  return detectDefaultPreset();
}

export function writeGraphicsQualityPreset(preset: GraphicsQualityPreset): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, preset);
  } catch {
    // ignore
  }
}

export function hydrateGraphicsQualityPreset(): GraphicsQualityPreset {
  const preset = readGraphicsQualityPreset();
  return preset;
}
