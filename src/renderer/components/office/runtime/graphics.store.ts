import { create } from 'zustand';
import type { GraphicsQualityPreset } from '@/components/office/types/graphics';
import { presetToFlags } from '@/components/office/types/graphics';
import {
  hydrateGraphicsQualityPreset,
  writeGraphicsQualityPreset,
} from '@/components/office/utils/graphicsQualityStorage';

interface GraphicsStore {
  preset: GraphicsQualityPreset;
  hydrated: boolean;
  hydrate: () => void;
  setPreset: (preset: GraphicsQualityPreset) => void;
}

export const useGraphicsStore = create<GraphicsStore>((set) => ({
  preset: 'balanced',
  hydrated: false,

  hydrate: () => {
    set({
      preset: hydrateGraphicsQualityPreset(),
      hydrated: true,
    });
  },

  setPreset: (preset) => {
    writeGraphicsQualityPreset(preset);
    set({ preset, hydrated: true });
  },
}));

export function useGraphicsQualityFlags() {
  return useGraphicsStore((state) => presetToFlags(state.preset));
}
