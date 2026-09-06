export type GraphicsQualityPreset = 'high' | 'balanced' | 'low';

export interface GraphicsQualityFlags {
  ao: boolean;
  bloom: boolean;
  colorGrade: boolean;
}

export function presetToFlags(preset: GraphicsQualityPreset): GraphicsQualityFlags {
  switch (preset) {
    case 'high':
      return { ao: true, bloom: true, colorGrade: true };
    case 'balanced':
      return { ao: false, bloom: true, colorGrade: true };
    case 'low':
      return { ao: false, bloom: false, colorGrade: false };
  }
}

export function isPostProcessingEnabled(preset: GraphicsQualityPreset): boolean {
  const flags = presetToFlags(preset);
  return flags.ao || flags.bloom || flags.colorGrade;
}
