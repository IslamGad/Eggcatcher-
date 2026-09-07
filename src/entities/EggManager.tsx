import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { CHICKEN_CONFIGS, isChickenActive } from '../config/chickens';
import type { ReactionEvent } from '../config/expressions';
import {
  ANGRY_EGG_FALL_MULTIPLIER,
  EGG_HEIGHT,
  EGG_POOL_SIZE,
  EGG_SPAWN_OFFSET_Y,
  EGG_WIDTH,
  GOLDEN_EGG_FALL_SPEED_MULTIPLIER,
  GOLDEN_EGG_INTERVAL_SECONDS,
  GOLDEN_EGG_POOL_SIZE,
  GOLDEN_EGG_SCORE,
  ROTTEN_EGG_EVERY_N_DROPS,
  ROTTEN_EGG_HEIGHT,
  ROTTEN_EGG_PENALTY,
  ROTTEN_EGG_POOL_SIZE,
  ROTTEN_EGG_WIDTH,
  SCORE_PER_CATCH,
} from '../config/constants';
import { useGameStore } from '../state/gameStore';
import { getDifficulty } from '../systems/difficulty';
import { getAngryPhase } from '../systems/chickenMood';
import { playAngrySound, playCatchSound, playGoldenDropSound, playMissSound } from '../systems/sfx';
import type { BasketPileHandle } from './BasketPile';
import type { ChickenPosition } from './Chicken';
import { EggPool, type EggPoolHandle } from './EggPool';
import type { GroundSplatsHandle } from './GroundSplats';

interface EggManagerProps {
  basketXRef: React.RefObject<number>;
  /** One current position per entry in CHICKEN_CONFIGS, written by the matching Chicken. */
  chickenPositionsRef: React.RefObject<ChickenPosition[]>;
  elapsedRef: React.RefObject<number>;
  groundSplatsRef: React.RefObject<GroundSplatsHandle | null>;
  basketPileRef: React.RefObject<BasketPileHandle | null>;
  /** Chickens read this to decide their current face — set here, not owned here. */
  reactionEventRef: React.RefObject<ReactionEvent>;
}

/**
 * Decides WHEN and FROM WHERE eggs spawn: one independent drop timer per
 * chicken, each running at the same difficulty-driven rate ("the same rate
 * as the other chicken"), so a second active chicken roughly doubles the
 * total drop rate without the two ever needing to be in lockstep.
 *
 * Each chicken also cycles through angry phases (see systems/chickenMood) —
 * while angry, every one of *that* chicken's drops is rotten and falls
 * faster, overriding the normal every-Nth-drop pattern. A separate global
 * timer drops one fast, high-value golden egg every GOLDEN_EGG_INTERVAL_SECONDS
 * regardless of any chicken's own cadence.
 *
 * This is also where every game-event sound effect is triggered — catches,
 * misses, a chicken going angry, a golden egg appearing — since this
 * component already owns the moment each of those happens. Missing a
 * *rotten* egg is deliberately silent: that's a successful dodge, not a
 * loss, so it doesn't get the "lost an egg" sound.
 *
 * All physics, collision, and rendering is delegated to the three EggPool
 * instances below — this component's only job is spawn timing, which keeps
 * it easy to reason about as the roster of chickens (or egg kinds) grows.
 */
