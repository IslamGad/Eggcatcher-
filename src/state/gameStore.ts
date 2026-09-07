import { create } from 'zustand';
import { GAME_DURATION_SECONDS } from '../config/constants';
import type { GameStatus } from '../types/game';
import { loadHighScore, saveHighScore } from '../utils/storage';

interface GameState {
  status: GameStatus;
  score: number;
  timeRemaining: number;
  highScore: number;
  /** Increments on every startGame() call so systems can detect a fresh run
   *  (vs. a pause/resume, which also touches `status`) and reset local refs. */
  runId: number;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  returnToMenu: () => void;
  /** Positive for a catch, negative for a rotten-egg penalty. Clamped at 0. */
  addScore: (points: number) => void;
  tickTimer: (secondsRemaining: number) => void;
}

export const useGameStore = create<GameState>((set, get) => {
  // Shared by every path that leaves an active run (natural end, or a
  // player-initiated quit from the pause menu) so a high score set by
  // quitting early is never silently lost.
  const commitHighScore = () => {
    const { score, highScore } = get();
    const nextHighScore = Math.max(score, highScore);
    if (nextHighScore !== highScore) {
      saveHighScore(nextHighScore);
      set({ highScore: nextHighScore });
    }
  };

  return {
    status: 'menu',
    score: 0,
    timeRemaining: GAME_DURATION_SECONDS,
    highScore: loadHighScore(),
    runId: 0,

    startGame: () =>
      set((s) => ({
        status: 'playing',
        score: 0,
        timeRemaining: GAME_DURATION_SECONDS,
        runId: s.runId + 1,
      })),

    pauseGame: () => set((s) => (s.status === 'playing' ? { status: 'paused' } : {})),

    resumeGame: () => set((s) => (s.status === 'paused' ? { status: 'playing' } : {})),

    endGame: () => {
      commitHighScore();
      set({ status: 'gameover' });
    },

    returnToMenu: () => {
      commitHighScore();
      set({ status: 'menu' });
    },

    addScore: (points) => set((s) => ({ score: Math.max(0, s.score + points) })),

    tickTimer: (secondsRemaining) => {
      if (secondsRemaining <= 0) {
        set({ timeRemaining: 0 });
        get().endGame();
      } else {
        set({ timeRemaining: secondsRemaining });
      }
    },
  };
});
