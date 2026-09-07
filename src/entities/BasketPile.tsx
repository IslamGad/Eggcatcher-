import { useFrame } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BASKET_PILE_MAX, BASKET_Y, CATCH_POP_DURATION_SECONDS, PILE_EGG_HEIGHT, PILE_EGG_WIDTH } from '../config/constants';
import { useGameStore } from '../state/gameStore';
import { easeOutBack } from '../utils/easing';
import { hideInstances } from '../utils/instancedMesh';
import { useSpriteTexture } from './useSpriteTexture';

export interface BasketPileHandle {
  /** Adds one egg to the basket's visual pile (capped at BASKET_PILE_MAX; the catch still always scores). */
  spawn: () => void;
}

interface BasketPileProps {
  basketXRef: React.RefObject<number>;
}

// Fixed local layout (fraction of basket size) so eggs read as settling into
// the basket's opening rather than floating in a perfect grid.
const PILE_LAYOUT: Array<{ dx: number; dy: number }> = [
  { dx: -0.24, dy: 0.05 },
  { dx: 0.02, dy: 0.1 },
  { dx: 0.26, dy: 0.03 },
  { dx: -0.4, dy: -0.06 },
  { dx: -0.14, dy: -0.1 },
  { dx: 0.12, dy: -0.08 },
  { dx: 0.38, dy: -0.1 },
  { dx: -0.28, dy: -0.2 },
  { dx: 0.0, dy: -0.22 },
  { dx: 0.28, dy: -0.22 },
];

export const BasketPile = forwardRef<BasketPileHandle, BasketPileProps>(({ basketXRef }, ref) => {
  const texture = useSpriteTexture('/sprites/egg.png');
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = useRef(0);
  const ages = useMemo(() => new Array<number>(BASKET_PILE_MAX).fill(0), []);

  const status = useGameStore((s) => s.status);
  const runId = useGameStore((s) => s.runId);

  useImperativeHandle(ref, () => ({
    spawn: () => {
      if (count.current >= BASKET_PILE_MAX) return;
      ages[count.current] = 0;
      count.current += 1;
    },
  }));

  useEffect(() => {
    count.current = 0;
    ages.fill(0);
  }, [runId, ages]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || status !== 'playing') return;

    const basketX = basketXRef.current;

    for (let i = 0; i < count.current; i += 1) {
      ages[i] += delta;
      const t = Math.min(1, ages[i] / CATCH_POP_DURATION_SECONDS);
      const scale = t >= 1 ? 1 : Math.max(0, easeOutBack(t));

      const layout = PILE_LAYOUT[i % PILE_LAYOUT.length];
      dummy.position.set(basketX + layout.dx, BASKET_Y + layout.dy, 0.1);
      dummy.rotation.z = 0;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    hideInstances(mesh, dummy, count.current, BASKET_PILE_MAX);
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BASKET_PILE_MAX]}>
      <planeGeometry args={[PILE_EGG_WIDTH, PILE_EGG_HEIGHT]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
    </instancedMesh>
  );
});

BasketPile.displayName = 'BasketPile';
