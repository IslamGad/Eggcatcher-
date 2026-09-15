import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { CHICKEN_CONFIGS } from '../config/chickens';
import { CHICKEN_Y, GAME_DURATION_SECONDS } from '../config/constants';
import type { ReactionEvent } from '../config/expressions';
import { Background } from '../entities/Background';
import { Basket } from '../entities/Basket';
import { BasketPile, type BasketPileHandle } from '../entities/BasketPile';
import { Chicken, type ChickenPosition } from '../entities/Chicken';
import { EggManager } from '../entities/EggManager';
import { GroundSplats, type GroundSplatsHandle } from '../entities/GroundSplats';
import { PerfTracker } from '../entities/PerfTracker';
import { ResponsiveCamera } from '../entities/ResponsiveCamera';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { useGameStore } from '../state/gameStore';

const createChickenPositions = (): ChickenPosition[] => CHICKEN_CONFIGS.map(() => ({ x: 0, y: CHICKEN_Y }));

/**
 * Owns the per-frame, non-visual game loop (countdown timer) and the mutable
 * refs shared between entities (basket/chicken positions, elapsed time).
 * Keeping these in refs instead of the zustand store means the 60fps hot
 * path never triggers a React re-render — only score and the once-a-second
 * clock tick touch the store.
 */
export function GameScene() {
  const directionRef = useKeyboardControls();
  const basketXRef = useRef(0);
  const chickenPositionsRef = useRef<ChickenPosition[]>(createChickenPositions());
  const elapsedRef = useRef(0);
  const remainingRef = useRef(GAME_DURATION_SECONDS);
  const lastWholeSecondRef = useRef(GAME_DURATION_SECONDS);
  const groundSplatsRef = useRef<GroundSplatsHandle>(null);
  const basketPileRef = useRef<BasketPileHandle>(null);
  const reactionEventRef = useRef<ReactionEvent>({ type: 'catch', at: -999 });

  const status = useGameStore((s) => s.status);
  const runId = useGameStore((s) => s.runId);
  const tickTimer = useGameStore((s) => s.tickTimer);

  useEffect(() => {
    basketXRef.current = 0;
    chickenPositionsRef.current = createChickenPositions();
    elapsedRef.current = 0;
    remainingRef.current = GAME_DURATION_SECONDS;
    lastWholeSecondRef.current = GAME_DURATION_SECONDS;
  }, [runId]);

  useFrame((_, delta) => {
    if (status !== 'playing') return;

    elapsedRef.current += delta;
    remainingRef.current = Math.max(0, remainingRef.current - delta);

    const wholeSeconds = Math.ceil(remainingRef.current);
    if (wholeSeconds !== lastWholeSecondRef.current) {
      lastWholeSecondRef.current = wholeSeconds;
      tickTimer(wholeSeconds);
    }
  });

  return (
    <>
      <ResponsiveCamera />
      <Background showImage={status !== 'menu'} />
      <GroundSplats ref={groundSplatsRef} />
      <Basket directionRef={directionRef} basketXRef={basketXRef} />
      <BasketPile ref={basketPileRef} basketXRef={basketXRef} />
      {CHICKEN_CONFIGS.map((config, index) => (
        <Chicken
          key={config.id}
          config={config}
          index={index}
          chickenPositionsRef={chickenPositionsRef}
          elapsedRef={elapsedRef}
          reactionEventRef={reactionEventRef}
        />
      ))}
      <EggManager
        basketXRef={basketXRef}
        chickenPositionsRef={chickenPositionsRef}
        elapsedRef={elapsedRef}
        groundSplatsRef={groundSplatsRef}
        basketPileRef={basketPileRef}
        reactionEventRef={reactionEventRef}
      />
      <PerfTracker />
    </>
  );
}
