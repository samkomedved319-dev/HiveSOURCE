import * as THREE from 'three';

const OPTIONAL_PATHS = {
  tileSage: '/textures/floor-tile-sage.png',
  tileGray: '/textures/floor-tile-gray.png',
  wallPlaster: '/textures/wall-plaster.png',
  woodGrain: '/textures/wood-desk.png',
  rugJute: '/textures/rug-jute.png',
} as const;

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function imageToTexture(
  img: HTMLImageElement,
  repeat: [number, number] = [1, 1],
): THREE.Texture {
  const tex = new THREE.Texture(img);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export async function loadOptionalTextureOverrides(): Promise<Partial<Record<keyof typeof OPTIONAL_PATHS, THREE.Texture>>> {
  const entries = await Promise.all(
    Object.entries(OPTIONAL_PATHS).map(async ([key, path]) => {
      const img = await loadImage(path);
      if (!img) return [key, null] as const;
      const repeat: [number, number] =
        key === 'woodGrain' ? [2, 1] : key === 'rugJute' ? [3, 3] : [1, 1];
      return [key, imageToTexture(img, repeat)] as const;
    }),
  );

  const result: Partial<Record<keyof typeof OPTIONAL_PATHS, THREE.Texture>> = {};
  for (const [key, tex] of entries) {
    if (tex) result[key as keyof typeof OPTIONAL_PATHS] = tex;
  }
  return result;
}
