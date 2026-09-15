import { useLoader } from '@react-three/fiber';
import type { ReactNode } from 'react';
import * as THREE from 'three';
import { PRELOAD_TEXTURE_URLS } from '../config/assets';

interface AssetPreloaderProps {
  children: ReactNode;
}

/**
 * Suspends (via useLoader's built-in Suspense integration) until every game
 * texture has loaded, decoded, and landed in the shared loader cache — then
 * renders children. Any later `useSpriteTexture(url)` call for one of these
 * same URLs (Chicken, Background, EggPool, ...) hits that cache and resolves
 * instantly instead of kicking off its own network request, which is what
 * lets the rest of the game mount already-textured on the very first frame.
 */
export function AssetPreloader({ children }: AssetPreloaderProps) {
  useLoader(THREE.TextureLoader, PRELOAD_TEXTURE_URLS as string[]);
  return <>{children}</>;
}
