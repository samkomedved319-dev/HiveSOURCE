import type { GraphicsQualityFlags } from '@/components/office/types/graphics';

interface OfficePostProcessingProps {
  flags: GraphicsQualityFlags;
}

/** No-op until Codder adds @react-three/postprocessing + postprocessing. */
export function OfficePostProcessing(_props: OfficePostProcessingProps) {
  return null;
}