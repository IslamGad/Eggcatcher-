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
  /** Drops a cracked-egg decal at world-x `x`, picking one of the broken-egg art variants at random. It fades out and is recycled after SPLAT_LIFETIME_SECONDS. */
  spawn: (x: number) => void;
}

interface SplatSlot {
  active: boolean;
  x: number;
  age: number;
  rotation: number;
  baseScale: number;
}

/** Two art variants of the same decal so a run of misses doesn't paint identical splats — which one lands is picked per-spawn, not per-variant. */
const SPLAT_TEXTURE_URLS = ['/sprites/egg-broken.png', '/sprites/egg-broken-side.png'] as const;

function createSlots(): SplatSlot[] {
  return Array.from({ length: GROUND_SPLAT_POOL_SIZE }, () => ({ active: false, x: 0, age: 0, rotation: 0, baseScale: 1 }));
}

/**
 * Cracked-egg decals left where a missed egg hits the ground. Same pooled
 * InstancedMesh pattern as the falling eggs: fixed slots, no per-miss
 * allocation, one draw call per art variant regardless of how many splats
 * of that variant are on screen.
 *
 * One InstancedMesh can only ever show one texture, so the two art variants
 * each get their own independent pool (mirroring how EggManager gives each
 * egg *kind* its own EggPool) — `spawn` just flips a coin to decide which
 * pool the new splat joins.
 */
export const GroundSplats = forwardRef<GroundSplatsHandle>((_props, ref) => {
  // Hooks called explicitly (not looped over SPLAT_TEXTURE_URLS) so the call
  // count/order stays statically obvious, per React's rules of hooks.
  const textureTop = useSpriteTexture(SPLAT_TEXTURE_URLS[0]);
  const textureSide = useSpriteTexture(SPLAT_TEXTURE_URLS[1]);
  const textures = [textureTop, textureSide];
  const meshRefTop = useRef<THREE.InstancedMesh>(null);
  const meshRefSide = useRef<THREE.InstancedMesh>(null);
  const meshRefs = [meshRefTop, meshRefSide];
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const slotsPerVariant = useMemo<SplatSlot[][]>(() => SPLAT_TEXTURE_URLS.map(() => createSlots()), []);

  const status = useGameStore((s) => s.status);
  const runId = useGameStore((s) => s.runId);

  useImperativeHandle(ref, () => ({
    spawn: (x: number) => {
      const variant = Math.floor(randomRange(0, SPLAT_TEXTURE_URLS.length));
      const freeSlot = slotsPerVariant[variant].find((slot) => !slot.active);
      if (!freeSlot) return;
      freeSlot.active = true;
      freeSlot.x = x;
      freeSlot.age = 0;
      freeSlot.rotation = randomRange(-0.3, 0.3);
      freeSlot.baseScale = randomRange(0.85, 1.15);
    },
  }));

  useEffect(() => {
    for (const slots of slotsPerVariant) {
      for (const slot of slots) slot.active = false;
    }
  }, [runId, slotsPerVariant]);

  useFrame((_, delta) => {
    if (status !== 'playing') return;

    for (let variant = 0; variant < slotsPerVariant.length; variant += 1) {
      const mesh = meshRefs[variant].current;
      if (!mesh) continue;

      let visibleCount = 0;
      for (const slot of slotsPerVariant[variant]) {
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
    }
  });

  return (
    <>
      {/* frustumCulled defaults to using the base geometry's bounding sphere
          at the mesh's own local origin — it doesn't account for where
          setMatrixAt has actually scattered each instance, so THREE can (and
          reliably will, for splats far from world-x 0) cull the entire pool
          as "off camera" even while instances sit in plain view. */}
      {SPLAT_TEXTURE_URLS.map((url, variant) => (
        <instancedMesh key={url} ref={meshRefs[variant]} frustumCulled={false} args={[undefined, undefined, GROUND_SPLAT_POOL_SIZE]}>
          <planeGeometry args={[BROKEN_EGG_WIDTH, BROKEN_EGG_HEIGHT]} />
          <meshBasicMaterial map={textures[variant]} transparent alphaTest={0.05} />
        </instancedMesh>
      ))}
    </>
  );
});

GroundSplats.displayName = 'GroundSplats';
