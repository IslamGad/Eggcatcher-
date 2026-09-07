import {
  DIFFICULTY_GROWTH_PER_TIER,
  DIFFICULTY_TIER_SECONDS,
  EGG_FALL_SPEED,
  EGG_SPAWN_INTERVAL_SECONDS,
} from '../config/constants';

interface DifficultySettings {
  fallSpeed: number;
  spawnIntervalSeconds: number;
  /** Multiplies the chicken's sweep speed. Same curve drives both, per design. */
  chickenSpeedMultiplier: number;
}

/**
 * Every full minute of active play, chicken speed and egg drop rate both
 * grow by DIFFICULTY_GROWTH_PER_TIER (compounding), ramping the game up
 * over a 5-minute run without needing a runaway/uncapped curve.
 */
export function getDifficulty(elapsedSeconds: number): DifficultySettings {
  const tier = Math.floor(elapsedSeconds / DIFFICULTY_TIER_SECONDS);
  const multiplier = DIFFICULTY_GROWTH_PER_TIER ** tier;

  return {
    fallSpeed: EGG_FALL_SPEED,
    spawnIntervalSeconds: EGG_SPAWN_INTERVAL_SECONDS / multiplier,
    chickenSpeedMultiplier: multiplier,
  };
}
