import { useLoader } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';

/** Loads a sprite PNG and tags it with the correct color space so flat,
 *  unlit game art doesn't come out washed out or over-saturated. */
export function useSpriteTexture(url: string) {
  const texture = useLoader(THREE.TextureLoader, url);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  return texture;
}
