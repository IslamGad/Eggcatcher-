import { GAME_DURATION_SECONDS } from './constants';

type ChickenColorVariant = 'default' | 'blue' | 'orange' | 'purple' | 'green';

/** Flat eyelid color per variant, sampled from the cream/feather tone right next to that variant's own happy-face eyes — see entities/Chicken.tsx's blink overlay. */
export const CHICKEN_EYELID_COLORS: Record<ChickenColorVariant, string> = {
  default: '#fcf0d7',
  blue: '#a6cfca',
  orange: '#f5bd84',
  purple: '#d2a8c4',
  green: '#b1daa5',
};

export interface ChickenConfig {
  id: string;
  colorVariant: ChickenColorVariant;
  /** Radians added to the shared vertical-bob phase so chickens don't bob in lockstep. */
  phaseOffset: number;
  /** Seconds of active play before this chicken appears and starts dropping eggs. */
  activeFromSeconds: number;
  /** Multiplies the shared difficulty-driven drop rate — >1 drops more often, <1 less often. */
  spawnRateMultiplier: number;
  /** Multiplies wander seek speed relative to the base rate. */
  speedMultiplier: number;
  /** World-unit offset from the baseline flight height, so simultaneous chickens fly at visibly different altitudes. */
  altitudeOffset: number;
}

const NEW_CHICKEN_INTERVAL_SECONDS = 60;
const COLOR_CYCLE: ChickenColorVariant[] = ['default', 'blue', 'orange', 'purple', 'green'];

/**
 * A new chicken joins every NEW_CHICKEN_INTERVAL_SECONDS for the length of
 * the match — the count (and so the roster) scales automatically with
 * GAME_DURATION_SECONDS rather than being hand-authored per chicken.
 * Altitude steps strictly downward (not alternating up/down) so the flight
 * band never drifts high enough to clip the top of the screen; there's
 * comfortably more headroom below toward the play area than above toward
 * the frustum edge.
 */
function generateChickenConfigs(): ChickenConfig[] {
  const count = Math.max(1, Math.ceil(GAME_DURATION_SECONDS / NEW_CHICKEN_INTERVAL_SECONDS));

  return Array.from({ length: count }, (_, i) => ({
    id: `chicken-${i}`,
    colorVariant: COLOR_CYCLE[i % COLOR_CYCLE.length],
    phaseOffset: i * 2.4,
    activeFromSeconds: i * NEW_CHICKEN_INTERVAL_SECONDS,
    spawnRateMultiplier: 1 + i * 0.15,
    speedMultiplier: 1 + i * 0.1,
    altitudeOffset: -(i * 0.7),
  }));
}

export const CHICKEN_CONFIGS: ChickenConfig[] = generateChickenConfigs();

export function isChickenActive(config: ChickenConfig, elapsedSeconds: number): boolean {
  return elapsedSeconds >= config.activeFromSeconds;
}
