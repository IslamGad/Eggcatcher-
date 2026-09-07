import { ANGRY_CYCLE_NORMAL_SECONDS, ANGRY_DURATION_SECONDS } from '../config/constants';
import type { ChickenConfig } from '../config/chickens';

interface AngryPhase {
  isAngry: boolean;
  /** Seconds into the current phase (normal or angry) — used for fade-in/out timing during angry. */
  phaseElapsedSeconds: number;
}

const CYCLE_SECONDS = ANGRY_CYCLE_NORMAL_SECONDS + ANGRY_DURATION_SECONDS;

/**
 * Pure function of "how long has this chicken been active" — every
 * ANGRY_CYCLE_NORMAL_SECONDS of normal behavior, it flares up angry for
 * ANGRY_DURATION_SECONDS, repeating for the rest of the run. Being a pure
 * function (not a stored/mutated flag) means both the visual side (Chicken)
 * and the spawn-behavior side (EggManager) derive the identical state
 * independently every frame, with nothing to keep in sync.
 */
export function getAngryPhase(config: ChickenConfig, elapsedSeconds: number): AngryPhase {
  const activeSeconds = elapsedSeconds - config.activeFromSeconds;
  if (activeSeconds < 0) return { isAngry: false, phaseElapsedSeconds: 0 };

  const cyclePosition = activeSeconds % CYCLE_SECONDS;
  const isAngry = cyclePosition >= ANGRY_CYCLE_NORMAL_SECONDS;
  const phaseElapsedSeconds = isAngry ? cyclePosition - ANGRY_CYCLE_NORMAL_SECONDS : cyclePosition;

  return { isAngry, phaseElapsedSeconds };
}
