import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { getOfficeTextures } from '@/components/office/utils/textures/proceduralTextures';

export function TextureWarmup() {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const textures = getOfficeTextures();
    Object.values(textures).forEach((t) => {
      gl.initTexture(t);
    });
  }, [gl]);

  return null;
}