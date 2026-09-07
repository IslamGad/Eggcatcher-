import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { BASKET_EDGE_MARGIN, BASKET_HEIGHT, BASKET_SPEED, BASKET_WIDTH, BASKET_Y } from '../config/constants';
import type { Direction } from '../hooks/useKeyboardControls';
import { useGameStore } from '../state/gameStore';
import { useSpriteTexture } from './useSpriteTexture';

interface BasketProps {
  directionRef: React.RefObject<Direction>;
  /** Shared with EggManager (for catch detection) and Ground/HUD if needed later. */
  basketXRef: React.RefObject<number>;
}

export function Basket({ directionRef, basketXRef }: BasketProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useSpriteTexture('/sprites/basket.png');
  const viewportWidth = useThree((s) => s.viewport.width);
  const status = useGameStore((s) => s.status);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (status === 'playing') {
      const halfRange = Math.max(0, viewportWidth / 2 - BASKET_WIDTH / 2 - BASKET_EDGE_MARGIN);
      const next = basketXRef.current + directionRef.current * BASKET_SPEED * delta;
      basketXRef.current = THREE.MathUtils.clamp(next, -halfRange, halfRange);
    }

    mesh.position.x = basketXRef.current;
  });

  return (
    <mesh ref={meshRef} position={[0, BASKET_Y, 0]}>
      <planeGeometry args={[BASKET_WIDTH, BASKET_HEIGHT]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
    </mesh>
  );
}
