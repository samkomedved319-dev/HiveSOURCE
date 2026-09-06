import { useEffect } from 'react';
import { materials } from './materials';
import { loadOptionalTextureOverrides } from '@/components/office/utils/textures/optionalImageTextures';

export function OptionalTextureLoader() {
  useEffect(() => {
    let cancelled = false;

    void loadOptionalTextureOverrides().then((overrides) => {
      if (cancelled) return;

      if (overrides.tileSage) materials.tileSage.map = overrides.tileSage;
      if (overrides.tileGray) materials.tileGray.map = overrides.tileGray;
      if (overrides.wallPlaster) {
        materials.wall.map = overrides.wallPlaster;
        materials.wallAccent.map = overrides.wallPlaster;
      }
      if (overrides.woodGrain) {
        materials.deskTop.map = overrides.woodGrain;
        materials.woodLight.map = overrides.woodGrain;
        materials.wood.map = overrides.woodGrain;
      }
      if (overrides.rugJute) {
        materials.rug.map = overrides.rugJute;
        materials.matTransition.map = overrides.rugJute;
      }

      Object.values(materials).forEach((m) => {
        m.needsUpdate = true;
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
