import { HIGH_SCORE_STORAGE_KEY } from '../config/constants';

export function loadHighScore(): number {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    const value = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(value: number): void {
  try {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(value));
  } catch {
    // Storage unavailable (private browsing, TV OS sandbox, etc). High score
    // just won't persist across sessions — not worth surfacing to the player.
  }
}
