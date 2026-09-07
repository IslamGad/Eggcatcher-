import { useFrame } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  BROKEN_EGG_HEIGHT,
  BROKEN_EGG_WIDTH,
  BROKEN_EGG_Y,
  GROUND_SPLAT_POOL_SIZE,
  SPLAT_FADE_SECONDS,
  SPLAT_LIFETIME_SECONDS,
} from '../config/constants';
import { useGameStore } from '../state/gameStore';
import { hideInstances } from '../utils/instancedMesh';
import { randomRange } from '../utils/random';
import { useSpriteTexture } from './useSpriteTexture';

export interface GroundSplatsHandle {
  /** Drops a cracked-egg decal at world-x `x`. It fades out and is recycled after SPLAT_LIFETIME_SECONDS. */
  spawn: (x: number) => void;
}

interface SplatSlot {
  active: boolean;
  x: number;
  age: number;
  rotation: number;
  baseScale: number;
}

/**
 * Cracked-egg decals left where a missed egg hits the ground. Same pooled
 * InstancedMesh pattern as the falling eggs: fixed slots, no per-miss
 * allocation, one draw call regardless of how many splats are on screen.
 */
export const GroundSplats = forwardRef<GroundSplatsHandle>((_props, ref) => {
  const texture = useSpriteTexture('/sprites/egg-broken.png');
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const slots = useMemo<SplatSlot[]>(
    () => Array.from({ length: GROUND_SPLAT_POOL_SIZE }, () => ({ active: false, x: 0, age: 0, rotation: 0, baseScale: 1 })),
    [],
  );

  const status = useGameStore((s) => s.status);
  const runId = useGameStore((s) => s.runId);

  useImperativeHandle(ref, () => ({
    spawn: (x: number) => {
      const freeSlot = slots.find((slot) => !slot.active);
      if (!freeSlot) return;
      freeSlot.active = true;
      freeSlot.x = x;
      freeSlot.age = 0;
      freeSlot.rotation = randomRange(-0.3, 0.3);
      freeSlot.baseScale = randomRange(0.85, 1.15);
    },
  }));

  useEffect(() => {
    for (const slot of slots) slot.active = false;
  }, [runId, slots]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || status !== 'playing') return;

    let visibleCount = 0;
    for (const slot of slots) {
      if (!slot.active) continue;

      slot.age += delta;
      if (slot.age >= SPLAT_LIFETIME_SECONDS) {
        slot.active = false;
        continue;
      }

      const fadeStart = SPLAT_LIFETIME_SECONDS - SPLAT_FADE_SECONDS;
      const fadeT = slot.age <= fadeStart ? 1 : Math.max(0, 1 - (slot.age - fadeStart) / SPLAT_FADE_SECONDS);
      const scale = slot.baseScale * fadeT;

      dummy.position.set(slot.x, BROKEN_EGG_Y, -0.5);
      dummy.rotation.z = slot.rotation;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(visibleCount, dummy.matrix);
      visibleCount += 1;
    }

    hideInstances(mesh, dummy, visibleCount, GROUND_SPLAT_POOL_SIZE);
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, GROUND_SPLAT_POOL_SIZE]}>
      <planeGeometry args={[BROKEN_EGG_WIDTH, BROKEN_EGG_HEIGHT]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
    </instancedMesh>
  );
});

GroundSplats.displayName = 'GroundSplats';
