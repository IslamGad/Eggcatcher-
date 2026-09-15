import { useFrame } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BASKET_HEIGHT, BASKET_WIDTH, BASKET_Y, CATCH_X_TOLERANCE, EGG_ROTATION_SPEED, GROUND_Y } from '../config/constants';
import { useGameStore } from '../state/gameStore';
import { getDifficulty } from '../systems/difficulty';
import { isEggCaught } from '../utils/collision';
import { hideInstances } from '../utils/instancedMesh';
import { useSpriteTexture } from './useSpriteTexture';

export interface EggPoolHandle {
  /**
   * Drops one egg of this pool's kind at world position (x, y). No-ops if
   * the pool is full. `fallSpeedMultiplier` (default 1) is captured on this
   * egg for its whole fall — used for angry-phase and golden-egg drops that
   * fall faster than the difficulty-driven base speed, without affecting
   * any other egg already in flight.
   */
  spawn: (x: number, y: number, fallSpeedMultiplier?: number) => void;
}

interface EggPoolProps {
  textureUrl: string;
  width: number;
  height: number;
  poolSize: number;
  elapsedRef: React.RefObject<number>;
  basketXRef: React.RefObject<number>;
  onCatch: (x: number) => void;
  onMiss: (x: number) => void;
}

interface EggSlot {
  active: boolean;
  x: number;
  y: number;
  rotation: number;
  fallSpeedMultiplier: number;
}

const BASKET_TOP_Y = BASKET_Y + BASKET_HEIGHT / 2;
const BASKET_HALF_WIDTH = BASKET_WIDTH / 2 + CATCH_X_TOLERANCE;

/**
 * One pooled, falling "kind" of egg: physics, basket-catch / ground-miss
 * detection, and instanced rendering, all self-contained behind a single
 * imperative `spawn(x)`. Callers (EggManager) decide *when* and *from where*
 * to spawn; this component owns everything that happens afterward — which
 * is what lets EggManager add a second egg kind (or a third chicken feeding
 * the same kind) without touching this file.
 */
export const EggPool = forwardRef<EggPoolHandle, EggPoolProps>(
  ({ textureUrl, width, height, poolSize, elapsedRef, basketXRef, onCatch, onMiss }, ref) => {
    const texture = useSpriteTexture(textureUrl);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const slots = useMemo<EggSlot[]>(
      () => Array.from({ length: poolSize }, () => ({ active: false, x: 0, y: 0, rotation: 0, fallSpeedMultiplier: 1 })),
      [poolSize],
    );

    const status = useGameStore((s) => s.status);
    const runId = useGameStore((s) => s.runId);

    useImperativeHandle(ref, () => ({
      spawn: (x: number, y: number, fallSpeedMultiplier = 1) => {
        const freeSlot = slots.find((slot) => !slot.active);
        if (!freeSlot) return;
        freeSlot.active = true;
        freeSlot.x = x;
        freeSlot.y = y;
        freeSlot.rotation = 0;
        freeSlot.fallSpeedMultiplier = fallSpeedMultiplier;
      },
    }));

    useEffect(() => {
      for (const slot of slots) slot.active = false;
    }, [runId, slots]);

    useFrame((_, delta) => {
      const mesh = meshRef.current;
      if (!mesh || status !== 'playing') return;

      const { fallSpeed: baseFallSpeed } = getDifficulty(elapsedRef.current);
      const basketX = basketXRef.current;

      let visibleCount = 0;
      for (const slot of slots) {
        if (!slot.active) continue;

        slot.y -= baseFallSpeed * slot.fallSpeedMultiplier * delta;
        slot.rotation += EGG_ROTATION_SPEED * delta;

        if (isEggCaught({ eggX: slot.x, eggY: slot.y, basketX, basketTopY: BASKET_TOP_Y, basketHalfWidth: BASKET_HALF_WIDTH })) {
          slot.active = false;
          onCatch(slot.x);
          continue;
        }

        if (slot.y < GROUND_Y) {
          slot.active = false;
          onMiss(slot.x);
          continue;
        }

        dummy.position.set(slot.x, slot.y, 0);
        dummy.rotation.z = slot.rotation;
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        mesh.setMatrixAt(visibleCount, dummy.matrix);
        visibleCount += 1;
      }

      hideInstances(mesh, dummy, visibleCount, poolSize);
      mesh.instanceMatrix.needsUpdate = true;
    });

    // frustumCulled defaults to using the base geometry's bounding sphere at
    // the mesh's own local origin — it doesn't account for where setMatrixAt
    // has actually scattered each instance, so THREE can (and, for a
    // per-instance-transform pool like this one, reliably will) cull the
    // entire pool as "off camera" even while instances sit in plain view.
    return (
      <instancedMesh ref={meshRef} frustumCulled={false} args={[undefined, undefined, poolSize]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
      </instancedMesh>
    );
  },
);

EggPool.displayName = 'EggPool';