export function EggManager({ basketXRef, chickenPositionsRef, elapsedRef, groundSplatsRef, basketPileRef, reactionEventRef }: EggManagerProps) {
  const normalPoolRef = useRef<EggPoolHandle>(null);
  const rottenPoolRef = useRef<EggPoolHandle>(null);
  const goldenPoolRef = useRef<EggPoolHandle>(null);
  const spawnTimers = useRef<number[]>(CHICKEN_CONFIGS.map(() => 0));
  const spawnCounts = useRef<number[]>(CHICKEN_CONFIGS.map(() => 0));
  const wasAngryRef = useRef<boolean[]>(CHICKEN_CONFIGS.map(() => false));
  const goldenTimerRef = useRef(0);

  const status = useGameStore((s) => s.status);
  const addScore = useGameStore((s) => s.addScore);
  const runId = useGameStore((s) => s.runId);

  useEffect(() => {
    spawnTimers.current = CHICKEN_CONFIGS.map(() => 0);
    spawnCounts.current = CHICKEN_CONFIGS.map(() => 0);
    wasAngryRef.current = CHICKEN_CONFIGS.map(() => false);
    goldenTimerRef.current = 0;
  }, [runId]);

  useFrame((_, delta) => {
    if (status !== 'playing') return;

    const { spawnIntervalSeconds } = getDifficulty(elapsedRef.current);

    CHICKEN_CONFIGS.forEach((config, i) => {
      if (!isChickenActive(config, elapsedRef.current)) return;

      const { isAngry } = getAngryPhase(config, elapsedRef.current);
      if (isAngry && !wasAngryRef.current[i]) playAngrySound();
      wasAngryRef.current[i] = isAngry;

      const interval = spawnIntervalSeconds / config.spawnRateMultiplier;
      spawnTimers.current[i] += delta;
      if (spawnTimers.current[i] < interval) return;
      spawnTimers.current[i] -= interval;
      spawnCounts.current[i] += 1;

      const isRotten = isAngry || spawnCounts.current[i] % ROTTEN_EGG_EVERY_N_DROPS === 0;
      const pool = isRotten ? rottenPoolRef : normalPoolRef;
      const position = chickenPositionsRef.current[i];
      const fallSpeedMultiplier = isAngry ? ANGRY_EGG_FALL_MULTIPLIER : 1;
      pool.current?.spawn(position.x, position.y + EGG_SPAWN_OFFSET_Y, fallSpeedMultiplier);
    });

    // Golden egg: one global timer, independent of any chicken's own drop cadence.
    goldenTimerRef.current += delta;
    if (goldenTimerRef.current >= GOLDEN_EGG_INTERVAL_SECONDS) {
      const activeIndex = CHICKEN_CONFIGS.findIndex((config) => isChickenActive(config, elapsedRef.current));
      if (activeIndex >= 0) {
        goldenTimerRef.current -= GOLDEN_EGG_INTERVAL_SECONDS;
        const position = chickenPositionsRef.current[activeIndex];
        goldenPoolRef.current?.spawn(position.x, position.y + EGG_SPAWN_OFFSET_Y, GOLDEN_EGG_FALL_SPEED_MULTIPLIER);
        reactionEventRef.current = { type: 'goldenDrop', at: elapsedRef.current };
        playGoldenDropSound();
      }
    }
  });

  return (
    <>
      <EggPool
        ref={normalPoolRef}
        textureUrl="/sprites/egg.png"
        width={EGG_WIDTH}
        height={EGG_HEIGHT}
        poolSize={EGG_POOL_SIZE}
        elapsedRef={elapsedRef}
        basketXRef={basketXRef}
        onCatch={() => {
          addScore(SCORE_PER_CATCH);
          basketPileRef.current?.spawn();
          reactionEventRef.current = { type: 'catch', at: elapsedRef.current };
          playCatchSound();
        }}
        onMiss={(x) => {
          groundSplatsRef.current?.spawn(x);
          reactionEventRef.current = { type: 'miss', at: elapsedRef.current };
          playMissSound();
        }}
      />
      <EggPool
        ref={rottenPoolRef}
        textureUrl="/sprites/egg-rotten.png"
        width={ROTTEN_EGG_WIDTH}
        height={ROTTEN_EGG_HEIGHT}
        poolSize={ROTTEN_EGG_POOL_SIZE}
        elapsedRef={elapsedRef}
        basketXRef={basketXRef}
        onCatch={() => {
          addScore(-ROTTEN_EGG_PENALTY);
          reactionEventRef.current = { type: 'rottenCatch', at: elapsedRef.current };
          playMissSound();
        }}
        onMiss={(x) => {
          // Missing a rotten egg is a successful dodge, not a loss — no sound.
          groundSplatsRef.current?.spawn(x);
          reactionEventRef.current = { type: 'miss', at: elapsedRef.current };
        }}
      />
      <EggPool
        ref={goldenPoolRef}
        textureUrl="/sprites/egg-golden.png"
        width={EGG_WIDTH}
        height={EGG_HEIGHT}
        poolSize={GOLDEN_EGG_POOL_SIZE}
        elapsedRef={elapsedRef}
        basketXRef={basketXRef}
        onCatch={() => {
          addScore(GOLDEN_EGG_SCORE);
          basketPileRef.current?.spawn();
          reactionEventRef.current = { type: 'catch', at: elapsedRef.current };
          playCatchSound();
        }}
        onMiss={(x) => {
          groundSplatsRef.current?.spawn(x);
          playMissSound();
        }}
      />
    </>
  );
}
