import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import type * as THREE from 'three';
import { WORLD_HEIGHT } from '../config/constants';

/**
 * Keeps a fixed WORLD_HEIGHT of vertical play space on screen at all times by
 * driving camera zoom from the canvas's pixel height. Horizontal space then
 * simply follows the viewport's aspect ratio, so a wide TV panel naturally
 * grants the chicken a longer rail to run instead of letterboxing the game.
 */
export function ResponsiveCamera() {
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  const size = useThree((s) => s.size);

  useLayoutEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.zoom = size.height / WORLD_HEIGHT;
    camera.updateProjectionMatrix();
  }, [size]);

  return <OrthographicCamera ref={cameraRef} makeDefault position={[0, 0, 10]} />;
}
